import React from 'react';
import { Modal, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SEED_QUANTITY_UNITS } from './constants';
import { nt } from './i18n';
import { styles } from './styles';
import type { NewCropFormApi } from './useNewCropForm';

/** Crop, unit and zone selection modals. */
export function PickerModals({ form }: { form: NewCropFormApi }): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const { state, set } = form;
  return (
    <>
      {/* ── Crop Picker Modal ── */}
      <Modal statusBarTranslucent navigationBarTranslucent onRequestClose={() => set({ showCropPicker: false })} visible={state.showCropPicker} transparent animationType="fade">
        <TouchableOpacity
          style={[styles.modalBackdrop, { paddingBottom: insets.bottom }]}
          activeOpacity={1}
          onPress={() => set({ showCropPicker: false })}
        >
          <View style={styles.pickerModalContent}>
            <Text style={styles.pickerTitle}>{nt('picker.selectCrop')}</Text>
            {state.cropMasterList.map((crop) => (
              <TouchableOpacity
                key={crop.id}
                style={[
                  styles.pickerOption,
                  state.selectedCropMasterId === crop.id && styles.pickerOptionSelected,
                ]}
                onPress={() => form.selectCrop(crop)}
              >
                <Text
                  style={[
                    styles.pickerOptionText,
                    state.selectedCropMasterId === crop.id && styles.pickerOptionTextSelected,
                  ]}
                >
                  {crop.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ── Unit Picker Modal ── */}
      <Modal statusBarTranslucent navigationBarTranslucent onRequestClose={() => set({ showUnitPicker: false })} visible={state.showUnitPicker} transparent animationType="fade">
        <TouchableOpacity
          style={[styles.modalBackdrop, { paddingBottom: insets.bottom }]}
          activeOpacity={1}
          onPress={() => set({ showUnitPicker: false })}
        >
          <View style={styles.pickerModalContent}>
            <Text style={styles.pickerTitle}>{nt('picker.selectUnit')}</Text>
            {SEED_QUANTITY_UNITS.map((u) => (
              <TouchableOpacity
                key={u}
                style={[styles.pickerOption, state.quantityUnit === u && styles.pickerOptionSelected]}
                onPress={() => set({ quantityUnit: u, showUnitPicker: false })}
              >
                <Text
                  style={[
                    styles.pickerOptionText,
                    state.quantityUnit === u && styles.pickerOptionTextSelected,
                  ]}
                >
                  {nt(`unit.${u}`)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ── Zone Picker Modal ── */}
      <Modal statusBarTranslucent navigationBarTranslucent onRequestClose={() => set({ showZonePicker: false })} visible={state.showZonePicker} transparent animationType="fade">
        <TouchableOpacity
          style={[styles.modalBackdrop, { paddingBottom: insets.bottom }]}
          activeOpacity={1}
          onPress={() => set({ showZonePicker: false })}
        >
          <View style={styles.pickerModalContent}>
            <Text style={styles.pickerTitle}>{nt('picker.selectZone')}</Text>
            {state.plots.map((plot) => (
              <TouchableOpacity
                key={plot.id}
                style={[
                  styles.pickerOption,
                  state.selectedPlotId === plot.id && styles.pickerOptionSelected,
                ]}
                onPress={() => form.selectZone(plot)}
              >
                <Text
                  style={[
                    styles.pickerOptionText,
                    state.selectedPlotId === plot.id && styles.pickerOptionTextSelected,
                  ]}
                >
                  {plot.name}
                  {plot.areaAcres !== null ? nt('picker.zoneArea', { area: plot.areaAcres }) : ''}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}
