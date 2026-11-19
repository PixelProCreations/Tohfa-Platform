import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ErrorState, Skeleton, ScreenStatusBar, SafeAreaView, appAlert } from '@tohfa/mobile-ui';
import { authPalette as P, colors } from '../../../theme';
import { t } from '../../../../../i18n/farmer';
import { errorMessage, hasErrors, type FieldErrors } from '../../../utils/validation';
import { formatErrorMessage } from '../../../../../shell/api/client';
import {
  createProductionLog,
  listAnimals,
  listProductionLogs,
  DAIRY_PRODUCT_UNITS,
  isDairyProductType,
  type AnimalResponse,
  type DairyProductType as ApiDairyProductType,
} from '../../../api/livestock';
import { DairyProductForm } from './dairyProduce/DairyProductForm';
import { EggForm } from './dairyProduce/EggForm';
import { MilkForm } from './dairyProduce/MilkForm';
import { PRODUCE_NOTES_MAX, validateProduceForm, type ProduceField } from './dairyProduce/validation';
import { ProductionHistoryModal } from './dairyProduce/ProductionHistoryModal';
import {
  ArrowBackIcon,
  CheckIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  CowIcon,
  DropIcon,
  EggIcon,
  GheeIcon,
  InfoCircleIcon,
  PawIcon,
  PlusIcon,
  renderProductIcon,
} from './dairyProduce/icons';
import {
  API_PRODUCT_TYPE_TO_LOCAL,
  DAIRY_PRODUCTS,
  PRODUCT_TYPE_TO_API,
  animalTypeText,
  dairyAnimalIconType,
  dairyAnimalTypeLabel,
  dp,
  isValueAddedType,
  apiOptionLabel,
  productCategory,
  productSubtitle,
  productTitle,
  toHistoryLog,
  todayIso,
  type AnimalMilkItem,
  type AvailableAnimal,
  type AvailableFlock,
  type DairyProductMeta,
  type DairyProductType,
  type FlockEggItem,
  type HistoryFilter,
  type ProduceHistoryLog,
  type ValueAddedProduceItem,
} from './dairyProduce/model';
import { styles } from './dairyProduce/styles';
import { useDairyProductForm } from './dairyProduce/useDairyProductForm';
import { useEggForm } from './dairyProduce/useEggForm';
import { useFormState } from './dairyProduce/useFormState';
import { useMilkForm } from './dairyProduce/useMilkForm';

export { DAIRY_PRODUCTS };
export type { DairyProductMeta, DairyProductType };

export interface DairyProduceScreenProps {
  onBack?: () => void;
}

/** Production rows shown on the screen -- seeded from real data once it
 *  loads (see `load()`), then kept in sync locally as the farmer logs more
 *  produce in this session (mirrors how the mock behaved, but backed by the
 *  server's own response for each save instead of fabricated deltas). */
interface ProductionRows {
  animals: AnimalMilkItem[];
  flocks: FlockEggItem[];
  valueAdded: ValueAddedProduceItem[];
  history: ProduceHistoryLog[];
}

export function DairyProduceScreen({ onBack }: DairyProduceScreenProps): React.JSX.Element {
  const insets = useSafeAreaInsets();
  // Real herd data, fetched once on mount.
  const [herd, setHerd] = useFormState<{ dairy: AnimalResponse[]; poultry: AnimalResponse[] }>({
    dairy: [],
    poultry: [],
  });
  const [loadState, setLoadState] = useFormState<{ loading: boolean; error: unknown | null }>({
    loading: true,
    error: null,
  });
  const [rows, setRows] = useFormState<ProductionRows>({ animals: [], flocks: [], valueAdded: [], history: [] });

  const load = useCallback(async () => {
    setLoadState({ loading: true, error: null });
    try {
      const [animalsResult, allLogsResult] = await Promise.all([listAnimals(), listProductionLogs()]);
      // Production logs now also carry per-animal MEAT / WOOL / MANURE (AnimalDetailScreen);
      // this screen is dairy-only, so those never reach its rows.
      const logsResult = { ...allLogsResult, items: allLogsResult.items.filter((log) => isDairyProductType(log.productType)) };
      const dairy = animalsResult.items.filter(
        (a) => a.species === 'CATTLE' || a.species === 'BUFFALO' || a.species === 'GOAT',
      );
      const poultry = animalsResult.items.filter((a) => a.species === 'POULTRY');
      setHerd({ dairy, poultry });

      const today = todayIso();
      const todaysLogs = logsResult.items.filter((log) => log.loggedOn === today);

      // Section 1: milk by animal, today -- real, since milk logs always carry an animalId.
      const milkByAnimal = new Map<string, { yieldLiters: number; sessions: number }>();
      todaysLogs
        .filter((log) => log.productType === 'MILK' && log.animalId)
        .forEach((log) => {
          const key = log.animalId as string;
          const prev = milkByAnimal.get(key) ?? { yieldLiters: 0, sessions: 0 };
          milkByAnimal.set(key, {
            yieldLiters: prev.yieldLiters + log.quantity,
            sessions: prev.sessions + (log.sessions ?? 1),
          });
        });
      const animals: AnimalMilkItem[] = dairy.map((a) => {
        const stats = milkByAnimal.get(a.id) ?? { yieldLiters: 0, sessions: 0 };
        return {
          id: a.id,
          name: a.name ?? a.tag,
          breed: a.breed ?? '',
          type: dairyAnimalTypeLabel(a.species),
          yieldLiters: stats.yieldLiters,
          sessions: stats.sessions,
          iconType: dairyAnimalIconType(a.species),
        };
      });

      // Section 3: egg production -- eggs are logged flock-level with no
      // animalId (livestock.schema.ts's createProductionLogBody docblock), so
      // server truth has no per-flock breakdown; each flock starts at 0 and
      // only reflects what gets logged in this session (see handleSaveProductionLog).
      const flocks: FlockEggItem[] = poultry.map((a) => ({
        id: a.id,
        name: a.name ?? a.tag,
        subtitle: a.notes ?? a.tag,
        count: 0,
      }));

      // Section 2: value-added dairy/eggs logged today -- fully real.
      const valueAdded: ValueAddedProduceItem[] = todaysLogs
        .filter((log) => log.productType !== 'MILK')
        .map((log) => {
          const localType = API_PRODUCT_TYPE_TO_LOCAL[log.productType as ApiDairyProductType];
          const meta = DAIRY_PRODUCTS.find((p) => p.id === localType);
          return {
            id: log.id,
            type: localType,
            name: meta ? productTitle(meta.id) : log.productType,
            quantity: log.quantity,
            unit: meta?.unit ?? log.unit,
            batchInfo: log.notes ?? log.batchInfo ?? '',
            date: t(dp('date.today')),
          };
        });

      setRows({
        animals,
        flocks,
        valueAdded,
        history: logsResult.items.map((log) => toHistoryLog(log, animalsResult.items)),
      });
    } catch (err: unknown) {
      setLoadState({ error: err });
    } finally {
      setLoadState({ loading: false });
    }
  }, [setHerd, setLoadState, setRows]);

  useEffect(() => {
    void load();
  }, [load]);

  const { dairy: dairyAnimals, poultry: poultryAnimals } = herd;

  // Save state
  const [saveState, setSaveState] = useFormState({ isSaving: false, error: '' });

  // Log Production dropdown, log modal, and history modal.
  const [ui, setUi] = useFormState<{
    isLogDropdownOpen: boolean;
    isLogModalOpen: boolean;
    selectedProduct: DairyProductType;
    isProductPickerOpen: boolean;
    isHistoryModalOpen: boolean;
    historyFilter: HistoryFilter;
  }>({
    isLogDropdownOpen: false,
    isLogModalOpen: false,
    selectedProduct: 'milk',
    isProductPickerOpen: false,
    isHistoryModalOpen: false,
    historyFilter: 'all',
  });
  const { selectedProduct } = ui;

  // Dynamic form state, one hook per form shape.
  const milkForm = useMilkForm();
  const dairyProductForm = useDairyProductForm();
  const eggForm = useEggForm();

  // Common notes
  const [produceNotes, setProduceNotes] = useState('');
  // Field errors stay hidden until the farmer presses Save, then update live as they fix them.
  const [showFieldErrors, setShowFieldErrors] = useState(false);

  // Real pickers, derived from this farmer's own herd (dairy species for
  // milk, POULTRY for flock-level egg collection -- see AvailableFlock's
  // docblock for why a POULTRY animal record IS the flock here).
  const availableAnimals: AvailableAnimal[] = dairyAnimals.map((a) => ({
    id: a.id,
    name: a.name ?? a.tag,
    type: dairyAnimalTypeLabel(a.species),
    breed: a.breed ?? '',
    code: a.tag,
    iconType: dairyAnimalIconType(a.species),
  }));
  const availableFlocks: AvailableFlock[] = poultryAnimals.map((a) => ({
    id: a.id,
    name: a.name ?? a.tag,
    subtitle: a.notes ?? a.tag,
  }));

  const EMPTY_ANIMAL: AvailableAnimal = {
    id: '',
    name: t('farmer.livestock.dairyProduce.noAnimalsOption'),
    type: 'Cow',
    breed: '',
    code: '',
    iconType: 'cow',
  };
  const EMPTY_FLOCK: AvailableFlock = { id: '', name: t('farmer.livestock.dairyProduce.noFlocksOption'), subtitle: '' };

  // Safely resolved current selections
  const currentAnimal: AvailableAnimal =
    availableAnimals[milkForm.state.animalIndex] ?? availableAnimals[0] ?? EMPTY_ANIMAL;
  const currentFlock: AvailableFlock = availableFlocks[eggForm.state.flockIndex] ?? availableFlocks[0] ?? EMPTY_FLOCK;
  const currentProductMeta: DairyProductMeta =
    DAIRY_PRODUCTS.find((p) => p.id === selectedProduct) ?? DAIRY_PRODUCTS[0]!;
  const currentProductTitle = productTitle(currentProductMeta.id);

  // Calculate totals
  const totalMilkToday = rows.animals.reduce((sum, a) => sum + a.yieldLiters, 0);
  const totalEggsToday = rows.flocks.reduce((sum, f) => sum + f.count, 0);
  const totalValueAddToday = rows.valueAdded.reduce((sum, va) => sum + va.quantity, 0);

  // Helper to open modal for specific product
  const produceErrors: FieldErrors<ProduceField> = validateProduceForm(selectedProduct, {
    quantity: selectedProduct === 'milk' ? milkForm.state.quantity : isValueAddedType(selectedProduct) ? dairyProductForm.state.quantity[selectedProduct] : '',
    fat: milkForm.state.fat,
    milkUsed:
      selectedProduct === 'curd' || selectedProduct === 'paneer' ? dairyProductForm.state.milkUsed[selectedProduct] : '',
    count: eggForm.state.count,
    damaged: eggForm.state.damaged,
    notes: produceNotes,
  });
  const shownErrors: Partial<Record<ProduceField, string>> = {};
  if (showFieldErrors) {
    for (const field of Object.keys(produceErrors) as ProduceField[]) {
      const message = errorMessage(produceErrors[field], t);
      if (message !== undefined) shownErrors[field] = message;
    }
  }

  const handleOpenLogModal = (prod: DairyProductType) => {
    setShowFieldErrors(false);
    setUi({ selectedProduct: prod, isLogDropdownOpen: false, isProductPickerOpen: false, isLogModalOpen: true });
  };

  const openHistory = (historyFilter: HistoryFilter) => setUi({ historyFilter, isHistoryModalOpen: true });

  // Save Unified Production Log
  const handleSaveProductionLog = async () => {
    if (saveState.isSaving) return;
    setSaveState({ error: '' });
    const allAnimals = [...dairyAnimals, ...poultryAnimals];

    if (selectedProduct === 'milk') {
      if (availableAnimals.length === 0 || !currentAnimal.id) {
        setSaveState({ error: t('farmer.livestock.dairyProduce.noAnimalsError') });
        return;
      }
      if (hasErrors(produceErrors)) {
        setShowFieldErrors(true);
        return;
      }
      // Validated above as a plain decimal, so parseFloat cannot misread it.
      const qty = parseFloat(milkForm.state.quantity.trim());
      const animal = currentAnimal;
      const fat = milkForm.state.fat.trim();
      setSaveState({ isSaving: true });
      try {
        const created = await createProductionLog({
          animalId: animal.id,
          productType: 'MILK',
          quantity: qty,
          unit: DAIRY_PRODUCT_UNITS.MILK,
          sessions: 1,
          notes: [apiOptionLabel('milkSession', milkForm.state.session), fat ? `Fat ${fat}%` : null]
            .filter(Boolean)
            .join(' · '),
        });
        setRows((prev) => ({
          animals: prev.animals.map((a) =>
            a.id === animal.id
              ? { ...a, yieldLiters: parseFloat((a.yieldLiters + created.quantity).toFixed(1)), sessions: a.sessions + 1 }
              : a,
          ),
          history: [toHistoryLog(created, allAnimals), ...prev.history],
        }));
        appAlert(
          t(dp('alert.milkLogged.title')),
          t(dp('alert.milkLogged.message'), { quantity: created.quantity, name: animal.name }),
          undefined,
          { tone: 'success' },
        );
        milkForm.resetEntries();
        setProduceNotes('');
        setShowFieldErrors(false);
        setUi({ isLogModalOpen: false });
      } catch (err: unknown) {
        setSaveState({ error: formatErrorMessage(err, t('farmer.livestock.dairyProduce.saveError')) });
      } finally {
        setSaveState({ isSaving: false });
      }
      return;
    }

    if (selectedProduct === 'eggs') {
      if (availableFlocks.length === 0 || !currentFlock.id) {
        setSaveState({ error: t('farmer.livestock.dairyProduce.noFlocksError') });
        return;
      }
      if (hasErrors(produceErrors)) {
        setShowFieldErrors(true);
        return;
      }
      const count = parseInt(eggForm.state.count.trim(), 10);
      const flock = currentFlock;
      const damaged = eggForm.state.damaged.trim();
      const dmgInfo = damaged ? `${damaged} damaged` : null;
      setSaveState({ isSaving: true });
      try {
        // Eggs are flock-level: `animalId` is deliberately omitted (see
        // AvailableFlock's docblock + livestock.schema.ts) -- the flock's
        // identity is preserved in `notes` instead, since createProductionLogBody
        // has no dedicated flock field.
        const created = await createProductionLog({
          productType: 'EGGS',
          quantity: count,
          unit: DAIRY_PRODUCT_UNITS.EGGS,
          notes: [flock.name, apiOptionLabel('eggSession', eggForm.state.session), dmgInfo].filter(Boolean).join(' · '),
        });
        setRows((prev) => ({
          flocks: prev.flocks.map((f) => (f.id === flock.id ? { ...f, count: f.count + created.quantity } : f)),
          history: [{ ...toHistoryLog(created, allAnimals), title: flock.name }, ...prev.history],
        }));
        appAlert(
          t(dp('alert.eggsLogged.title')),
          t(dp('alert.eggsLogged.message'), { quantity: created.quantity, name: flock.name }),
          undefined,
          { tone: 'success' },
        );
        eggForm.resetEntries();
        setProduceNotes('');
        setShowFieldErrors(false);
        setUi({ isLogModalOpen: false });
      } catch (err: unknown) {
        setSaveState({ error: formatErrorMessage(err, t('farmer.livestock.dairyProduce.saveError')) });
      } finally {
        setSaveState({ isSaving: false });
      }
      return;
    }

    // Value-added dairy (curd, paneer, butter, ghee, buttermilk, cheese)
    if (!isValueAddedType(selectedProduct)) return;
    const titleName = currentProductTitle;
    const { quantity: qtyStr, batchInfo } = dairyProductForm.read(selectedProduct);

    if (hasErrors(produceErrors)) {
      setShowFieldErrors(true);
      return;
    }
    const qty = parseFloat(qtyStr);

    const apiType = PRODUCT_TYPE_TO_API[selectedProduct];
    setSaveState({ isSaving: true });
    try {
      const created = await createProductionLog({
        productType: apiType,
        quantity: qty,
        unit: DAIRY_PRODUCT_UNITS[apiType],
        ...(batchInfo ? { batchInfo } : {}),
        ...(produceNotes.trim() ? { notes: produceNotes.trim() } : {}),
      });

      setRows((prev) => ({
        valueAdded: [
          {
            id: created.id,
            type: selectedProduct,
            name: titleName,
            quantity: created.quantity,
            unit: currentProductMeta.unit,
            batchInfo: batchInfo || t(dp('batch.today')),
            date: t(dp('date.today')),
          },
          ...prev.valueAdded,
        ],
        history: [{ ...toHistoryLog(created, allAnimals), title: titleName }, ...prev.history],
      }));

      appAlert(
        t(dp('alert.produceLogged.title')),
        t(dp('alert.produceLogged.message'), {
          quantity: created.quantity,
          unit: currentProductMeta.unit,
          title: titleName,
        }),
        undefined,
        { tone: 'success' },
      );
      dairyProductForm.resetQuantities();
      setProduceNotes('');
      setShowFieldErrors(false);
      setUi({ isLogModalOpen: false });
    } catch (err: unknown) {
      setSaveState({ error: formatErrorMessage(err, t('farmer.livestock.dairyProduce.saveError')) });
    } finally {
      setSaveState({ isSaving: false });
    }
  };

  if (loadState.loading) {
    return (
      <SafeAreaView style={styles.screen}>
        <ScreenStatusBar barStyle="dark-content" backgroundColor={P.white} />
        <View style={styles.loadingBody}>
          <Skeleton width="100%" height={42} borderRadius={21} />
          <Skeleton width="100%" height={80} borderRadius={14} />
          <Skeleton width="100%" height={56} borderRadius={14} />
          <Skeleton width="100%" height={56} borderRadius={14} />
        </View>
      </SafeAreaView>
    );
  }

  if (loadState.error) {
    return (
      <SafeAreaView style={styles.screen}>
        <ScreenStatusBar barStyle="dark-content" backgroundColor={P.white} />
        <View style={styles.errorBody}>
          <ErrorState error={loadState.error} onRetry={() => void load()} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <ScreenStatusBar barStyle="dark-content" backgroundColor={P.white} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Top Header ── */}
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={onBack}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={t(dp('back'))}
          >
            <ArrowBackIcon size={20} color={P.twGray900} />
          </TouchableOpacity>
          <View style={styles.headerTitleCol}>
            <Text style={styles.headerTitle}>{t(dp('header.title'))}</Text>
            <Text style={styles.headerSubtitle}>{t(dp('header.subtitle'))}</Text>
          </View>
        </View>

        {/* ── Summary Stats Cards (3 Columns) ── */}
        <View style={styles.summaryRow}>
          {/* Milk Summary Card */}
          <View style={styles.summaryCard}>
            <View style={[styles.summaryIconBox, styles.summaryIconBoxMilk]}>
              <DropIcon size={18} color={colors.brandGreen} fill={colors.brandGreen} />
            </View>
            <Text style={styles.summaryNumber}>{totalMilkToday.toFixed(1)} L</Text>
            <Text style={styles.summaryLabel}>{t(dp('summary.milk'))}</Text>
          </View>

          {/* Dairy Value Add Card */}
          <View style={styles.summaryCard}>
            <View style={[styles.summaryIconBox, styles.summaryIconBoxDairy]}>
              <GheeIcon size={18} color={P.twOrange600} />
            </View>
            <Text style={styles.summaryNumber}>{totalValueAddToday.toFixed(1)}</Text>
            <Text style={styles.summaryLabel}>{t(dp('summary.dairy'))}</Text>
          </View>

          {/* Eggs Summary Card */}
          <View style={styles.summaryCard}>
            <View style={[styles.summaryIconBox, styles.summaryIconBoxEggs]}>
              <EggIcon size={18} color={P.twAmber700} fill={P.twAmber700} />
            </View>
            <Text style={styles.summaryNumber}>{totalEggsToday}</Text>
            <Text style={styles.summaryLabel}>{t(dp('summary.eggs'))}</Text>
          </View>
        </View>

        {/* ── Action Dropdown: Log Produce ── */}
        <View style={styles.logDropdownContainer}>
          <TouchableOpacity
            style={[styles.logDropdownBtn, ui.isLogDropdownOpen && styles.logDropdownBtnActive]}
            activeOpacity={0.88}
            onPress={() => setUi((prev) => ({ isLogDropdownOpen: !prev.isLogDropdownOpen }))}
            accessibilityRole="button"
            accessibilityLabel={t(dp('log.buttonA11y'))}
          >
            <View style={styles.logDropdownBtnLeft}>
              <View style={styles.logDropdownIconBadge}>
                <PlusIcon size={16} color={P.white} />
              </View>
              <Text style={styles.logDropdownBtnText}>{t(dp('log.button'))}</Text>
            </View>
            <View style={ui.isLogDropdownOpen ? styles.chevronFlipped : undefined}>
              <ChevronDownIcon size={18} color={P.white} />
            </View>
          </TouchableOpacity>

          {/* Expanded Dropdown with all Dairy & Farm Products */}
          {ui.isLogDropdownOpen && (
            <View style={styles.logDropdownMenu}>
              <Text style={styles.dropdownCategoryHeader}>{t(dp('log.menuHeader'))}</Text>
              {DAIRY_PRODUCTS.map((prod, index) => {
                return (
                  <React.Fragment key={prod.id}>
                    <TouchableOpacity
                      style={styles.logDropdownOption}
                      activeOpacity={0.7}
                      onPress={() => handleOpenLogModal(prod.id)}
                      accessibilityRole="button"
                      accessibilityLabel={t(dp('log.productA11y'), { title: productTitle(prod.id) })}
                    >
                      <View style={[styles.logOptionIconBox, { backgroundColor: prod.badgeBg }]}>
                        {renderProductIcon(prod.id, 18)}
                      </View>
                      <View style={styles.logOptionTextBox}>
                        <View style={styles.optionTitleRow}>
                          <Text style={styles.logOptionTitle}>{productTitle(prod.id)}</Text>
                          <Text style={styles.optionCategoryTag}>{productCategory(prod.id)}</Text>
                        </View>
                        <Text style={styles.logOptionSub} numberOfLines={1}>
                          {productSubtitle(prod.id)}
                        </Text>
                      </View>
                      <ChevronRightIcon size={16} color={P.twGray400} />
                    </TouchableOpacity>
                    {index < DAIRY_PRODUCTS.length - 1 && <View style={styles.logDropdownDivider} />}
                  </React.Fragment>
                );
              })}
            </View>
          )}
        </View>

        {/* ── Section 1: Milk by Animal (Today) ── */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeaderTitle}>{t(dp('section.milk'))}</Text>
          <TouchableOpacity onPress={() => openHistory('milk')} activeOpacity={0.7} accessibilityRole="button">
            <Text style={styles.historyLinkText}>{t(dp('history.link'))}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.listContainer}>
          {rows.animals.map((item) => (
            <View key={item.id} style={styles.itemCard}>
              <View style={[styles.itemIconBadge, styles.itemIconBadgeMilk]}>
                {item.iconType === 'cow' ? (
                  <CowIcon size={20} color={colors.brandGreen} />
                ) : (
                  <PawIcon size={18} color={colors.brandGreen} />
                )}
              </View>

              <View style={styles.itemTextCol}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemSubtitle}>
                  {animalTypeText(item.type)} · {item.breed}
                </Text>
              </View>

              <View style={styles.itemRightCol}>
                <Text style={styles.itemStatBig}>{item.yieldLiters.toFixed(1)} L</Text>
                <Text style={styles.itemStatSub}>{t(dp('list.sessions'), { count: item.sessions })}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* ── Section 2: Value-Added Dairy Products ── */}
        <View style={[styles.sectionHeaderRow, styles.sectionHeaderRowSpaced]}>
          <Text style={styles.sectionHeaderTitle}>{t(dp('section.valueAdded'))}</Text>
          <TouchableOpacity onPress={() => openHistory('value_add')} activeOpacity={0.7} accessibilityRole="button">
            <Text style={styles.historyLinkText}>{t(dp('history.link'))}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.listContainer}>
          {rows.valueAdded.map((item) => {
            const meta = DAIRY_PRODUCTS.find((p) => p.id === item.type);
            return (
              <View key={item.id} style={styles.itemCard}>
                <View style={[styles.itemIconBadge, { backgroundColor: meta?.badgeBg || P.twGray100 }]}>
                  {renderProductIcon(item.type, 20)}
                </View>

                <View style={styles.itemTextCol}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemSubtitle} numberOfLines={1}>
                    {item.batchInfo}
                  </Text>
                </View>

                <View style={styles.itemRightCol}>
                  <Text style={styles.itemStatBig}>
                    {item.quantity} {item.unit}
                  </Text>
                  <Text style={styles.itemStatSub}>{item.date}</Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* ── Section 3: Egg Production (Flock) ── */}
        <View style={[styles.sectionHeaderRow, styles.sectionHeaderRowSpaced]}>
          <Text style={styles.sectionHeaderTitle}>{t(dp('section.eggs'))}</Text>
          <TouchableOpacity onPress={() => openHistory('eggs')} activeOpacity={0.7} accessibilityRole="button">
            <Text style={styles.historyLinkText}>{t(dp('history.link'))}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.listContainer}>
          {rows.flocks.map((item) => (
            <View key={item.id} style={styles.itemCard}>
              <View style={[styles.itemIconBadge, styles.itemIconBadgeEggs]}>
                <EggIcon size={20} color={P.twAmber700} fill={P.twAmber700} />
              </View>

              <View style={styles.itemTextCol}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemSubtitle}>{item.subtitle}</Text>
              </View>

              <View style={styles.itemRightCol}>
                <Text style={styles.itemStatBig}>{item.count}</Text>
                <Text style={styles.itemStatSub}>{t(dp('list.eggs'))}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* ── Info Notice Callout Box ── */}
        <View style={styles.infoCallout}>
          <View style={styles.infoIconCol}>
            <InfoCircleIcon size={18} color={P.sky600} />
          </View>
          <Text style={styles.infoText}>{t(dp('callout.text'))}</Text>
        </View>
      </ScrollView>

      {/* ─────────────────────────────────────────────
          DYNAMIC MODAL: LOG ANY DAIRY/FARM PRODUCE
          ───────────────────────────────────────────── */}
      <Modal
        visible={ui.isLogModalOpen}
        transparent
        animationType="slide"
        statusBarTranslucent
        navigationBarTranslucent
        onRequestClose={() => setUi({ isLogModalOpen: false })}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>{t(dp('modal.title'), { title: currentProductTitle })}</Text>
                <Text style={styles.modalSub}>{t(dp('modal.subtitle'))}</Text>
              </View>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setUi({ isLogModalOpen: false })}
                accessibilityRole="button"
              >
                <Text style={styles.modalCloseBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalForm} showsVerticalScrollIndicator={false}>
              {/* Product Type Switcher in Modal */}
              <Text style={styles.inputLabel}>{t(dp('modal.productCategory'))}</Text>
              <TouchableOpacity
                style={styles.dropdownTrigger}
                activeOpacity={0.8}
                onPress={() => setUi((prev) => ({ isProductPickerOpen: !prev.isProductPickerOpen }))}
              >
                <View style={styles.dropdownSelectedRow}>
                  <View style={[styles.miniBadge, { backgroundColor: currentProductMeta.badgeBg }]}>
                    {renderProductIcon(selectedProduct, 16)}
                  </View>
                  <View style={styles.flexFill}>
                    <Text style={styles.dropdownSelectedText}>{currentProductTitle}</Text>
                    <Text style={styles.dropdownSelectedSub}>{productCategory(currentProductMeta.id)}</Text>
                  </View>
                </View>
                <ChevronDownIcon size={18} color={P.twGray500} />
              </TouchableOpacity>

              {/* Product Picker Dropdown Options */}
              {ui.isProductPickerOpen && (
                <View style={styles.dropdownMenu}>
                  {DAIRY_PRODUCTS.map((prod) => {
                    const isSelected = selectedProduct === prod.id;
                    return (
                      <TouchableOpacity
                        key={prod.id}
                        style={[styles.dropdownMenuItem, isSelected && styles.dropdownMenuItemActive]}
                        onPress={() => {
                          setShowFieldErrors(false);
                          setUi({ selectedProduct: prod.id, isProductPickerOpen: false });
                        }}
                      >
                        <View style={styles.menuItemRow}>
                          <View style={[styles.miniBadge, { backgroundColor: prod.badgeBg }]}>
                            {renderProductIcon(prod.id, 15)}
                          </View>
                          <Text style={[styles.menuItemTitle, isSelected && styles.menuItemTitleActive]}>
                            {productTitle(prod.id)}
                          </Text>
                        </View>
                        {isSelected && <CheckIcon size={18} color={colors.brandGreen} />}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}

              {/* Dynamic form fields based on product */}
              {selectedProduct === 'milk' && (
                <MilkForm form={milkForm} animals={availableAnimals} currentAnimal={currentAnimal} errors={shownErrors} />
              )}
              {isValueAddedType(selectedProduct) && (
                <DairyProductForm product={selectedProduct} form={dairyProductForm} errors={shownErrors} />
              )}
              {selectedProduct === 'eggs' && (
                <EggForm form={eggForm} flocks={availableFlocks} currentFlock={currentFlock} errors={shownErrors} />
              )}

              {/* Common Notes */}
              <Text style={[styles.inputLabel, styles.inputLabelSpaced]}>{t(dp('notes.label'))}</Text>
              <TextInput
                style={[styles.textInput, styles.notesInput]}
                multiline
                placeholder={t(dp('notes.placeholder'))}
                placeholderTextColor={P.twGray400}
                value={produceNotes}
                onChangeText={setProduceNotes}
                maxLength={PRODUCE_NOTES_MAX}
                testID="produceForm.notes"
              />
              {shownErrors.notes ? <Text style={styles.fieldErrorText}>{shownErrors.notes}</Text> : null}

              {saveState.error ? (
                <View style={styles.saveErrorBanner} accessibilityLiveRegion="polite">
                  <Text style={styles.saveErrorBannerText}>{saveState.error}</Text>
                </View>
              ) : null}
            </ScrollView>

            {/* Modal Actions */}
            <View style={styles.modalActionRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setUi({ isLogModalOpen: false })}
                disabled={saveState.isSaving}
              >
                <Text style={styles.modalCancelBtnText}>{t(dp('modal.cancel'))}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalSaveBtn, styles.modalSaveBtnPrimary, saveState.isSaving && styles.modalSaveBtnDisabled]}
                onPress={() => void handleSaveProductionLog()}
                disabled={saveState.isSaving}
              >
                {saveState.isSaving ? (
                  <ActivityIndicator size="small" color={P.white} />
                ) : (
                  <Text style={styles.modalSaveBtnText}>{t(dp('modal.save'), { title: currentProductTitle })}</Text>
                )}
              </TouchableOpacity>
            </View>
            <View style={{ height: insets.bottom }} />
          </View>
        </View>
      </Modal>

      <ProductionHistoryModal
        visible={ui.isHistoryModalOpen}
        filter={ui.historyFilter}
        onFilterChange={(historyFilter) => setUi({ historyFilter })}
        logs={rows.history}
        onClose={() => setUi({ isHistoryModalOpen: false })}
      />
    </SafeAreaView>
  );
}
