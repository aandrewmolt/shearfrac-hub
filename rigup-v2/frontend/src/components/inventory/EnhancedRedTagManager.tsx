
import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Camera, MapPin, AlertTriangle, X, Upload, Trash2 } from 'lucide-react';
import { useJobs } from '@/hooks/useJobs';
import { useUnifiedInventory } from '@/hooks/useUnifiedInventory';
import { toast } from 'sonner';

interface EnhancedRedTagManagerProps {
  isOpen: boolean;
  onClose: () => void;
  equipmentItem?: { id: string; equipmentId: string; name: string; status: string; };
  onRedTag: (itemId: string, reason: string, photos: string[], location?: string) => void;
}

const EnhancedRedTagManager: React.FC<EnhancedRedTagManagerProps> = ({
  isOpen,
  onClose,
  equipmentItem,
  onRedTag,
}) => {
  const { data } = useUnifiedInventory();
  const { jobs } = useJobs();
  const [reason, setReason] = useState('');
  const [currentLocation, setCurrentLocation] = useState('');
  const [locationType, setLocationType] = useState<'storage' | 'job'>('storage');
  const [photos, setPhotos] = useState<string[]>([]);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const startCamera = async () => {
    try {
      setIsCapturing(true);
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      toast.error('Unable to access camera');
      setIsCapturing(false);
    }
  };

  const capturePhoto = async () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      if (context) {
        context.drawImage(video, 0, 0);
        canvas.toBlob(async (blob) => {
          if (blob) {
            await uploadPhoto(blob);
          }
        }, 'image/jpeg', 0.8);
        stopCamera();
      }
    }
  };

  const uploadPhoto = async (blob: Blob) => {
    setIsUploading(true);
    try {
      const fileName = `red-tag-${equipmentItem?.id}-${Date.now()}.jpg`;
      
      // File upload disabled - would need alternative storage solution
      const publicUrl = `data:image/jpeg;base64,${btoa(String.fromCharCode(...new Uint8Array(await blob.arrayBuffer())))}`;
      
      setPhotos(prev => [...prev, publicUrl]);
      toast.success('Photo uploaded successfully');
    } catch (error) {
      console.error('Error uploading photo:', error);
      toast.error('Failed to upload photo');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    for (const file of (files ? Array.from(files) : [])) {
      if (file.type.startsWith('image/')) {
        await uploadPhoto(file);
      }
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCapturing(false);
  };

  const removePhoto = (photoUrl: string) => {
    setPhotos(prev => prev.filter(url => url !== photoUrl));
  };

  const handleSubmit = async () => {
    if (!reason.trim()) {
      toast.error('Please enter a reason for red tagging');
      return;
    }

    if (equipmentItem) {
      try {
        // Photo metadata storage disabled - would need alternative database
        // Photos are now stored as base64 data URLs locally

        onRedTag(equipmentItem.id, reason, photos, currentLocation || undefined);
        resetForm();
        onClose();
        toast.success('Equipment red-tagged successfully');
      } catch (error) {
        console.error('Error saving red tag data:', error);
        toast.error('Failed to save red tag information');
      }
    }
  };

  const resetForm = () => {
    setReason('');
    setCurrentLocation('');
    setLocationType('storage');
    setPhotos([]);
    stopCamera();
  };

  const handleClose = () => {
    stopCamera();
    resetForm();
    onClose();
  };

  const getLocationOptions = () => {
    if (locationType === 'storage') {
      return data.storageLocations.map(location => ({
        id: location.id,
        name: location.name
      }));
    } else {
      return jobs.map(job => ({
        id: job.id,
        name: job.name
      }));
    }
  };

  if (!isOpen || !equipmentItem) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Red Tag Equipment
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={handleClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Equipment Details</h4>
            <div className="p-3 bg-card rounded text-sm">
              <p><strong>Type:</strong> {equipmentItem.typeId}</p>
              <p><strong>Quantity:</strong> {equipmentItem.quantity}</p>
              <Badge variant="outline" className="mt-1">Current Status: {equipmentItem.status}</Badge>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Reason for Red Tag *</label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Enter detailed reason for red tagging (damage, malfunction, safety concern, etc.)"
              className="h-24 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Current Location Type</label>
              <Select value={locationType} onValueChange={(value: 'storage' | 'job') => setLocationType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="storage">Storage Location</SelectItem>
                  <SelectItem value="job">Job Site</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Specific Location</label>
              <Select value={currentLocation} onValueChange={setCurrentLocation}>
                <SelectTrigger>
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  {getLocationOptions().map(option => (
                    <SelectItem key={option.id} value={option.id}>
                      {option.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Photo Documentation</label>
            
            {!isCapturing && (
              <div className="flex gap-2 mb-3">
                <Button
                  onClick={startCamera}
                  variant="outline"
                  className="flex items-center gap-2"
                  disabled={isUploading}
                >
                  <Camera className="h-4 w-4" />
                  Take Photo
                </Button>
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  variant="outline"
                  className="flex items-center gap-2"
                  disabled={isUploading}
                >
                  <Upload className="h-4 w-4" />
                  Upload Photos
                </Button>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileUpload}
              className="hidden"
            />

            {isCapturing && (
              <div className="space-y-2 mb-3">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full rounded border"
                />
                <div className="flex gap-2">
                  <Button onClick={capturePhoto} className="flex-1">
                    Capture Photo
                  </Button>
                  <Button onClick={stopCamera} variant="outline">
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {isUploading && (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-sm text-corporate-silver mt-2">Uploading photo...</p>
              </div>
            )}

            {photos.length > 0 && (
              <div className="grid grid-cols-2 gap-2 mt-3">
                {photos.map((photoUrl, index) => (
                  <div key={index} className="relative border rounded-lg overflow-hidden">
                    <img src={photoUrl} alt={`Red tag evidence ${index + 1}`} className="w-full h-32 object-cover" />
                    <Button
                      onClick={() => removePhoto(photoUrl)}
                      variant="destructive"
                      size="sm"
                      className="absolute top-1 right-1"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <canvas ref={canvasRef} style={{ display: 'none' }} />
          </div>

          <div className="flex gap-2 pt-4">
            <Button 
              onClick={handleSubmit} 
              className="flex-1 bg-red-600 hover:bg-red-700"
              disabled={isUploading}
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              Red Tag Equipment
            </Button>
            <Button onClick={handleClose} variant="outline">
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EnhancedRedTagManager;
