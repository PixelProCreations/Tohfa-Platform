import React from 'react';
import { Text, View } from 'react-native';
import { authPalette as P } from '../../../../theme';
import { ICON } from './constants';
import type { HintKind } from './hints';
import { CheckCircleIcon, InfoCircleIcon, WarningTriangleIcon } from './icons';
import { styles } from './styles';

interface Props {
  kind: HintKind;
  text: string;
}

/** Icon + coloured message row shown under an input. */
export function HintBadge({ kind, text }: Props): React.JSX.Element {
  if (kind === 'warn') {
    return (
      <>
        <WarningTriangleIcon size={ICON.small} color={P.twRed600} />
        <Text style={styles.errorText}>{text}</Text>
      </>
    );
  }
  if (kind === 'ok') {
    return (
      <>
        <CheckCircleIcon size={ICON.small} color={P.twGreen600} />
        <Text style={styles.successText}>{text}</Text>
      </>
    );
  }
  return (
    <>
      <InfoCircleIcon size={ICON.small} color={P.deepPurple800} />
      <Text style={styles.infoText}>{text}</Text>
    </>
  );
}

/** Wrapper reproducing the original `badgeRow` container. */
export function HintRow({ children }: { children?: React.ReactNode }): React.JSX.Element {
  return <View style={styles.badgeRow}>{children}</View>;
}
