import { ScreenStatusBar as StatusBar } from '@tohfa/mobile-ui';
import React from 'react';
import {
  Alert,
  Modal,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { authPalette as P, colors } from '../../../../theme';
import { t } from '../../../../../../i18n/farmer';
import { createFeedPlan } from '../../../../api/livestock';
import {
  INPUT_MAX_LENGTH,
  FEED_ITEM_UNIT_OPTIONS,
  GRAZING_UNIT_OPTIONS,
  WATER_SOURCE_OPTIONS,
  buildFeedPlanBody,
  FEED_TYPE_OPTIONS,
  optionLabel,
  optionValues,
} from '../animalRecordForms';

import { type PagedRecords } from '../useAnimalRecords';
import { styles } from './styles';
import {
  GreenBackArrowIcon,
  FormCalendarIcon,
  FormChevronDownIcon,
  FormCloseIcon,
  FormPlusIcon,
  AttachmentPaperclipIcon,
  ReceiptDocIcon,
  FormCheckmarkIcon,
  TrashIcon,
  PlusCircleOutlineIcon,
} from '../../../../assets/icons/AssetIcons';
import {
  FormErrors,
  ModalAnimalCard,
  type AttachmentState,
  type RecordModalContext,
} from './shared';
import { useFields } from './useFields';

/** One "daily feed item" row of the feed reference form. */
export interface FeedItem {
  id: string;
  name: string;
  amount: string;
  unit: string;
  isUnitOpen?: boolean;
}

/** Add Feed Reference form state (one state object; field and setter names unchanged). */
export function useFeedPlanForm() {
  return useFields({
    isAddFeedModalVisible: false,
    feedPlanName: '',
    feedType: 'GREEN_FODDER' as string,
    isFeedTypeDropdownOpen: false,
    feedSource: '',
    dailyGrazingDuration: '',
    dailyGrazingUnit: 'HOURS_PER_DAY' as string,
    isGrazingUnitDropdownOpen: false,
    waterSource: '',
    isWaterSourceDropdownOpen: false,
    feedStartTime: '',
    feedEndTime: '',
    feedItems: [{ id: 'f1', name: '', amount: '', unit: 'KG_PER_DAY' }] as FeedItem[],
    feedNotes: '',
    feedAttachment: null as AttachmentState,
    feedErrors: [] as string[],
  });
}

export type FeedPlanForm = ReturnType<typeof useFeedPlanForm>;

export interface FeedPlanModalProps {
  form: FeedPlanForm;
  ctx: RecordModalContext;
  feedPlanList: Pick<PagedRecords<unknown>, 'refresh'>;
}

/** Add Feed Reference modal (POST .../feed-plans). */
export function FeedPlanModal({ form, ctx, feedPlanList }: FeedPlanModalProps): React.JSX.Element {
  const {
    isAddFeedModalVisible,
    setIsAddFeedModalVisible,
    feedPlanName,
    setFeedPlanName,
    feedType,
    setFeedType,
    isFeedTypeDropdownOpen,
    setIsFeedTypeDropdownOpen,
    feedSource,
    setFeedSource,
    dailyGrazingDuration,
    setDailyGrazingDuration,
    dailyGrazingUnit,
    setDailyGrazingUnit,
    isGrazingUnitDropdownOpen,
    setIsGrazingUnitDropdownOpen,
    waterSource,
    setWaterSource,
    isWaterSourceDropdownOpen,
    setIsWaterSourceDropdownOpen,
    feedStartTime,
    setFeedStartTime,
    feedEndTime,
    setFeedEndTime,
    feedItems,
    setFeedItems,
    feedNotes,
    setFeedNotes,
    feedAttachment,
    setFeedAttachment,
    feedErrors,
    setFeedErrors,
  } = form;
  const {
    animalId,
    saving,
    displayName,
    summary,
    submitRecord,
    handlePickAttachment,
    attachmentSizeLabel,
  } = ctx;

  const handleAddFeedItem = () => {
    setFeedItems((prev) => [
      ...prev,
      { id: `fi_${Date.now()}`, name: '', amount: '', unit: 'KG_PER_DAY' },
    ]);
  };

  const handleRemoveFeedItem = (id: string) => {
    setFeedItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleUpdateFeedItemName = (id: string, name: string) => {
    setFeedItems((prev) => prev.map((item) => (item.id === id ? { ...item, name } : item)));
  };

  const handleUpdateFeedItemAmount = (id: string, amount: string) => {
    setFeedItems((prev) => prev.map((item) => (item.id === id ? { ...item, amount } : item)));
  };

  const handleToggleFeedItemUnit = (id: string) => {
    setFeedItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, isUnitOpen: !item.isUnitOpen } : item)),
    );
  };

  const handleSelectFeedItemUnit = (id: string, unit: string) => {
    setFeedItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, unit, isUnitOpen: false } : item)),
    );
  };

  const handleSaveFeedReference = async (): Promise<void> => {
    if (!animalId || saving) return;
    const saved = await submitRecord(
      buildFeedPlanBody({
        planName: feedPlanName,
        feedType,
        source: feedSource,
        grazingDuration: dailyGrazingDuration,
        grazingUnit: dailyGrazingUnit,
        waterSource,
        startTime: feedStartTime,
        endTime: feedEndTime,
        items: feedItems,
        notes: feedNotes,
      }),
      setFeedErrors,
      feedAttachment,
      (body) => createFeedPlan(animalId, body),
    );
    if (!saved) return;
    feedPlanList.refresh();
    setFeedAttachment(null);
    setIsAddFeedModalVisible(false);
    Alert.alert(
      t('farmer.livestock.detail.common.savedTitle'),
      t('farmer.livestock.detail.feed.savedBody', { name: displayName }),
    );
  };

  return (
    <Modal
      visible={isAddFeedModalVisible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setIsAddFeedModalVisible(false)}
    >
      <SafeAreaView style={styles.modalSafeArea}>
        <StatusBar barStyle="dark-content" backgroundColor={P.white} />

        {/* Modal Header */}
        <View style={styles.modalHeader}>
          <TouchableOpacity
            style={styles.modalBackBtn}
            onPress={() => setIsAddFeedModalVisible(false)}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={t('farmer.livestock.detail.a11y.back')}
          >
            <GreenBackArrowIcon size={24} color={P.deepGreen} />
          </TouchableOpacity>
          <Text style={styles.modalHeaderTitle}>
            {t('farmer.livestock.detail.feed.addReference')}
          </Text>
        </View>

        <ScrollView
          style={styles.modalScrollView}
          contentContainerStyle={styles.modalScrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Animal Summary Card */}
          <ModalAnimalCard summary={summary} />

          {/* Feed plan name */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>{t('farmer.livestock.detail.field.planName')}</Text>
            <TextInput
              style={styles.formTextInput}
              value={feedPlanName}
              onChangeText={setFeedPlanName}
              placeholder=""
              placeholderTextColor={P.twGray400}
              maxLength={INPUT_MAX_LENGTH.short}
            />
          </View>

          {/* Feed Type * (Dropdown) */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>
              {t('farmer.livestock.detail.field.feedType')}{' '}
              <Text style={styles.requiredAsterisk}>*</Text>
            </Text>
            <TouchableOpacity
              style={styles.formDropdownTrigger}
              onPress={() => setIsFeedTypeDropdownOpen(!isFeedTypeDropdownOpen)}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={t('farmer.livestock.detail.a11y.selectFeedType')}
            >
              <Text style={styles.formDropdownSelectedText}>
                {optionLabel(FEED_TYPE_OPTIONS, feedType)}
              </Text>
              <FormChevronDownIcon size={18} color={P.twGray500} />
            </TouchableOpacity>
            {isFeedTypeDropdownOpen && (
              <View style={styles.formDropdownMenu}>
                {optionValues(FEED_TYPE_OPTIONS).map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.formDropdownItem,
                      feedType === type && styles.formDropdownItemActive,
                    ]}
                    onPress={() => {
                      setFeedType(type);
                      setIsFeedTypeDropdownOpen(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.formDropdownItemText,
                        feedType === type && styles.formDropdownItemTextActive,
                      ]}
                    >
                      {optionLabel(FEED_TYPE_OPTIONS, type)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Source */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>{t('farmer.livestock.detail.field.feedSource')}</Text>
            <TextInput
              style={styles.formTextInput}
              value={feedSource}
              onChangeText={setFeedSource}
              placeholder=""
              placeholderTextColor={P.twGray400}
              maxLength={INPUT_MAX_LENGTH.short}
            />
          </View>

          {/* Daily grazing duration (Value + hours/day dropdown) */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>
              {t('farmer.livestock.detail.field.grazingDuration')}
            </Text>
            <View style={styles.doseRow}>
              <View style={[styles.doseValueContainer, styles.flexRatio12]}>
                <TextInput
                  style={styles.formTextInput}
                  value={dailyGrazingDuration}
                  onChangeText={setDailyGrazingDuration}
                  keyboardType="decimal-pad"
                  placeholder=""
                  placeholderTextColor={P.twGray400}
                  maxLength={INPUT_MAX_LENGTH.decimal}
                />
              </View>
              <TouchableOpacity
                style={[styles.doseUnitContainer, styles.flexRatio12]}
                onPress={() => setIsGrazingUnitDropdownOpen(!isGrazingUnitDropdownOpen)}
                activeOpacity={0.8}
              >
                <Text style={styles.formDropdownSelectedText}>
                  {optionLabel(GRAZING_UNIT_OPTIONS, dailyGrazingUnit)}
                </Text>
                <FormChevronDownIcon size={16} color={P.twGray500} />
              </TouchableOpacity>
            </View>
            {isGrazingUnitDropdownOpen && (
              <View style={styles.formDropdownMenu}>
                {optionValues(GRAZING_UNIT_OPTIONS).map((u) => (
                  <TouchableOpacity
                    key={u}
                    style={[
                      styles.formDropdownItem,
                      dailyGrazingUnit === u && styles.formDropdownItemActive,
                    ]}
                    onPress={() => {
                      setDailyGrazingUnit(u);
                      setIsGrazingUnitDropdownOpen(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.formDropdownItemText,
                        dailyGrazingUnit === u && styles.formDropdownItemTextActive,
                      ]}
                    >
                      {optionLabel(GRAZING_UNIT_OPTIONS, u)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Water source * (Dropdown) */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>
              {t('farmer.livestock.detail.field.waterSource')}{' '}
              <Text style={styles.requiredAsterisk}>*</Text>
            </Text>
            <TouchableOpacity
              style={styles.formDropdownTrigger}
              onPress={() => setIsWaterSourceDropdownOpen(!isWaterSourceDropdownOpen)}
              testID="feedForm.waterSourceTrigger"
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={t('farmer.livestock.detail.a11y.selectWaterSource')}
            >
              <Text
                style={
                  waterSource ? styles.formDropdownSelectedText : styles.formDropdownPlaceholder
                }
              >
                {optionLabel(WATER_SOURCE_OPTIONS, waterSource) ||
                  t('farmer.livestock.detail.common.selectType')}
              </Text>
              <FormChevronDownIcon size={18} color={P.twGray500} />
            </TouchableOpacity>
            {isWaterSourceDropdownOpen && (
              <View style={styles.formDropdownMenu}>
                {optionValues(WATER_SOURCE_OPTIONS).map((ws) => (
                  <TouchableOpacity
                    key={ws}
                    testID={`feedForm.waterSource:${ws}`}
                    style={[
                      styles.formDropdownItem,
                      waterSource === ws && styles.formDropdownItemActive,
                    ]}
                    onPress={() => {
                      setWaterSource(ws);
                      setIsWaterSourceDropdownOpen(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.formDropdownItemText,
                        waterSource === ws && styles.formDropdownItemTextActive,
                      ]}
                    >
                      {optionLabel(WATER_SOURCE_OPTIONS, ws)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Start Time + End time (side-by-side) */}
          <View style={styles.formRowHalf}>
            <View style={[styles.formGroup, styles.flexRatio10]}>
              <Text style={styles.formLabel}>{t('farmer.livestock.detail.field.startTime')}</Text>
              <View style={styles.formInputContainer}>
                <FormCalendarIcon size={18} color={P.twGray500} />
                <TextInput
                  style={styles.formInputWithIcon}
                  value={feedStartTime}
                  onChangeText={setFeedStartTime}
                  placeholder=""
                  placeholderTextColor={P.twGray400}
                  maxLength={INPUT_MAX_LENGTH.time}
                />
              </View>
            </View>

            <View style={[styles.formGroup, styles.flexRatio10]}>
              <Text style={styles.formLabel}>{t('farmer.livestock.detail.field.endTime')}</Text>
              <View style={styles.formInputContainer}>
                <FormCalendarIcon size={18} color={P.twGray500} />
                <TextInput
                  style={styles.formInputWithIcon}
                  value={feedEndTime}
                  onChangeText={setFeedEndTime}
                  placeholder=""
                  placeholderTextColor={P.twGray400}
                  maxLength={INPUT_MAX_LENGTH.time}
                />
              </View>
            </View>
          </View>

          {/* Daily feed items */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>{t('farmer.livestock.detail.field.feedItems')}</Text>
            <View style={styles.feedItemsContainer}>
              {feedItems.map((item, index) => (
                <View key={item.id} style={styles.feedItemBlock}>
                  <TextInput
                    style={styles.feedItemNameText}
                    value={item.name}
                    onChangeText={(val) => handleUpdateFeedItemName(item.id, val)}
                    placeholder={t('farmer.livestock.detail.feed.itemNamePlaceholder')}
                    placeholderTextColor={P.twGray400}
                    testID={`feedForm.itemName:${index}`}
                    maxLength={INPUT_MAX_LENGTH.short}
                  />
                  <View style={styles.feedItemRow}>
                    <TextInput
                      style={[styles.formTextInput, styles.flexRatio15]}
                      value={item.amount}
                      onChangeText={(val) => handleUpdateFeedItemAmount(item.id, val)}
                      testID={`feedForm.itemAmount:${index}`}
                      keyboardType="decimal-pad"
                      placeholder=""
                      placeholderTextColor={P.twGray400}
                      maxLength={INPUT_MAX_LENGTH.decimal}
                    />
                    <TouchableOpacity
                      style={[styles.doseUnitContainer, styles.flexRatio12]}
                      onPress={() => handleToggleFeedItemUnit(item.id)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.formDropdownSelectedText}>
                        {optionLabel(FEED_ITEM_UNIT_OPTIONS, item.unit)}
                      </Text>
                      <FormChevronDownIcon size={16} color={P.twGray500} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.feedItemDeleteBtn}
                      onPress={() => handleRemoveFeedItem(item.id)}
                      activeOpacity={0.7}
                      accessibilityRole="button"
                      accessibilityLabel={t('farmer.livestock.detail.a11y.deleteFeedItem', {
                        n: index + 1,
                      })}
                    >
                      <TrashIcon size={18} color={P.twRed500} />
                    </TouchableOpacity>
                  </View>
                  {item.isUnitOpen && (
                    <View style={styles.formDropdownMenu}>
                      {optionValues(FEED_ITEM_UNIT_OPTIONS).map((u) => (
                        <TouchableOpacity
                          key={u}
                          style={[
                            styles.formDropdownItem,
                            item.unit === u && styles.formDropdownItemActive,
                          ]}
                          onPress={() => handleSelectFeedItemUnit(item.id, u)}
                        >
                          <Text
                            style={[
                              styles.formDropdownItemText,
                              item.unit === u && styles.formDropdownItemTextActive,
                            ]}
                          >
                            {optionLabel(FEED_ITEM_UNIT_OPTIONS, u)}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              ))}
            </View>
          </View>

          {/* Notes */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>{t('farmer.livestock.detail.field.notes')}</Text>
            <TextInput
              style={styles.formNotesInput}
              value={feedNotes}
              onChangeText={setFeedNotes}
              multiline
              placeholder=""
              placeholderTextColor={P.twGray400}
              textAlignVertical="top"
              maxLength={INPUT_MAX_LENGTH.long}
            />
          </View>

          {/* Attachment Document */}
          <View style={styles.formGroup}>
            <View style={styles.attachmentLabelRow}>
              <AttachmentPaperclipIcon size={16} color={P.twGray600} />
              <Text style={styles.formLabel}>{t('farmer.livestock.detail.attachment.title')}</Text>
            </View>
            <TouchableOpacity
              style={styles.attachmentAddBox}
              onPress={() => void handlePickAttachment(setFeedAttachment, setFeedErrors)}
              testID="feedForm.attach"
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={t('farmer.livestock.detail.attachment.add')}
            >
              <View style={styles.attachmentAddBoxInner}>
                <View style={styles.attachmentAddCircleBtn}>
                  <FormPlusIcon size={18} color={colors.brandGreen} />
                </View>
                <View>
                  <Text style={styles.attachmentAddTitle}>
                    {t('farmer.livestock.detail.attachment.add')}
                  </Text>
                  <Text style={styles.attachmentAddSubtitle}>
                    {t('farmer.livestock.detail.attachment.hint')}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>

          {feedAttachment && (
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>{t('farmer.livestock.detail.attachment.label')}</Text>
              <View style={styles.attachmentCard}>
                <View style={styles.attachmentLeft}>
                  <ReceiptDocIcon size={36} />
                  <View style={styles.attachmentMetaCol}>
                    <Text style={styles.attachmentFilename}>{feedAttachment.name}</Text>
                    <Text style={styles.attachmentSize}>{attachmentSizeLabel(feedAttachment)}</Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.attachmentRemoveBtn}
                  onPress={() => setFeedAttachment(null)}
                  accessibilityRole="button"
                  accessibilityLabel={t('farmer.livestock.detail.attachment.remove')}
                >
                  <FormCloseIcon size={16} color={P.twGray600} />
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* + Add feed item button */}
          <TouchableOpacity
            style={styles.addFeedItemBtn}
            onPress={handleAddFeedItem}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={t('farmer.livestock.detail.feedForm.addItem')}
          >
            <PlusCircleOutlineIcon size={18} color={colors.brandGreen} />
            <Text style={styles.addFeedItemBtnText}>
              {t('farmer.livestock.detail.feedForm.addItem')}
            </Text>
          </TouchableOpacity>

          <FormErrors errors={feedErrors} testID="feedForm.errors" />

          {/* Form Bottom Action Buttons */}
          <View style={styles.modalActionButtonsRow}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => setIsAddFeedModalVisible(false)}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={t('farmer.livestock.detail.common.cancel')}
            >
              <Text style={styles.cancelBtnText}>{t('farmer.livestock.detail.common.cancel')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveBtn, saving && styles.saveBtnBusy]}
              onPress={() => void handleSaveFeedReference()}
              disabled={saving}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityState={{ disabled: saving, busy: saving }}
              accessibilityLabel={t('farmer.livestock.detail.common.save')}
              testID="feedForm.save"
            >
              <View style={styles.saveBtnRow}>
                <FormCheckmarkIcon size={18} color={P.white} />
                <Text style={styles.saveBtnText}>
                  {saving
                    ? t('farmer.livestock.detail.common.saving')
                    : t('farmer.livestock.detail.common.save')}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}
