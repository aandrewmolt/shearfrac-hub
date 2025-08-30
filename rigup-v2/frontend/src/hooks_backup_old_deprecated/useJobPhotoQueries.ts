
import { useQuery } from '@tanstack/react-query';
import { tursoDb } from '@/services/tursoDb';
import { JobPhoto } from './types';

export const useJobPhotoQueries = (jobId: string) => {
  const { data: photos = [], isLoading } = useQuery({
    queryKey: ['job-photos', jobId],
    queryFn: async () => {
      const data = await tursoDb.getJobPhotos(jobId);
      
      return data.map(photo => ({
        id: photo.id,
        jobId: photo.job_id,
        sectionLabel: photo.section_label,
        photoUrl: photo.photo_url,
        caption: photo.caption || undefined,
        sortOrder: photo.sort_order,
        createdAt: new Date(photo.created_at),
      })) as JobPhoto[];
    }
  });

  return { photos, isLoading };
};
