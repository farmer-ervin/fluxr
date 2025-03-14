import { supabase } from './supabase';

export async function uploadFile(
  file: File,
  bucket: string,
  path: string
): Promise<string | null> {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `${path}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, file);

    if (uploadError) {
      throw uploadError;
    }

    // Generate a signed URL that expires in 2 years
    const expiresIn = 60 * 60 * 24 * 365 * 2; // 2 years in seconds
    const { data, error: signedUrlError } = await supabase.storage
      .from(bucket)
      .createSignedUrl(filePath, expiresIn);

    if (signedUrlError) {
      throw signedUrlError;
    }

    return data.signedUrl;
  } catch (error) {
    console.error('Error uploading file:', error);
    return null;
  }
}

export async function deleteFile(
  bucket: string,
  path: string
): Promise<boolean> {
  try {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path]);

    if (error) {
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Error deleting file:', error);
    return false;
  }
} 