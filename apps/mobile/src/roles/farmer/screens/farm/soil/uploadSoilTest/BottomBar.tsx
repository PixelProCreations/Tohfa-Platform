import React from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import { authPalette as P } from '../../../../theme';
import { st } from './i18n';
import { styles } from './styles';

interface Props {
  saveError: string | null;
  saveDisabled: boolean;
  saving: boolean;
  onCancel?: (() => void) | undefined;
  onSave: () => void;
}

export function BottomBar({
  saveError,
  saveDisabled,
  saving,
  onCancel,
  onSave,
}: Props): React.JSX.Element {
  return (
    <View style={styles.bottomBar}>
      {saveError ? <Text style={styles.saveErrorText}>{saveError}</Text> : null}
      <View style={styles.bottomBarRow}>
        <TouchableOpacity
          style={styles.cancelBtn}
          onPress={onCancel}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel={st('action.cancel')}
        >
          <Text style={styles.cancelBtnText}>{st('action.cancel')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.saveBtn, saveDisabled ? styles.saveBtnDisabled : styles.saveBtnEnabled]}
          onPress={onSave}
          disabled={saveDisabled}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel={st('a11y.save')}
        >
          {saving ? (
            <ActivityIndicator size="small" color={P.white} />
          ) : (
            <Text style={styles.saveBtnText}>{st('action.save')}</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}
