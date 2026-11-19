import { useState } from 'react';
import type { Listing, ListingCropChoice } from '../api/listings';
import type { Certification } from '../api/farmer';
import type { ContentDetailItem } from '../screens/learning/ContentDetailScreen';
import type { GroupItem } from '../screens/learning/GroupsScreen';
import type { CropItem } from '../screens/farm/crops/ProduceCalendarScreen';
import type { ToolItem } from '../screens/farm/assets/ToolsListScreen';
import type { EquipmentItem } from '../screens/farm/assets/EquipmentListScreen';
import type { TreePlantingItem } from '../screens/farm/assets/TreesListScreen';
import type { MachineryItem } from '../screens/farm/assets/MachineryListScreen';
import type { RemoveItemData } from '../screens/farm/assets/RemoveItemScreen';

/**
 * Records a farmer screen picked on one screen and handed to the next (a
 * listing to counter, a crop to log against, an asset to edit or remove).
 * They are App-level state, not route params, because the next screen takes
 * the whole object and the history stack must not duplicate it.
 */
export function useFarmerSelections() {
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  // Crop picked on create-listing step 1, carried to step 2.
  const [listingDraftCrop, setListingDraftCrop] = useState<ListingCropChoice | null>(null);
  const [selectedCertification, setSelectedCertification] = useState<Certification | null>(null);
  const [selectedContentDetail, setSelectedContentDetail] = useState<ContentDetailItem | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<GroupItem | null>(null);
  const [selectedCrop, setSelectedCrop] = useState<CropItem | null>(null);
  const [selectedToolForEdit, setSelectedToolForEdit] = useState<ToolItem | null>(null);
  const [selectedEquipmentForEdit, setSelectedEquipmentForEdit] = useState<EquipmentItem | null>(null);
  const [selectedTreeForEdit, setSelectedTreeForEdit] = useState<TreePlantingItem | null>(null);
  const [selectedMachineryForEdit, setSelectedMachineryForEdit] = useState<MachineryItem | null>(null);
  const [selectedItemForRemove, setSelectedItemForRemove] = useState<RemoveItemData | null>(null);
  return {
    selectedListing,
    setSelectedListing,
    listingDraftCrop,
    setListingDraftCrop,
    selectedCertification,
    setSelectedCertification,
    selectedContentDetail,
    setSelectedContentDetail,
    selectedGroup,
    setSelectedGroup,
    selectedCrop,
    setSelectedCrop,
    selectedToolForEdit,
    setSelectedToolForEdit,
    selectedEquipmentForEdit,
    setSelectedEquipmentForEdit,
    selectedTreeForEdit,
    setSelectedTreeForEdit,
    selectedMachineryForEdit,
    setSelectedMachineryForEdit,
    selectedItemForRemove,
    setSelectedItemForRemove,
  };
}

export type FarmerSelections = ReturnType<typeof useFarmerSelections>;
