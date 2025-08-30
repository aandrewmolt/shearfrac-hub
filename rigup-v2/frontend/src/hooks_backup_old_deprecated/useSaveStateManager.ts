
import { useRef, useMemo } from 'react';
import { Job } from '@/types/types';

export const useSaveStateManager = (saveDataMemo: Job) => {
  const lastSavedDataRef = useRef<string>('');
  const initialLoadCompleteRef = useRef(false);
  const saveInProgressRef = useRef(false);

  // Create a stable string representation to detect actual changes
  const currentDataString = useMemo(() => {
    return JSON.stringify(saveDataMemo);
  }, [saveDataMemo]);

  const hasDataChanged = () => {
    return currentDataString !== lastSavedDataRef.current;
  };

  const markAsSaved = () => {
    lastSavedDataRef.current = currentDataString;
  };

  const setSaveInProgress = (inProgress: boolean) => {
    saveInProgressRef.current = inProgress;
  };

  const isSaveInProgress = () => {
    return saveInProgressRef.current;
  };

  const setInitialLoadComplete = (complete: boolean) => {
    initialLoadCompleteRef.current = complete;
  };

  const isInitialLoadComplete = () => {
    return initialLoadCompleteRef.current;
  };

  const forceSave = () => {
    lastSavedDataRef.current = '';
  };

  return {
    currentDataString,
    hasDataChanged,
    markAsSaved,
    setSaveInProgress,
    isSaveInProgress,
    setInitialLoadComplete,
    isInitialLoadComplete,
    forceSave,
  };
};
