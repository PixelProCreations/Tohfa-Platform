import React from 'react';
import { UploadNewSoilTestScreen, type UploadNewSoilTestScreenProps } from '../farm/UploadNewSoilTestScreen';

export interface NewSoilTestScreenProps {
  onNavigateBack: () => void;
  onSave?: () => void;
  onNavigateToFieldContext?: () => void;
}

export function NewSoilTestScreen({
  onNavigateBack,
  onSave,
  onNavigateToFieldContext,
}: NewSoilTestScreenProps): React.JSX.Element {
  return (
    <UploadNewSoilTestScreen
      onBack={onNavigateBack}
      onSave={onSave || onNavigateBack}
      onNavigateToFieldContext={onNavigateToFieldContext}
    />
  );
}
