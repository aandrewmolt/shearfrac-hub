
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Upload, Camera, Zap, Image as ImageIcon } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { optimizeImage } from '@/utils/imageOptimizer';
import { toast } from 'sonner';

interface JobPhotoUploadProps {
  sectionLabel: string;
  onUpload: (file: File, sectionLabel: string, caption?: string) => void;
  isUploading: boolean;
}

const JobPhotoUpload: React.FC<JobPhotoUploadProps> = ({
  sectionLabel,
  onUpload,
  isUploading
}) => {
  const [caption, setCaption] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const isMobile = useIsMobile();

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const file = files[0];
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    
    setIsOptimizing(true);
    try {
      // Optimize the image before uploading
      const optimizedFile = await optimizeImage(file, {
        maxWidth: 1200,
        maxHeight: 800,
        quality: 0.85,
        format: 'webp'
      });
      
      onUpload(optimizedFile, sectionLabel, caption);
      setCaption('');
      toast.success('Image optimized and uploaded successfully');
    } catch (error) {
      console.error('Error optimizing image:', error);
      toast.error('Failed to optimize image');
      // Fallback to original file if optimization fails
      onUpload(file, sectionLabel, caption);
      setCaption('');
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const isProcessing = isUploading || isOptimizing;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <Zap className="h-4 w-4 text-success" />
          Add Photo to {sectionLabel}
          <span className="text-xs text-foreground font-normal">(Auto-optimized to WebP)</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          <Label htmlFor="caption" className="text-xs">Caption (optional)</Label>
          <Textarea
            id="caption"
            placeholder="Add a description for this photo..."
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            className="h-16 text-xs"
          />
        </div>
        
        <div
          className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
            dragOver ? 'border-border bg-muted' : 'border-border'
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <div className="space-y-2">
            <div className="flex justify-center">
              <Upload className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-xs text-muted-foreground">
              Drag & drop an image here, or click to select
            </p>
            <p className="text-xs text-foreground">
              Images will be automatically compressed and converted to WebP format
            </p>
            {isMobile ? (
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => cameraInputRef.current?.click()}
                  disabled={isProcessing}
                  className="text-xs flex-col h-16"
                >
                  <Camera className="h-6 w-6 mb-1" />
                  <span>Camera</span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isProcessing}
                  className="text-xs flex-col h-16"
                >
                  <ImageIcon className="h-6 w-6 mb-1" />
                  <span>Gallery</span>
                </Button>
              </div>
            ) : (
              <div className="flex gap-2 justify-center">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isProcessing}
                  className="text-xs"
                >
                  <Upload className="h-3 w-3 mr-1" />
                  Choose File
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => cameraInputRef.current?.click()}
                  disabled={isProcessing}
                  className="text-xs"
                >
                  <Camera className="h-3 w-3 mr-1" />
                  Take Photo
                </Button>
              </div>
            )}
          </div>
        </div>
        
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
        />
        
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
        />
        
        {isProcessing && (
          <div className="text-xs text-foreground text-center space-y-1">
            <p>{isOptimizing ? 'Optimizing image...' : 'Uploading...'}</p>
            <Progress value={75} className="h-1" />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default JobPhotoUpload;
