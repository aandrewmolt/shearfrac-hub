import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card } from '@/components/ui/card';
import { 
  AlertTriangle, Package, Home, Info 
} from 'lucide-react';

interface EquipmentRemovalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  equipmentId: string;
  equipmentName: string;
  nodeType: string;
  onConfirm: (action: 'return' | 'redtag', reason?: string, severity?: 'low' | 'medium' | 'high' | 'critical') => void;
}

export const EquipmentRemovalDialog: React.FC<EquipmentRemovalDialogProps> = ({
  open,
  onOpenChange,
  equipmentId,
  equipmentName,
  nodeType,
  onConfirm
}) => {
  const [action, setAction] = useState<'return' | 'redtag'>('return');
  const [redTagReason, setRedTagReason] = useState('');
  const [redTagSeverity, setRedTagSeverity] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');

  const handleConfirm = () => {
    if (action === 'redtag') {
      if (!redTagReason.trim()) {
        return; // Don't proceed without a reason
      }
      onConfirm('redtag', redTagReason, redTagSeverity);
    } else {
      onConfirm('return');
    }
    
    // Reset state
    setAction('return');
    setRedTagReason('');
    setRedTagSeverity('medium');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Remove Equipment from {nodeType}</DialogTitle>
          <DialogDescription>
            What would you like to do with {equipmentId}?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>{equipmentId}</strong> - {equipmentName}
            </AlertDescription>
          </Alert>

          <RadioGroup value={action} onValueChange={(v: 'return' | 'redtag') => setAction(v)}>
            <div className="space-y-3">
              <Card 
                className={`flex items-start space-x-3 p-3 ${
                  action === 'return' ? 'border-blue-500 bg-muted' : ''
                }`}
              >
                <RadioGroupItem value="return" id="return" className="mt-1" />
                <label htmlFor="return" className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-2 font-medium">
                    <Home className="h-4 w-4 text-foreground" />
                    Return to Storage
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Equipment is working fine, just removing from this job
                  </p>
                </label>
              </Card>

              <Card 
                className={`flex items-start space-x-3 p-3 ${
                  action === 'redtag' ? 'border-red-500 bg-muted' : ''
                }`}
              >
                <RadioGroupItem value="redtag" id="redtag" className="mt-1" />
                <label htmlFor="redtag" className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-2 font-medium">
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                    Red Tag Equipment
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Equipment needs repair or maintenance
                  </p>
                </label>
              </Card>
            </div>
          </RadioGroup>

          {action === 'redtag' && (
            <Alert className="space-y-3 bg-muted border-red-200">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="space-y-3">
              <div>
                <Label htmlFor="reason">Reason for Red Tag *</Label>
                <Textarea
                  id="reason"
                  value={redTagReason}
                  onChange={(e) => setRedTagReason(e.target.value)}
                  placeholder="Describe the issue..."
                  rows={3}
                  className="mt-1"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="severity">Severity</Label>
                <Select value={redTagSeverity} onValueChange={(v) => setRedTagSeverity(v as 'low' | 'medium' | 'high' | 'critical')}>
                  <SelectTrigger id="severity" className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-yellow-400 rounded-full" />
                        Low - Minor issue
                      </div>
                    </SelectItem>
                    <SelectItem value="medium">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-orange-400 rounded-full" />
                        Medium - Needs attention soon
                      </div>
                    </SelectItem>
                    <SelectItem value="high">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-red-400 rounded-full" />
                        High - Critical issue
                      </div>
                    </SelectItem>
                    <SelectItem value="critical">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-red-600 rounded-full" />
                        Critical - Immediate action
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            variant={action === 'redtag' ? 'destructive' : 'default'}
            onClick={handleConfirm}
            disabled={action === 'redtag' && !redTagReason.trim()}
          >
            {action === 'redtag' ? (
              <>
                <AlertTriangle className="h-4 w-4 mr-2" />
                Red Tag & Remove
              </>
            ) : (
              <>
                <Package className="h-4 w-4 mr-2" />
                Return to Storage
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};