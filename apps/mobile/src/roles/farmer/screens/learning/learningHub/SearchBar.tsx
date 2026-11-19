import React from 'react';
import { TextInput, TouchableOpacity, View } from 'react-native';
import { authPalette as P } from '../../../theme';
import { ICON, TAB_PLACEHOLDER_KEY } from './constants';
import type { TabType } from './data';
import { lh } from './i18n';
import { CloseIcon, SearchIcon } from './icons';
import { styles } from './styles';
import { LEARNING_SEARCH_MAX_LENGTH } from '../learningValidation';

interface Props {
  activeTab: TabType;
  value: string;
  onChange: (text: string) => void;
}

export function SearchBar({ activeTab, value, onChange }: Props): React.JSX.Element {
  return (
    <View style={styles.searchContainer}>
      <SearchIcon size={ICON.search} color={P.greyMid2} />
      <TextInput
        style={styles.searchInput}
        placeholder={lh(TAB_PLACEHOLDER_KEY[activeTab])}
        placeholderTextColor={P.greyMid2}
        value={value}
        onChangeText={onChange}
        maxLength={LEARNING_SEARCH_MAX_LENGTH}
        accessibilityLabel={lh('search.a11y')}
      />
      {value.length > 0 && (
        <TouchableOpacity onPress={() => onChange('')} style={styles.clearSearchBtn}>
          <CloseIcon size={ICON.clear} color={P.greyMid2} />
        </TouchableOpacity>
      )}
    </View>
  );
}
