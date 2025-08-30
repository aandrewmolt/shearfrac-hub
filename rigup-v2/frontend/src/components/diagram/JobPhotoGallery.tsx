
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Trash2, Edit3, Save, X } from 'lucide-react';
import { JobPhoto } from '@/hooks/useJobPhotos';

interface JobPhotoGalleryProps {
  photos: JobPhoto[];
  onDeletePhoto: (photoId: string) => void;
  onUpdateCaption: (photoId: string, caption: string) => void;
  isDeleting: boolean;
}

const JobPhotoGallery: React.FC<JobPhotoGalleryProps> = ({
  photos,
  onDeletePhoto,
  onUpdateCaption,
  isDeleting
}) => {
  const [selectedPhoto, setSelectedPhoto] = useState<JobPhoto | null>(null);
  const [editingCaption, setEditingCaption] = useState<string | null>(null);
  const [captionText, setCaptionText] = useState('');

  const startEditingCaption = (photo: JobPhoto) => {
    setEditingCaption(photo.id);
    setCaptionText(photo.caption || '');
  };

  const saveCaption = (photoId: string) => {
    onUpdateCaption(photoId, captionText);
    setEditingCaption(null);
  };

  const cancelEditingCaption = () => {
    setEditingCaption(null);
    setCaptionText('');
  };

  if (photos.length === 0) {
    return (
      <div className="text-center py-4 text-muted-foreground text-sm">
        No photos in this section yet
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {photos.map((photo) => (
          <Card key={photo.id} className="overflow-hidden hover:shadow-lg transition-shadow">
            <CardContent className="p-2">
              <div className="relative group">
                <div className="aspect-square w-full bg-card rounded overflow-hidden">
                  <img
                    src={photo.photoUrl}
                    alt={photo.caption || 'Job photo'}
                    className="w-full h-full object-contain cursor-pointer hover:scale-105 transition-transform"
                    onClick={() => setSelectedPhoto(photo)}
                    loading="lazy"
                  />
                </div>
                <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity bg-card/80 rounded-full p-1">
                  <Button
                    size="sm"
                    variant="destructive"
                    className="h-6 w-6 p-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeletePhoto(photo.id);
                    }}
                    disabled={isDeleting}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              
              {editingCaption === photo.id ? (
                <div className="mt-2 space-y-1">
                  <Input
                    value={captionText}
                    onChange={(e) => setCaptionText(e.target.value)}
                    placeholder="Add caption..."
                    className="h-6 text-xs"
                  />
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      onClick={() => saveCaption(photo.id)}
                      className="h-5 px-2 text-xs"
                    >
                      <Save className="h-2 w-2" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={cancelEditingCaption}
                      className="h-5 px-2 text-xs"
                    >
                      <X className="h-2 w-2" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="mt-2 flex items-start justify-between">
                  <p className="text-xs text-muted-foreground flex-1 pr-1">
                    {photo.caption || 'No caption'}
                  </p>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => startEditingCaption(photo)}
                    className="h-4 w-4 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Edit3 className="h-2 w-2" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Full size photo dialog */}
      <Dialog open={!!selectedPhoto} onOpenChange={() => setSelectedPhoto(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>
              {selectedPhoto?.caption || 'Job Photo'}
            </DialogTitle>
          </DialogHeader>
          {selectedPhoto && (
            <div className="flex justify-center">
              <img
                src={selectedPhoto.photoUrl}
                alt={selectedPhoto.caption || 'Job photo'}
                className="max-w-full max-h-[70vh] object-contain"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default JobPhotoGallery;
