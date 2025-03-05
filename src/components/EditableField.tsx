import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface EditableFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
  isEditing?: boolean;
}

export function EditableField({ label, value, onChange, className, isEditing = true }: EditableFieldProps) {
  const [isEditingField, setIsEditingField] = useState(false);
  const [tempValue, setTempValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditingField && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditingField]);

  useEffect(() => {
    setTempValue(value);
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      setIsEditingField(false);
      onChange(tempValue);
    } else if (e.key === 'Escape') {
      setIsEditingField(false);
      setTempValue(value);
    }
  };

  const handleBlur = () => {
    setIsEditingField(false);
    onChange(tempValue);
  };

  return (
    <div className={cn("group relative", className)}>
      <span className="text-sm font-medium text-gray-500">{label}:</span>
      {isEditingField && isEditing ? (
        <input
          ref={inputRef}
          type="text"
          value={tempValue}
          onChange={(e) => setTempValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          className="ml-2 w-full bg-transparent border-b border-dashed border-brand-purple focus:border-brand-purple focus:ring-0 text-gray-700"
        />
      ) : (
        <div
          onClick={() => isEditing && setIsEditingField(true)}
          className={cn(
            "inline-block ml-2 text-gray-700 rounded px-1",
            isEditing && "hover:bg-gray-50 cursor-pointer"
          )}
        >
          {value}
          {isEditing && (
            <div className="absolute right-0 top-0 hidden group-hover:block">
              <span className="text-xs text-gray-400 bg-white px-2 py-1 rounded">Click to edit</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}