import React, { useState, useEffect } from 'react';
import { Position, PositionCategory } from '../types';

interface PositionFormProps {
  onSave: (position: Position) => void;
  onCancel: () => void;
  positionToEdit?: Position;
}

const positionCategories: PositionCategory[] = ['Staking', 'Yield Farming', 'Lending', 'Stocks', 'Other'];

const PositionForm: React.FC<PositionFormProps> = ({ onSave, onCancel, positionToEdit }) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<PositionCategory>('Staking');
  const [principal, setPrincipal] = useState('');
  const [apy, setApy] = useState('');
  const [startDate, setStartDate] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (positionToEdit) {
      setName(positionToEdit.name);
      setCategory(positionToEdit.category);
      setPrincipal(String(positionToEdit.principal));
      setApy(String(positionToEdit.apy));
      setStartDate(positionToEdit.startDate);
      setDescription(positionToEdit.description || '');
    } else {
        // Set default start date to today for new positions
        setStartDate(new Date().toISOString().split('T')[0]);
    }
  }, [positionToEdit]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !principal || !apy || !startDate) {
        alert("Please fill in all required fields.");
        return;
    }

    const newPosition: Position = {
      id: positionToEdit?.id || Date.now().toString(),
      name,
      category,
      principal: parseFloat(principal),
      apy: parseFloat(apy),
      startDate,
      description,
    };
    onSave(newPosition);
  };
  
  const commonInputStyle = "w-full bg-gray-800/50 border border-white/10 rounded-md px-4 py-2 text-white focus:ring-2 focus:ring-fuchsia-500 focus:outline-none";

  return (
     <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in-fast" role="dialog" aria-modal="true">
       <style>{`
          @keyframes fade-in-fast {
              from { opacity: 0; transform: scale(0.95); }
              to { opacity: 1; transform: scale(1); }
          }
          .animate-fade-in-fast { animation: fade-in-fast 0.2s ease-out; }
      `}</style>
      <div className="bg-gray-900 border border-white/10 rounded-lg shadow-2xl max-w-lg w-full">
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <h3 className="text-xl font-bold text-white mb-2">{positionToEdit ? 'Edit Position' : 'Add New Position'}</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="text-xs text-gray-400">Position Name</label>
                    <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. ETH Staking" required className={`${commonInputStyle} mt-1`} />
                </div>
                <div>
                    <label className="text-xs text-gray-400">Category</label>
                     <select value={category} onChange={e => setCategory(e.target.value as PositionCategory)} className={`${commonInputStyle} mt-1`}>
                        {positionCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                </div>
            </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="text-xs text-gray-400">Principal ($)</label>
                    <input type="number" step="any" value={principal} onChange={e => setPrincipal(e.target.value)} placeholder="1000.00" required className={`${commonInputStyle} mt-1`} />
                </div>
                <div>
                    <label className="text-xs text-gray-400">APY (%)</label>
                    <input type="number" step="any" value={apy} onChange={e => setApy(e.target.value)} placeholder="5.5" required className={`${commonInputStyle} mt-1`} />
                </div>
            </div>

            <div>
                <label className="text-xs text-gray-400">Start Date</label>
                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} required className={`${commonInputStyle} mt-1`} />
            </div>

             <div>
                <label className="text-xs text-gray-400">Description (Optional)</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} className={`${commonInputStyle} mt-1`} />
            </div>

            <div className="flex justify-end gap-4 pt-4 border-t border-white/10">
                <button type="button" onClick={onCancel} className="px-6 py-2 rounded-md text-sm font-medium bg-gray-600/50 hover:bg-gray-600 text-white transition-colors">
                    Cancel
                </button>
                <button type="submit" className="px-6 py-2 rounded-md text-sm font-medium bg-fuchsia-600 hover:bg-fuchsia-700 text-white transition-colors">
                    {positionToEdit ? 'Save Changes' : 'Add Position'}
                </button>
            </div>
        </form>
      </div>
    </div>
  );
};

export default PositionForm;
