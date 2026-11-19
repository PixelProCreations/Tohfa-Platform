import React from 'react';
import { Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { Icon, ModalSafeArea } from '@tohfa/mobile-ui';
import { authPalette as P } from '../../../theme';
import { styles } from './profileStyles';

interface ProfileModalShellProps {
  visible: boolean;
  title: string;
  onClose: () => void;
  /** Scrollable body (`ScrollView`) vs a plain `View`; both use the same `modalBody` style. */
  scroll?: boolean;
  footer: React.ReactNode;
  children: React.ReactNode;
}

/** The backdrop / card / title bar / footer chrome shared by every Profile bottom-sheet modal. */
export function ProfileModalShell({
  visible,
  title,
  onClose,
  scroll = true,
  footer,
  children,
}: ProfileModalShellProps): React.JSX.Element {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onClose}
    >
      <ModalSafeArea edges={['bottom']} style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose}>
              <Icon name="close" size={18} color={P.slate400} style={styles.modalCloseText} />
            </TouchableOpacity>
          </View>

          {scroll ? (
            <ScrollView showsVerticalScrollIndicator={false} style={styles.modalBody}>
              {children}
            </ScrollView>
          ) : (
            <View style={styles.modalBody}>{children}</View>
          )}

          <View style={styles.modalFooter}>{footer}</View>
        </View>
      </ModalSafeArea>
    </Modal>
  );
}

/** The single full-width primary button used as the footer of the read-only modals. */
export function ModalFullWidthButton({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}): React.JSX.Element {
  return (
    <TouchableOpacity style={[styles.saveBtn, styles.fullWidth]} onPress={onPress}>
      <Text style={styles.saveBtnText}>{label}</Text>
    </TouchableOpacity>
  );
}
