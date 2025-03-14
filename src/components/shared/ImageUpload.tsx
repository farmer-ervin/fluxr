import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Image as ImageIcon, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FileUploadError } from '@/lib/fileUpload';

interface ImageUploadProps {
  onImageSelect: (file: File) => Promise<void>;
  currentImageUrl?: string;
  onImageRemove?: () => void;
  isUploading?: boolean;
  error?: string | null;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_FILE_TYPES = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/gif': ['.gif'],
  'image/webp': ['.webp']
};
const MAX_DIMENSIONS = {
  width: 8192,
  height: 8192
};

export function ImageUpload({
  onImageSelect,
  currentImageUrl,
  onImageRemove,
  isUploading,
  error
}: ImageUploadProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const validateImageDimensions = (file: File): Promise<boolean> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(img.src);
        resolve(
          img.width <= MAX_DIMENSIONS.width &&
          img.height <= MAX_DIMENSIONS.height
        );
      };
      img.src = URL.createObjectURL(file);
    });
  };

  const optimizeImage = async (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;

        // Scale down if image is too large
        if (width > MAX_DIMENSIONS.width || height > MAX_DIMENSIONS.height) {
          const ratio = Math.min(
            MAX_DIMENSIONS.width / width,
            MAX_DIMENSIONS.height / height
          );
          width *= ratio;
          height *= ratio;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to create blob'));
              return;
            }
            const optimizedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            resolve(optimizedFile);
          },
          'image/jpeg',
          0.8 // Quality setting
        );
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  };

  const handleDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    setValidationError(null);

    try {
      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        throw new FileUploadError(`File size must be less than ${MAX_FILE_SIZE / (1024 * 1024)}MB`);
      }

      // Validate file type
      if (!Object.keys(ALLOWED_FILE_TYPES).includes(file.type)) {
        throw new FileUploadError('Invalid file type. Please upload a JPG, PNG, GIF, or WebP image.');
      }

      // Validate dimensions
      const validDimensions = await validateImageDimensions(file);
      if (!validDimensions) {
        throw new FileUploadError(`Image dimensions must be ${MAX_DIMENSIONS.width}x${MAX_DIMENSIONS.height} or smaller`);
      }

      // Optimize image
      const optimizedFile = await optimizeImage(file);

      // Create preview
      const preview = URL.createObjectURL(optimizedFile);
      setPreviewUrl(preview);

      // Pass the optimized file to parent
      await onImageSelect(optimizedFile);
    } catch (error) {
      setValidationError(error instanceof Error ? error.message : 'Failed to process image');
    }
  }, [onImageSelect]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleDrop,
    accept: ALLOWED_FILE_TYPES,
    maxSize: MAX_FILE_SIZE,
    multiple: false
  });

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    onImageRemove?.();
  };

  const displayUrl = previewUrl || currentImageUrl;

  return (
    <div className="space-y-2">
      <div
        {...getRootProps()}
        className={`relative border-2 border-dashed rounded-lg p-4 transition-colors ${
          isDragActive
            ? 'border-brand-purple bg-brand-purple/5'
            : 'border-gray-300 hover:border-brand-purple/50'
        } ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <input {...getInputProps()} disabled={isUploading} />
        
        {isUploading && (
          <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-10">
            <Loader2 className="w-6 h-6 animate-spin text-brand-purple" />
          </div>
        )}

        {displayUrl ? (
          <div className="relative">
            <img
              src={displayUrl}
              alt="Preview"
              className="max-h-48 mx-auto rounded-lg"
            />
            {!isUploading && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 bg-white/80 hover:bg-white"
                onClick={handleRemove}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        ) : (
          <div className="text-center p-4">
            <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
            <div className="mt-4 flex text-sm leading-6 text-gray-600 justify-center">
              <label className="relative cursor-pointer rounded-md bg-white font-semibold text-brand-purple focus-within:outline-none focus-within:ring-2 focus-within:ring-brand-purple focus-within:ring-offset-2 hover:text-brand-purple/80">
                <span>Upload a file</span>
              </label>
              <p className="pl-1">or drag and drop</p>
            </div>
            <p className="text-xs leading-5 text-gray-600">
              PNG, JPG, GIF up to 5MB
            </p>
          </div>
        )}
      </div>

      {(validationError || error) && (
        <p className="text-sm text-red-600">
          {validationError || error}
        </p>
      )}
    </div>
  );
} 