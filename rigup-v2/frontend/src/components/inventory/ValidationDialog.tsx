
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertTriangle, CheckCircle, XCircle, Info, Wrench, Shield } from 'lucide-react';
import { useEquipmentValidation } from '@/hooks/useEquipmentValidation';
import { useDataConsistencyFixer } from '@/hooks/inventory/useDataConsistencyFixer';

interface ValidationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAutoFix?: (issues: unknown[]) => void;
}

const ValidationDialog: React.FC<ValidationDialogProps> = ({
  isOpen,
  onClose,
  onAutoFix
}) => {
  const { runFullValidation, lastValidation, isValidating, autoFixIssues } = useEquipmentValidation();
  const { fixDataConsistency, validateDataConsistency } = useDataConsistencyFixer();

  const handleRunValidation = async () => {
    await runFullValidation();
  };

  const handleAutoFix = async () => {
    if (lastValidation?.issues) {
      const autoFixableIssues = lastValidation.issues.filter(
        issue => issue.suggestedAction !== 'manual_review'
      );
      await autoFixIssues(autoFixableIssues);
      onAutoFix?.(autoFixableIssues);
    }
  };

  const handleFixDataConsistency = async () => {
    await fixDataConsistency();
    // Re-run validation after fixing
    setTimeout(() => {
      runFullValidation();
    }, 500);
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'info':
        return <Info className="h-4 w-4 text-blue-500" />;
      default:
        return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
  };

  const getSeverityColor = (severity: string): 'destructive' | 'secondary' | 'outline' | 'default' => {
    switch (severity) {
      case 'error':
        return 'destructive';
      case 'warning':
        return 'secondary';
      case 'info':
        return 'outline';
      default:
        return 'default';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            Equipment Data Validation
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Validation Controls */}
          <div className="flex gap-2 flex-wrap">
            <Button 
              onClick={handleRunValidation}
              disabled={isValidating}
              className="flex items-center gap-2"
            >
              <CheckCircle className="h-4 w-4" />
              {isValidating ? 'Validating...' : 'Run Validation'}
            </Button>
            
            <Button 
              onClick={handleFixDataConsistency}
              disabled={isValidating}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
            >
              <Shield className="h-4 w-4" />
              Fix Data Consistency
            </Button>
            
            {lastValidation?.summary.autoFixableIssues > 0 && (
              <Button 
                onClick={handleAutoFix}
                disabled={isValidating}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Wrench className="h-4 w-4" />
                Auto-Fix ({lastValidation.summary.autoFixableIssues} issues)
              </Button>
            )}
          </div>

          {/* Validation Summary */}
          {lastValidation && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Validation Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="space-y-1">
                    <div className="text-2xl font-bold text-foreground">
                      {lastValidation.isValid ? '✓' : lastValidation.summary.totalIssues}
                    </div>
                    <div className="text-sm text-corporate-silver">
                      {lastValidation.isValid ? 'All Good' : 'Total Issues'}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-2xl font-bold text-destructive">
                      {lastValidation.summary.criticalIssues}
                    </div>
                    <div className="text-sm text-corporate-silver">Critical</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-2xl font-bold text-foreground">
                      {lastValidation.summary.autoFixableIssues}
                    </div>
                    <div className="text-sm text-corporate-silver">Auto-Fixable</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Issues List */}
          {lastValidation?.issues && lastValidation.issues.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Validation Issues</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64">
                  <div className="space-y-3">
                    {lastValidation.issues.map((issue, index) => (
                      <div key={issue.id} className="flex items-start gap-3 p-3 border rounded-lg">
                        <div className="mt-0.5">
                          {getSeverityIcon(issue.severity)}
                        </div>
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <Badge variant={getSeverityColor(issue.severity)}>
                              {issue.severity.toUpperCase()}
                            </Badge>
                            <Badge variant="outline">
                              {issue.type.replace('_', ' ').toUpperCase()}
                            </Badge>
                          </div>
                          <p className="text-sm text-corporate-silver">{issue.message}</p>
                          <div className="text-xs text-corporate-silver">
                            Expected: {issue.expectedValue} | Actual: {issue.actualValue}
                          </div>
                          <div className="text-xs">
                            <Badge variant="outline" className="text-xs">
                              Suggested: {issue.suggestedAction.replace('_', ' ')}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}

          {lastValidation?.isValid && (
            <Card className="border-border bg-status-success/20">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-foreground">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-medium">All equipment data is consistent!</span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="flex justify-end">
          <Button onClick={onClose} variant="outline">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ValidationDialog;
