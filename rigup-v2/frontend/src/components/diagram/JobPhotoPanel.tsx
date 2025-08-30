
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Plus, FolderOpen } from 'lucide-react';
import { useJobPhotos } from '@/hooks/useJobPhotos';
import JobPhotoUpload from './JobPhotoUpload';
import JobPhotoGallery from './JobPhotoGallery';

interface JobPhotoPanelProps {
  jobId: string;
  jobName: string;
}

const JobPhotoPanel: React.FC<JobPhotoPanelProps> = ({ jobId, jobName }) => {
  const [newSectionName, setNewSectionName] = useState('');
  const [showNewSectionForm, setShowNewSectionForm] = useState(false);
  
  const {
    photosBySection,
    sections,
    isLoading,
    uploadPhoto,
    deletePhoto,
    updateCaption,
    isUploading,
    isDeleting,
  } = useJobPhotos(jobId);

  const handleCreateSection = () => {
    if (!newSectionName.trim()) return;
    
    // The section will be created when the first photo is uploaded
    setShowNewSectionForm(false);
    setNewSectionName('');
  };

  const allSections = [...sections];
  if (newSectionName.trim() && !sections.includes(newSectionName.trim())) {
    allSections.push(newSectionName.trim());
  }

  if (isLoading) {
    return (
      <div className="p-4 text-center text-sm text-muted-foreground">
        Loading photos...
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b">
        <h3 className="font-semibold text-lg mb-1">Job Photos</h3>
        <p className="text-sm text-muted-foreground">{jobName}</p>
        
        <div className="mt-3">
          {!showNewSectionForm ? (
            <Button
              onClick={() => setShowNewSectionForm(true)}
              size="sm"
              variant="outline"
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Photo Section
            </Button>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="sectionName" className="text-xs">Section Name</Label>
              <div className="flex gap-2">
                <Input
                  id="sectionName"
                  placeholder="e.g., Inside Van, Well 1, Equipment Setup"
                  value={newSectionName}
                  onChange={(e) => setNewSectionName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleCreateSection()}
                  className="text-sm"
                />
                <Button
                  onClick={handleCreateSection}
                  size="sm"
                  disabled={!newSectionName.trim()}
                >
                  Add
                </Button>
              </div>
              <Button
                onClick={() => {
                  setShowNewSectionForm(false);
                  setNewSectionName('');
                }}
                size="sm"
                variant="ghost"
                className="w-full text-xs"
              >
                Cancel
              </Button>
            </div>
          )}
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4">
          {allSections.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FolderOpen className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
              <p className="text-sm">No photo sections yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                Create your first section to start uploading photos
              </p>
            </div>
          ) : (
            <Accordion type="multiple" defaultValue={allSections} className="space-y-2">
              {allSections.map((section) => {
                const sectionPhotos = photosBySection[section] || [];
                const isNewSection = !sections.includes(section);
                
                return (
                  <AccordionItem key={section} value={section} className="border rounded-lg">
                    <AccordionTrigger className="px-3 py-2 text-sm">
                      <div className="flex items-center justify-between w-full">
                        <span className="font-medium">{section}</span>
                        <span className="text-xs text-muted-foreground mr-2">
                          {sectionPhotos.length} photo{sectionPhotos.length !== 1 ? 's' : ''}
                          {isNewSection && ' (new)'}
                        </span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-3 pb-3">
                      <div className="space-y-3">
                        <JobPhotoUpload
                          sectionLabel={section}
                          onUpload={uploadPhoto}
                          isUploading={isUploading}
                        />
                        
                        {sectionPhotos.length > 0 && (
                          <>
                            <Separator />
                            <JobPhotoGallery
                              photos={sectionPhotos}
                              onDeletePhoto={deletePhoto}
                              onUpdateCaption={updateCaption}
                              isDeleting={isDeleting}
                            />
                          </>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default JobPhotoPanel;
