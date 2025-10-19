import React from 'react';
import { Position } from '../types';
import { EditIcon, TrashIcon } from './icons/Icons';

interface PositionCardProps {
  position: Position;
  totalEarnings: number;
  onEdit: () => void;
  onDelete: () => void;
}

const PositionCard: React.FC<PositionCardProps> = ({ position, totalEarnings, onEdit, onDelete }) => {
    const currentValue = position.principal + totalEarnings;

    return (
        <div className="bg-gray-900/50 p-4 rounded-lg border border-white/10 group relative flex flex-col h-full transition-all duration-300 hover:border-fuchsia-500/50 hover:-translate-y-1">
            <div className="flex-grow">
                <div className="flex justify-between items-start">
                    <h3 className="text-lg font-bold text-white">{position.name}</h3>
                    <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-xs font-semibold uppercase tracking-wider bg-cyan-900/50 text-cyan-400 px-2 py-1 rounded">{position.category}</span>
                    </div>
                </div>
                {position.description && <p className="text-gray-400 mt-2 text-sm">{position.description}</p>}
            </div>

            <div className="mt-4 pt-4 border-t border-white/10 font-mono text-sm space-y-1">
                <div className="flex justify-between">
                    <span className="text-gray-400">Principal:</span>
                    <span className="text-white">${position.principal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-gray-400">APY:</span>
                    <span className="text-white">{position.apy.toFixed(2)}%</span>
                </div>
                 <div className="flex justify-between">
                    <span className="text-gray-400">Start Date:</span>
                    <span className="text-white">{position.startDate}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-gray-400">Earnings:</span>
                    <span className="text-green-400 font-semibold">${totalEarnings.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 8 })}</span>
                </div>
                 <div className="flex justify-between font-bold text-md pt-2 border-t border-white/5 mt-2">
                    <span className="text-gray-300">Current Value:</span>
                    <span className="text-fuchsia-400">${currentValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 8 })}</span>
                </div>
            </div>
            <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={onEdit} className="p-2 bg-gray-800/80 rounded-full text-gray-300 hover:text-white hover:bg-cyan-600/80 transition-colors"><EditIcon className="w-4 h-4" /></button>
                <button onClick={onDelete} className="p-2 bg-gray-800/80 rounded-full text-gray-300 hover:text-white hover:bg-red-600/80 transition-colors"><TrashIcon className="w-4 h-4" /></button>
            </div>
        </div>
    );
};

export default PositionCard;
