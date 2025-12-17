// componentsAdmin/BuildingManager.jsx

import React, { useState, useEffect } from 'react';
import { ChevronLeft, Building2, Plus, Trash2, Edit2, X, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../supabaseClient';

const BuildingManager = ({ onNavigate, user }) => {
  const [buildings, setBuildings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const [formData, setFormData] = useState({
    building_code: '',
    building_name: '',
    building_type: 'academic',
    description: '',
    color: '#601214',
    // Default coordinates for map placement
    coordinates: { x: 100, y: 100, width: 80, height: 60 },
    is_active: true
  });

  const buildingTypes = [
    { value: 'academic', label: 'Academic Building' },
    { value: 'workshop', label: 'Workshop' },
    { value: 'medical', label: 'Medical' },
    { value: 'cafeteria', label: 'Cafeteria' },
    { value: 'sports', label: 'Sports Facility' },
    { value: 'admin', label: 'Administration' },
    { value: 'arts', label: 'Arts' },
    { value: 'student', label: 'Student Services' },
    { value: 'parking', label: 'Parking' },
    { value: 'open', label: 'Open Area' },
  ];

  useEffect(() => {
    fetchBuildings();
  }, []);

  const fetchBuildings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('buildings')
        .select('*')
        .order('building_name');

      if (error) throw error;
      setBuildings(data || []);
      setError('');
    } catch (error) {
      console.error('Error fetching buildings:', error);
      setError('Failed to load buildings: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    if (field.includes('coordinates.')) {
      const coordField = field.split('.')[1];
      setFormData({
        ...formData,
        coordinates: {
          ...formData.coordinates,
          [coordField]: parseInt(value) || 0
        }
      });
    } else {
      setFormData({ ...formData, [field]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.building_code.trim() || !formData.building_name.trim()) {
      setError('Building code and name are required');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        building_code: formData.building_code.trim(),
        building_name: formData.building_name.trim(),
        building_type: formData.building_type,
        description: formData.description.trim(),
        color: formData.color,
        coordinates: formData.coordinates, 
        is_active: formData.is_active,
        created_by: user?.id
      };

      if (editingId) {
        const { error } = await supabase
          .from('buildings')
          .update({ ...payload, updated_at: new Date().toISOString() })
          .eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('buildings')
          .insert([payload]);
        if (error) throw error;
      }

      resetForm();
      fetchBuildings();
    } catch (error) {
      console.error('Error saving building:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (building) => {
    setFormData({
      building_code: building.building_code,
      building_name: building.building_name,
      building_type: building.building_type,
      description: building.description || '',
      color: building.color || '#601214',
      coordinates: building.coordinates || { x: 100, y: 100, width: 80, height: 60 },
      is_active: building.is_active
    });
    setEditingId(building.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this building?')) return;
    try {
      const { error } = await supabase.from('buildings').delete().eq('id', id);
      if (error) throw error;
      fetchBuildings();
    } catch (error) {
      setError(error.message);
    }
  };

  const handleToggleStatus = async (building) => {
      try {
        const { error } = await supabase.from('buildings').update({ is_active: !building.is_active }).eq('id', building.id);
        if(error) throw error;
        fetchBuildings();
      } catch (e) { setError(e.message); }
  };

  const resetForm = () => {
    setFormData({
      building_code: '', building_name: '', building_type: 'academic',
      description: '', color: '#601214',
      coordinates: { x: 100, y: 100, width: 80, height: 60 },
      is_active: true
    });
    setEditingId(null);
    setShowForm(false);
    setError('');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
       {/* Header */}
       <div className="bg-white px-6 pt-12 pb-6 flex items-center border-b border-gray-100 sticky top-0 z-20">
        <button onClick={() => onNavigate('admin')} className="p-2 -ml-2 mr-2 hover:bg-gray-100 rounded-full text-gray-700">
          <ChevronLeft size={24} />
        </button>
        <div className="flex items-center gap-3">
          <div className="bg-[#601214] p-2 rounded-xl">
            <Building2 className="text-white" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Building Manager</h1>
            <p className="text-gray-500 text-sm">Add or edit map buildings</p>
          </div>
        </div>
      </div>

      <div className="flex-1 p-6">
        {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">{error}</div>}

        {!showForm && (
          <div className="mb-6 flex justify-between">
             <h2 className="text-xl font-bold">Existing Buildings</h2>
             <button onClick={() => setShowForm(true)} className="bg-[#601214] text-white px-4 py-2 rounded-lg flex items-center gap-2">
               <Plus size={18} /> Add Building
             </button>
          </div>
        )}

        {showForm && (
          <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 mb-6">
            <div className="flex justify-between mb-4">
               <h3 className="font-bold text-lg">{editingId ? 'Edit Building' : 'New Building'}</h3>
               <button onClick={resetForm}><X size={20} className="text-gray-400" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <input placeholder="Code (e.g., SCI)" value={formData.building_code} onChange={e => handleInputChange('building_code', e.target.value)} className="border p-2 rounded-lg" required />
                <input placeholder="Name (e.g., Science Hall)" value={formData.building_name} onChange={e => handleInputChange('building_name', e.target.value)} className="border p-2 rounded-lg" required />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <select value={formData.building_type} onChange={e => handleInputChange('building_type', e.target.value)} className="border p-2 rounded-lg">
                   {buildingTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
                <div className="flex items-center gap-2 border rounded-lg p-1">
                   <input type="color" value={formData.color} onChange={e => handleInputChange('color', e.target.value)} className="w-8 h-8 cursor-pointer" />
                   <span className="text-sm">Color: {formData.color}</span>
                </div>
              </div>

              <textarea placeholder="Description" value={formData.description} onChange={e => handleInputChange('description', e.target.value)} className="w-full border p-2 rounded-lg" rows={2} />

              <div className="bg-gray-50 p-4 rounded-xl">
                 <p className="text-sm font-bold text-gray-700 mb-2">Map Coordinates (for visualization)</p>
                 <div className="grid grid-cols-4 gap-2">
                    {['x', 'y', 'width', 'height'].map(coord => (
                      <div key={coord}>
                        <label className="block text-xs uppercase text-gray-500 mb-1">{coord}</label>
                        <input type="number" value={formData.coordinates[coord]} onChange={e => handleInputChange(`coordinates.${coord}`, e.target.value)} className="w-full border p-2 rounded-lg text-sm" />
                      </div>
                    ))}
                 </div>
              </div>

              <div className="flex gap-2">
                 <button type="submit" disabled={loading} className="flex-1 bg-[#601214] text-white py-3 rounded-xl font-bold">
                    {loading ? 'Saving...' : 'Save Building'}
                 </button>
                 <button type="button" onClick={resetForm} className="px-6 bg-gray-200 text-gray-700 rounded-xl font-bold">Cancel</button>
              </div>
            </form>
          </div>
        )}

        {/* List */}
        <div className="grid gap-3">
          {buildings.map(b => (
            <div key={b.id} className="bg-white p-4 rounded-xl border border-gray-100 flex justify-between items-center shadow-sm">
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-xs" style={{ backgroundColor: b.color }}>
                     {b.building_code}
                  </div>
                  <div>
                     <h4 className="font-bold">{b.building_name}</h4>
                     <p className="text-xs text-gray-500 capitalize">{b.building_type}</p>
                  </div>
               </div>
               <div className="flex gap-2">
                  <button onClick={() => handleToggleStatus(b)} className={`p-2 rounded-lg ${b.is_active ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'}`} title={b.is_active ? 'Visible' : 'Hidden'}>{b.is_active ? <Eye size={16}/> : <EyeOff size={16}/>}</button>
                  <button onClick={() => handleEdit(b)} className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Edit2 size={16} /></button>
                  <button onClick={() => handleDelete(b.id)} className="p-2 bg-red-50 text-red-600 rounded-lg"><Trash2 size={16} /></button>
               </div>
            </div>
          ))}
          {buildings.length === 0 && !loading && (
             <p className="text-center text-gray-500 mt-10">No buildings found. Add one above.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default BuildingManager;