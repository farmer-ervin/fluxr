import React from 'react';

interface ScoreBarProps {
  score: number;
  label: string;
}

export function ScoreBar({ score, label }: ScoreBarProps) {
  const dots = Array(5).fill(0);
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium text-gray-500 w-32">{label}:</span>
      <div className="flex gap-1">
        {dots.map((_, i) => (
          <div
            key={i}
            className={`w-2 h-2 rounded-full ${
              i < score ? 'bg-brand-purple' : 'bg-gray-200'
            }`}
          />
        ))}
      </div>
      <span className="text-sm text-gray-600 ml-2">{score}/5</span>
    </div>
  );
}