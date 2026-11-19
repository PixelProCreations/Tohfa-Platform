import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { useTheme } from '../../../theme';
import { t } from '../../../../../i18n/farmer';
import { SearchIcon, CloseIcon, PinIcon } from './icons';
import { styles } from './styles';
import type { MapboxFeature } from './locationUtils';
import { SEARCH_QUERY_MAX_LENGTH, validateSearchQuery } from '../locationInputRules';
import { errorMessage } from '../../../utils/validation';

interface SearchOverlayProps {
  query: string;
  isSearching: boolean;
  suggestions: MapboxFeature[];
  onChangeQuery: (text: string) => void;
  onSubmit: () => void;
  onClearQuery: () => void;
  onCancel: () => void;
  onSelectSuggestion: (item: MapboxFeature) => void;
}

/** Expanded place-search bar with the autocomplete dropdown, shown over the map. */
export const SearchOverlay: React.FC<SearchOverlayProps> = ({
  query,
  isSearching,
  suggestions,
  onChangeQuery,
  onSubmit,
  onClearQuery,
  onCancel,
  onSelectSuggestion,
}) => {
  const { colors } = useTheme();
  // Shown after the farmer leaves the box or presses search; submit is blocked while invalid.
  const [touched, setTouched] = useState(false);
  const queryError = validateSearchQuery(query);
  const shownError = touched ? errorMessage(queryError, t) : undefined;
  const handleSubmit = () => {
    setTouched(true);
    if (queryError === null) onSubmit();
  };
  return (
    <View style={styles.searchContainer}>
      <View style={styles.searchBarRow}>
        <View style={styles.searchInputWrapper}>
          <SearchIcon size={18} color={colors.brandGreen} />
          <TextInput
            style={styles.searchInput}
            placeholder={t('farmer.map.searchPlaceholder')}
            placeholderTextColor={colors.textPlaceholder}
            value={query}
            onChangeText={onChangeQuery}
            maxLength={SEARCH_QUERY_MAX_LENGTH}
            autoFocus={true}
            returnKeyType="search"
            onBlur={() => setTouched(true)}
            onSubmitEditing={handleSubmit}
            testID="step3-search-input"
          />
          {isSearching && (
            <ActivityIndicator size="small" color={colors.brandGreen} style={styles.searchSpinner} />
          )}
          {query.length > 0 && !isSearching && (
            <TouchableOpacity
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              onPress={onClearQuery}
            >
              <CloseIcon size={16} color={colors.textSubtle} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity activeOpacity={0.7} style={styles.searchCancelBtn} onPress={onCancel}>
          <Text style={styles.searchCancelText}>{t('farmer.common.cancel')}</Text>
        </TouchableOpacity>
      </View>

      {shownError ? <Text style={[styles.fieldErrorText, { backgroundColor: colors.white }]}>{shownError}</Text> : null}

      {/* Autocomplete Suggestions Dropdown */}
      {suggestions.length > 0 && (
        <View style={styles.suggestionsList}>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled={true}
            style={styles.suggestionsScroll}
          >
            {suggestions.map((item, idx) => (
              <TouchableOpacity
                key={item.id || idx}
                style={[
                  styles.suggestionItem,
                  idx === suggestions.length - 1 && styles.suggestionItemLast,
                ]}
                onPress={() => onSelectSuggestion(item)}
              >
                <View style={styles.suggestionPinWrapper}>
                  <PinIcon size={15} color={colors.brandGreen} />
                </View>
                <View style={styles.suggestionTextWrapper}>
                  <Text style={styles.suggestionTitle} numberOfLines={1}>
                    {item.text}
                  </Text>
                  <Text style={styles.suggestionSubtitle} numberOfLines={1}>
                    {item.place_name}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
};
