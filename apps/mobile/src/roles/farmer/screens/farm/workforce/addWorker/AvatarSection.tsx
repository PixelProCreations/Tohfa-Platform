import React from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';
import { authPalette as P } from '../../../../theme';
import { CameraIcon } from './icons';
import { aw } from './i18n';
import { styles } from './styles';

interface Props {
  name: string;
  photoUri: string | null;
  onPickPhoto: () => void;
}

export function AvatarSection({ name, photoUri, onPickPhoto }: Props): React.JSX.Element {
  const initials = name
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase() || '?';

  return (
    <View style={styles.avatarSection}>
      <TouchableOpacity
        style={styles.avatarContainer}
        onPress={onPickPhoto}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel={aw('changePhoto')}
      >
        {photoUri ? (
          <Image source={{ uri: photoUri }} style={styles.avatarCircle} />
        ) : (
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarInitials}>{initials}</Text>
          </View>
        )}

        <View style={styles.cameraBadge}>
          <CameraIcon size={13} color={P.white} />
        </View>
      </TouchableOpacity>

      <Text style={styles.avatarHint}>{aw('addPhotoHint')}</Text>
    </View>
  );
}
