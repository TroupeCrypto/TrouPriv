import React, { useState, useMemo } from 'react';
import { AssetCategory, Page } from '../types';
import { TrashIcon } from '../components/icons/Icons';

interface ManageCategoriesProps {
    assetCategories: AssetCategory[];
    setAssetCategories: React.Dispatch<React.SetStateAction<AssetCategory[]>>;
    setPage: (page: Page) => void;
}

const ManageCategories: React.FC<ManageCategoriesProps> = ({ assetCategories, setAssetCategories, setPage }) => {
    const [newCategoryName, setNewCategoryName] = useState('');
    const [newCategoryGroup, setNewCategoryGroup] = useState('');

    const categoryGroups = useMemo(() => {
        const groups = new Map<string, AssetCategory[]>();
        assetCategories.forEach(cat => {
            if (!groups.has(cat.group)) {
                groups.set(cat.group, []);
            }
            groups.get(cat.group)!.push(cat);
        });
        return Array.from(groups.entries()).sort((a,b) => a[0].localeCompare(b[0]));
    }, [assetCategories]);

    const handleAddCategory = () => {
        if (newCategoryName.trim() === '' || newCategoryGroup.trim() === '') {
            alert("Please provide both a name and a group for the new category.");
            return;
        }
        const newCategory: AssetCategory = {
            id: newCategoryName.toLowerCase().replace(/\s+/g, '-'),
            name: newCategoryName.trim(),
            group: newCategoryGroup.trim(),
        };

        if (assetCategories.some(c => c.id === newCategory.id)) {
            alert(`A category with ID "${newCategory.id}" already exists. Please choose a different name.`);
            return;
        }

        setAssetCategories(prev => [...prev, newCategory].sort((a,b) => a.name.localeCompare(b.name)));
        setNewCategoryName('');
        setNewCategoryGroup('');
    };
    
    const handleDeleteCategory = (id: string) => {
        if (window.confirm("Are you sure you want to delete this category? This cannot be undone.")) {
            setAssetCategories(prev => prev.filter(cat => cat.id !== id));
        }
    };

    const commonInputStyle = "w-full bg-gray-800/50 border border-white/10 rounded-md px-4 py-2 text-white focus:ring-2 focus:ring-fuchsia-500 focus:outline-none";

    return (
        <div className="space-y-8 max-w-2xl mx-auto">
             <header className="flex items-center gap-3 pb-4 border-b border-white/10">
                <div>
                    <h1 className="text-3xl font-bold text-white">Manage Categories</h1>
                     <button onClick={() => setPage(Page.Profile)} className="text-sm text-cyan-400 hover:underline">&larr; Back to Profile</button>
                </div>
            </header>

            <div className="p-6 bg-gray-900/50 border border-white/10 rounded-lg">
                <h3 className="text-xl font-semibold text-white mb-4">Add New Category</h3>
                <div className="grid sm:grid-cols-3 gap-4">
                    <input 
                        type="text"
                        value={newCategoryName}
                        onChange={e => setNewCategoryName(e.target.value)}
                        placeholder="Category Name"
                        className={`${commonInputStyle} sm:col-span-1`}
                    />
                    <input 
                        type="text"
                        value={newCategoryGroup}
                        onChange={e => setNewCategoryGroup(e.target.value)}
                        placeholder="Group Name"
                        className={`${commonInputStyle} sm:col-span-1`}
                    />
                    <button onClick={handleAddCategory} className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-2 px-4 rounded-md transition-colors whitespace-nowrap sm:col-span-1">
                        Add Category
                    </button>
                </div>
            </div>

            <div className="space-y-6">
                {categoryGroups.map(([group, categories]) => (
                    <div key={group} className="p-6 bg-gray-900/50 border border-white/10 rounded-lg">
                        <h3 className="text-xl font-semibold text-white mb-4">{group}</h3>
                        
                        <ul className="space-y-2 mb-4">
                            {categories.map(cat => (
                                <li key={cat.id} className="flex justify-between items-center bg-gray-800/50 p-2 rounded-md">
                                    <span className="text-gray-300">{cat.name}</span>
                                    <button onClick={() => handleDeleteCategory(cat.id)} className="text-gray-500 hover:text-red-500 p-1 rounded-full hover:bg-red-500/10 transition-colors">
                                        <TrashIcon className="w-4 h-4" />
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ManageCategories;