
import { JobPhoto } from './types';

export const useJobPhotoUtils = (photos: JobPhoto[]) => {
  // Group photos by section with proper labeling
  const photosBySection = photos.reduce((acc, photo) => {
    if (!acc[photo.sectionLabel]) {
      acc[photo.sectionLabel] = [];
    }
    acc[photo.sectionLabel].push(photo);
    return acc;
  }, {} as Record<string, JobPhoto[]>);

  const sections = Object.keys(photosBySection).sort();

  return {
    photosBySection,
    sections,
  };
};
