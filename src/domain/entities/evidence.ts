export interface Evidence {
  id: string;
  submissionId: string;
  imageUrl: string;
  thumbnailUrl?: string | null;
  cloudinaryPublicId: string;
  fileSizeBytes?: number | null;
  width?: number | null;
  height?: number | null;
  uploadedBy?: string | null;
  createdAt: Date;
}
