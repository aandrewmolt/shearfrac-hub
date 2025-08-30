
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { optimizeImage } from '@/utils/imageOptimizer';
import { UploadPhotoParams, JobPhoto } from './types';
import { photoStorage } from '@/services/photoStorage';

export const useJobPhotoUpload = (jobId: string, photos: JobPhoto[]) => {
  const queryClient = useQueryClient();

  const uploadPhotoMutation = useMutation({
    mutationFn: async ({ file, sectionLabel, caption }: UploadPhotoParams) => {
      console.log('Starting image optimization process...');
      console.log('Original file:', file.name, 'Size:', (file.size / 1024 / 1024).toFixed(2), 'MB');
      
      // Enhanced optimization for WebP with better compression
      const optimizedFile = await optimizeImage(file, {
        maxWidth: 1920,
        maxHeight: 1080,
        quality: 0.75, // Slightly lower quality for better compression
        format: 'webp'
      });
      
      console.log('Optimized file size:', (optimizedFile.size / 1024 / 1024).toFixed(2), 'MB');
      console.log('Compression ratio:', (((file.size - optimizedFile.size) / file.size) * 100).toFixed(1), '%');
      
      // Generate filename with timestamp and proper extension
      const timestamp = Date.now();
      const sanitizedSection = sectionLabel.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
      const fileName = `${jobId}/${sanitizedSection}/${timestamp}_optimized.webp`;
      
      // Upload optimized file to storage
      const { publicUrl } = await photoStorage.uploadPhoto(optimizedFile, fileName);
      
      // Get next sort order for this section
      const existingPhotos = photos.filter(p => p.sectionLabel === sectionLabel);
      const nextSortOrder = existingPhotos.length > 0 
        ? Math.max(...existingPhotos.map(p => p.sortOrder)) + 1 
        : 0;
      
      // Save to database with enhanced metadata
      const data = await photoStorage.savePhotoMetadata({
        job_id: jobId,
        section_label: sectionLabel,
        photo_url: publicUrl,
        caption: caption || `${sectionLabel} - Photo ${nextSortOrder + 1}`,
        sort_order: nextSortOrder,
      });
      
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['job-photos', jobId] });
      toast.success('Photo uploaded and optimized to WebP format successfully');
      console.log('Photo upload completed successfully');
    },
    onError: (error) => {
      console.error('Failed to upload photo:', error);
      toast.error('Failed to upload photo. Please try again.');
    }
  });

  return {
    uploadPhoto: (file: File, sectionLabel: string, caption?: string) => {
      uploadPhotoMutation.mutate({ file, sectionLabel, caption });
    },
    isUploading: uploadPhotoMutation.isPending,
  };
};
