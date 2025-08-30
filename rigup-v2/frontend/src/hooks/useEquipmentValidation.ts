
import { useState, useCallback } from 'react';
import { ValidationResult } from '@/types/validation';
import { useEquipmentValidator } from './validation/useEquipmentValidator';
import { useValidationAutoFixer } from './validation/useValidationAutoFixer';
import { toast } from 'sonner';

export const useEquipmentValidation = () => {
  const [isValidating, setIsValidating] = useState(false);
  const [lastValidation, setLastValidation] = useState<ValidationResult | null>(null);
  
  const { validateEquipmentConsistency } = useEquipmentValidator();
  const { autoFixIssues } = useValidationAutoFixer();

  const runFullValidation = useCallback(async () => {
    setIsValidating(true);
    
    try {
      const result = validateEquipmentConsistency();
      setLastValidation(result);
      
      if (result.summary.autoFixableIssues > 0) {
        const autoFixableIssues = result.issues.filter(
          issue => issue.suggestedAction !== 'manual_review'
        );
        await autoFixIssues(autoFixableIssues);
      }

      if (result.summary.totalIssues > 0) {
        toast.warning(
          `Found ${result.summary.totalIssues} validation issues. ${result.summary.autoFixableIssues} were auto-fixed.`
        );
      } else {
        toast.success('All equipment data is consistent');
      }

      return result;
    } finally {
      setIsValidating(false);
    }
  }, [validateEquipmentConsistency, autoFixIssues]);

  return {
    validateEquipmentConsistency,
    autoFixIssues,
    runFullValidation,
    isValidating,
    lastValidation,
  };
};
