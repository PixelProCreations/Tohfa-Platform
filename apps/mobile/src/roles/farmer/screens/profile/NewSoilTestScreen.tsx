import React from 'react';
import { UploadNewSoilTestScreen, type UploadNewSoilTestScreenProps } from '../farm/soil/UploadNewSoilTestScreen';

export interface NewSoilTestScreenProps {
  farmId?: string | undefined;
  onNavigateBack: () => void;
  onSave?: () => void;
  onNavigateToFieldContext?: () => void;
}

export function NewSoilTestScreen({
  farmId = '',
  onNavigateBack,
  onSave,
  onNavigateToFieldContext,
}: NewSoilTestScreenProps): React.JSX.Element {
  return (
    <UploadNewSoilTestScreen
      farmId={farmId}
      onBack={onNavigateBack}
      onSave={onSave || onNavigateBack}
      onNavigateToFieldContext={onNavigateToFieldContext}
    />
  );
}
