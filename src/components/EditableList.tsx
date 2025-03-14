import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { Button } from './ui/button';

interface EditableListProps {
  label: string;
  items: string[];
  onChange: (items: string[]) => void;
  isEditing?: boolean;
}

export function EditableList({ label, items, onChange, isEditing = true }: EditableListProps) {
  const [newItem, setNewItem] = useState('');

  const handleAddItem = () => {
    if (newItem.trim()) {
      onChange([...items, newItem.trim()]);
      setNewItem('');
    }
  };

  const handleRemoveItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    onChange(newItems);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddItem();
    }
  };

  return (
    <div className="space-y-2">
      <span className="text-sm font-medium text-gray-500">{label}:</span>
      <ul className="list-disc list-inside text-gray-700 ml-2 space-y-1">
        {items.map((item, index) => (
          <li key={index} className="group flex items-center">
            <span>{item}</span>
            {isEditing && (
              <button
                onClick={() => handleRemoveItem(index)}
                className="ml-2 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </li>
        ))}
      </ul>
      {isEditing && (
        <div className="flex items-center gap-2 mt-2">
          <input
            type="text"
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Add new item"
            className="flex-1 bg-transparent border-b border-dashed border-gray-300 focus:border-brand-purple focus:ring-0 text-gray-700 text-sm"
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={handleAddItem}
            className="text-brand-purple hover:text-brand-purple/90"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
}