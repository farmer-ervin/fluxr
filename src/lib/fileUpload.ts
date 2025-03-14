import { supabase } from './supabase';
import { v4 as uuidv4 } from 'uuid';

export interface FileValidationOptions {
  maxSize?: number;
  allowedTypes?: string[];
}

const DEFAULT_OPTIONS: FileValidationOptions = {
  maxSize: 5 * 1024 * 1024, // 5MB
  allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
};

export class FileUploadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FileUploadError';
  }
}

export const validateFile = (file: File, options: FileValidationOptions = DEFAULT_OPTIONS): void => {
  const { maxSize, allowedTypes } = { ...DEFAULT_OPTIONS, ...options };

  if (!file) {
    throw new FileUploadError('No file provided');
  }

  if (maxSize && file.size > maxSize) {
    throw new FileUploadError(`File size exceeds ${maxSize / (1024 * 1024)}MB limit`);
  }

  if (allowedTypes && !allowedTypes.includes(file.type)) {
    throw new FileUploadError(
      `Invalid file type. Allowed types: ${allowedTypes.map(type => type.split('/')[1]).join(', ')}`
    );
  }
};

export const generateSecureFileName = (file: File): string => {
  const extension = file.name.split('.').pop();
  return `${uuidv4()}.${extension}`;
};

export const uploadFile = async (
  file: File,
  bucketName: string,
  folderPath?: string,
  options: FileValidationOptions = DEFAULT_OPTIONS
): Promise<string> => {
  try {
    // Validate the file
    validateFile(file, options);

    // Generate a secure file name
    const secureFileName = generateSecureFileName(file);
    const filePath = folderPath ? `${folderPath}/${secureFileName}` : secureFileName;

    // Upload the file
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      throw new FileUploadError(error.message);
    }

    if (!data) {
      throw new FileUploadError('Upload failed: No data returned');
    }

    // Generate a signed URL that expires in 5 years
    const expiresIn = 60 * 60 * 24 * 365 * 5; // 5 years in seconds
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from(bucketName)
      .createSignedUrl(filePath, expiresIn);

    if (signedUrlError) {
      throw new FileUploadError(signedUrlError.message);
    }

    if (!signedUrlData || !signedUrlData.signedUrl) {
      throw new FileUploadError('Failed to generate signed URL');
    }

    return signedUrlData.signedUrl;
  } catch (error) {
    if (error instanceof FileUploadError) {
      throw error;
    }
    throw new FileUploadError('An unexpected error occurred during file upload');
  }
};

export const deleteFile = async (
  fileUrl: string,
  bucketName: string
): Promise<void> => {
  try {
    // Extract the file path from the URL
    const url = new URL(fileUrl);
    const pathParts = url.pathname.split('/');
    const filePath = pathParts.slice(pathParts.indexOf(bucketName) + 1).join('/');

    const { error } = await supabase.storage
      .from(bucketName)
      .remove([filePath]);

    if (error) {
      throw new FileUploadError(error.message);
    }
  } catch (error) {
    if (error instanceof FileUploadError) {
      throw error;
    }
    throw new FileUploadError('An unexpected error occurred while deleting the file');
  }
}; 