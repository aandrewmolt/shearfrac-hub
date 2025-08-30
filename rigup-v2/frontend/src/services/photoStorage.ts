import { tursoDb } from '@/services/tursoDb';
// Dynamic import to avoid initialization issues
let blobPut: typeof import('@vercel/blob').put | undefined;

interface PhotoUploadResult {
  publicUrl: string;
  fileName: string;
}

interface PhotoMetadata {
  job_id: string;
  section_label: string;
  photo_url: string;
  caption: string;
  sort_order: number;
}

class PhotoStorageService {
  async uploadPhoto(file: File, path: string): Promise<PhotoUploadResult> {
    // Check if we're in a Vercel environment with Blob storage
    const blobToken = import.meta.env?.VITE_BLOB_READ_WRITE_TOKEN;
    if (typeof window !== 'undefined' && blobToken) {
      // Dynamically import Vercel blob if not already loaded
      if (!blobPut) {
        const { put } = await import('@vercel/blob');
        blobPut = put;
      }
      
      // Use Vercel Blob storage
      const blob = await blobPut(path, file, {
        access: 'public',
        token: blobToken,
      });
      
      return { publicUrl: blob.url, fileName: path };
    } else {
      // For local development, convert to base64 data URL
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = () => {
          const dataUrl = reader.result as string;
          resolve({
            publicUrl: dataUrl,
            fileName: path
          });
        };
        
        reader.onerror = () => {
          reject(new Error('Failed to read file'));
        };
        
        reader.readAsDataURL(file);
      });
    }
  }
  
  async savePhotoMetadata(metadata: PhotoMetadata): Promise<PhotoMetadata> {
    // Use Turso for photo metadata
    return await tursoDb.createJobPhoto(metadata);
  }
  
  async getPhotos(jobId: string): Promise<PhotoMetadata[]> {
    // Use Turso to get photos
    return await tursoDb.getJobPhotos(jobId);
  }
  
  async deletePhoto(photoId: string, jobId: string): Promise<void> {
    // Use Turso to delete photo metadata
    await tursoDb.deleteJobPhoto(photoId);
  }
}

// Lazy singleton
let instance: PhotoStorageService | null = null;

export const photoStorage = new Proxy({} as PhotoStorageService, {
  get(target, prop) {
    if (!instance) {
      instance = new PhotoStorageService();
    }
    return instance[prop as keyof PhotoStorageService];
  }
});