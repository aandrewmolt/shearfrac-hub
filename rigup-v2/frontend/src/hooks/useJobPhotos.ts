
import { useJobPhotoQueries } from './photos/useJobPhotoQueries';
import { useJobPhotoUpload } from './photos/useJobPhotoUpload';
import { useJobPhotoMutations } from './photos/useJobPhotoMutations';
import { useJobPhotoUtils } from './photos/useJobPhotoUtils';

export type { JobPhoto } from './photos/types';

export const useJobPhotos = (jobId: string) => {
  const { photos, isLoading } = useJobPhotoQueries(jobId);
  const { uploadPhoto, isUploading } = useJobPhotoUpload(jobId, photos);
  const { deletePhoto, updateCaption, isDeleting } = useJobPhotoMutations(jobId, photos);
  const { photosBySection, sections } = useJobPhotoUtils(photos);

  return {
    photos,
    photosBySection,
    sections,
    isLoading,
    uploadPhoto,
    deletePhoto,
    updateCaption,
    isUploading,
    isDeleting,
  };
};
