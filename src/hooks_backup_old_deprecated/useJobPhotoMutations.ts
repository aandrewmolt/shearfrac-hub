
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { tursoDb } from '@/services/tursoDb';
import { toast } from 'sonner';
import { JobPhoto, UpdateCaptionParams } from './types';

// Dynamic import to avoid initialization issues
let blobDel: typeof import('@vercel/blob').del | undefined;

export const useJobPhotoMutations = (jobId: string, photos: JobPhoto[]) => {
  const queryClient = useQueryClient();

  // Delete photo mutation
  const deletePhotoMutation = useMutation({
    mutationFn: async (photoId: string) => {
      const photo = photos.find(p => p.id === photoId);
      if (!photo) throw new Error('Photo not found');
      
      // Extract file path from URL
      const urlParts = photo.photoUrl.split('/');
      const filePath = urlParts.slice(-3).join('/'); // Get last 3 parts: jobId/section/filename
      
      // Delete from storage if it's a blob URL
      if (photo.photoUrl.includes('blob.vercel-storage.com')) {
        try {
          // Dynamically import Vercel blob if not already loaded
          if (!blobDel) {
            const { del } = await import('@vercel/blob');
            blobDel = del;
          }
          await blobDel(photo.photoUrl);
        } catch (error) {
          console.warn('Failed to delete blob:', error);
        }
      }
      
      // Delete from database
      await tursoDb.deleteJobPhoto(photoId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job-photos', jobId] });
      toast.success('Photo deleted successfully');
    },
    onError: (error) => {
      console.error('Failed to delete photo:', error);
      toast.error('Failed to delete photo');
    }
  });

  // Update caption mutation
  const updateCaptionMutation = useMutation({
    mutationFn: async ({ photoId, caption }: UpdateCaptionParams) => {
      // Get existing photo data
      const photos = await tursoDb.getJobPhotos(jobId);
      const photo = photos.find(p => p.id === photoId);
      if (!photo) throw new Error('Photo not found');
      
      // Update photo with new caption
      await tursoDb.deleteJobPhoto(photoId);
      await tursoDb.createJobPhoto({
        ...photo,
        caption
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job-photos', jobId] });
      toast.success('Caption updated');
    },
    onError: (error) => {
      console.error('Failed to update caption:', error);
      toast.error('Failed to update caption');
    }
  });

  return {
    deletePhoto: (photoId: string) => {
      deletePhotoMutation.mutate(photoId);
    },
    updateCaption: (photoId: string, caption: string) => {
      updateCaptionMutation.mutate({ photoId, caption });
    },
    isDeleting: deletePhotoMutation.isPending,
  };
};
