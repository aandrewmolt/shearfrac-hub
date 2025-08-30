
export interface JobPhoto {
  id: string;
  jobId: string;
  sectionLabel: string;
  photoUrl: string;
  caption?: string;
  sortOrder: number;
  createdAt: Date;
}

export interface UploadPhotoParams {
  file: File;
  sectionLabel: string;
  caption?: string;
}

export interface UpdateCaptionParams {
  photoId: string;
  caption: string;
}
