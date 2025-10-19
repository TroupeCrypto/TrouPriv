
import React, { useState, useEffect, useMemo } from 'react';
import { Position } from '../types';
import { BusinessIcon } from '../components/icons/Icons';
import PositionCard from '../components/PositionCard';
import PositionForm from '../components/PositionForm';
import ConfirmationDialog from '../components/ConfirmationDialog';

interface BusinessProps {
  positions: Position[];
  setPositions: React.Dispatch<React.SetStateAction<Position[]>>;
}

const SummaryCard: React.FC<{ title: string; value: string; colorClass: string }> = ({ title, value, colorClass }) => (
    <div className={`bg-gray-900/50 p-6 rounded-lg border border-white/10 relative overflow-hidden`}>
        <div className={`absolute top-0 left-0 h-1 w-full bg-gradient-to-r ${colorClass}`}></div>
        <p className="text-gray-400 text-sm">{title}</p>
        <p className="text-3xl font-bold text-white mt-1 font-mono">{value}</p>
    </div>
);


const Business: React.FC<BusinessProps> = ({ positions, setPositions }) => {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [positionToEdit, setPositionToEdit] = useState<Position | null>(null);
    const [positionToDelete, setPositionToDelete] = useState<Position | null>(null);
    const [earnings, setEarnings] = useState<Record<string, number>>({});

    useEffect(() => {
        const calculateAllEarnings = () => {
            const now = Date.now();
            const newEarnings: Record<string, number> = {};
            positions.forEach(pos => {
                const startDate = new Date(pos.startDate).getTime();
                if (isNaN(startDate) || !pos.apy || !pos.principal) {
                    newEarnings[pos.id] = 0;
                    return;
                }
                const elapsedMilliseconds = now - startDate;
                const elapsedYears = elapsedMilliseconds / (1000 * 60 * 60 * 24 * 365.25);
                const totalEarnings = pos.principal * (pos.apy / 100) * elapsedYears;
                newEarnings[pos.id] = totalEarnings;
            });
            setEarnings(newEarnings);
        };

        calculateAllEarnings(); // Initial calculation
        const intervalId = setInterval(calculateAllEarnings, 1000); // Update every second

        return () => clearInterval(intervalId);
    }, [positions]);

    const totalPrincipal = useMemo(() => positions.reduce((acc: number, pos) => acc + pos.principal, 0), [positions]);
    // FIX: Explicitly type the accumulator `acc` to `number` to fix the type inference issue.
    const totalEarnings = useMemo(() => Object.values(earnings).reduce((acc: number, val) => acc + (val as number), 0), [earnings]);
    const totalCurrentValue = totalPrincipal + totalEarnings;

    const handleAddNew = () => {
        setPositionToEdit(null);
        setIsFormOpen(true);
    };

    const handleEdit = (position: Position) => {
        setPositionToEdit(position);
        setIsFormOpen(true);
    };
    
    const handleDelete = (position: Position) => {
        setPositionToDelete(position);
    };

    const handleSavePosition = (position: Position) => {
        if (positionToEdit) {
            setPositions(prev => prev.map(p => p.id === position.id ? position : p));
        } else {
            setPositions(prev => [...prev, position]);
        }
        setIsFormOpen(false);
        setPositionToEdit(null);
    };
    
    const handleConfirmDelete = () => {
        if (positionToDelete) {
            setPositions(prev => prev.filter(p => p.id !== positionToDelete.id));
            setPositionToDelete(null);
        }
    };

    return (
        <div className="space-y-6">
            <header className="pb-4 border-b border-white/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-3">
                    <BusinessIcon className="w-8 h-8 text-cyan-400" />
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-white">Business</h1>
                        <p className="text-gray-400 text-sm">Troupe Inc — Holdings, Yield & Financial Activity</p>
                    </div>
                </div>
                 <button onClick={handleAddNew} className="bg-fuchsia-500/80 hover:bg-fuchsia-500 text-white font-bold py-2 px-4 rounded-md transition-colors whitespace-nowrap">
                    + Add New Position
                </button>
            </header>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <SummaryCard title="Total Principal" value={`$${totalPrincipal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} colorClass="from-cyan-500 to-blue-500" />
                <SummaryCard title="Total Earnings" value={`$${totalEarnings.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} colorClass="from-green-500 to-teal-500" />
                <SummaryCard title="Total Current Value" value={`$${totalCurrentValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} colorClass="from-fuchsia-500 to-purple-500" />
            </div>

            {isFormOpen && (
                <PositionForm 
                    onSave={handleSavePosition}
                    onCancel={() => { setIsFormOpen(false); setPositionToEdit(null); }}
                    positionToEdit={positionToEdit || undefined}
                />
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {positions.map(pos => (
                    <PositionCard 
                        key={pos.id} 
                        position={pos} 
                        totalEarnings={earnings[pos.id] || 0}
                        onEdit={() => handleEdit(pos)}
                        onDelete={() => handleDelete(pos)}
                    />
                ))}
            </div>

            <ConfirmationDialog
                isOpen={!!positionToDelete}
                title="Delete Position"
                message={`Are you sure you want to delete "${positionToDelete?.name}"? This action cannot be undone.`}
                onConfirm={handleConfirmDelete}
                onCancel={() => setPositionToDelete(null)}
                confirmText="Delete"
            />
        </div>
    );
};

export default Business;
