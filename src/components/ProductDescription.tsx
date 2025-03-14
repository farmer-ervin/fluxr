import { stripHtml } from '@/lib/utils';

interface ProductDescriptionProps {
  description: string;
  className?: string;
}

export function ProductDescription({ description, className = '' }: ProductDescriptionProps) {
  const cleanDescription = stripHtml(description);
  
  return (
    <div className={`product-description ${className}`}>
      <p className="text-gray-700 leading-relaxed">{cleanDescription}</p>
    </div>
  );
} 