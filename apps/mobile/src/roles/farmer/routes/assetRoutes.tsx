import React from 'react';
import { t } from '../../../i18n/farmer';
import { deleteFarmAsset } from '../api/farmAssets';
import { deleteTreePlanting } from '../api/treePlantings';
import { FarmInventoryScreen } from '../screens/farm/FarmInventoryScreen';
import { ToolsListScreen } from '../screens/farm/assets/ToolsListScreen';
import { AddToolScreen } from '../screens/farm/assets/AddToolScreen';
import { EditToolScreen } from '../screens/farm/assets/EditToolScreen';
import { EquipmentListScreen } from '../screens/farm/assets/EquipmentListScreen';
import { AddEquipmentScreen } from '../screens/farm/assets/AddEquipmentScreen';
import { EditEquipmentScreen } from '../screens/farm/assets/EditEquipmentScreen';
import { TreesListScreen } from '../screens/farm/assets/TreesListScreen';
import { AddPlantingScreen } from '../screens/farm/crops/AddPlantingScreen';
import { EditPlantingScreen } from '../screens/farm/crops/EditPlantingScreen';
import { MachineryListScreen } from '../screens/farm/assets/MachineryListScreen';
import { AddMachineryScreen } from '../screens/farm/assets/AddMachineryScreen';
import { EditMachineryScreen } from '../screens/farm/assets/EditMachineryScreen';
import { RemoveItemScreen, canDeleteAsset } from '../screens/farm/assets/RemoveItemScreen';
import type { FarmerRouteRenderer } from './types';

/** Farm inventory: tools, equipment, trees and machinery (list, add, edit, remove). */
export const renderAssetRoute: FarmerRouteRenderer = ({ screen, navigate, goBack, selections }) => {
  const {
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
  } = selections;
  switch (screen) {
    case 'FarmInventory':
      return (
        <FarmInventoryScreen
          onNavigateBack={goBack}
          onNavigateToCategory={(category) => {
            if (category === 'Tools') navigate('ToolsList');
            else if (category === 'Equipment') navigate('EquipmentList');
            else if (category === 'Trees') navigate('TreesList');
            else if (category === 'Machinery') navigate('MachineryList');
          }}
        />
      );
    case 'ToolsList':
      return (
        <ToolsListScreen
          onNavigateBack={goBack}
          onNavigateToAddTool={() => navigate('AddTool')}
          onNavigateToEditTool={(tool) => {
            setSelectedToolForEdit(tool);
            navigate('EditTool');
          }}
        />
      );
    case 'AddTool':
      return <AddToolScreen onNavigateBack={goBack} />;
    case 'EditTool':
      return (
        <EditToolScreen
          tool={
            selectedToolForEdit
              ? {
                id: selectedToolForEdit.id,
                name: selectedToolForEdit.name,
                purchaseDate: selectedToolForEdit.purchaseDate?.replace('Purchased ', ''),
                serviceInterval: selectedToolForEdit.serviceInterval ?? '90',
              }
              : undefined
          }
          onNavigateBack={goBack}
          onSave={() => goBack()}
          onRemove={() => {
            setSelectedItemForRemove({
              id: selectedToolForEdit?.id,
              name: selectedToolForEdit?.name || 'Knapsack Sprayer',
              category: 'Tools',
              dateInfo: `Tools · ${selectedToolForEdit?.purchaseDate || 'Purchased 04 Jan 2025'}`,
            });
            navigate('RemoveItem');
          }}
        />
      );
    case 'EquipmentList':
      return (
        <EquipmentListScreen
          onBack={goBack}
          onNavigateToAddEquipment={() => navigate('AddEquipment')}
          onNavigateToEditEquipment={(item) => {
            setSelectedEquipmentForEdit(item);
            navigate('EditEquipment');
          }}
        />
      );
    case 'AddEquipment':
      return <AddEquipmentScreen onNavigateBack={goBack} onSave={goBack} />;
    case 'EditEquipment':
      return (
        <EditEquipmentScreen
          equipment={
            selectedEquipmentForEdit
              ? {
                id: selectedEquipmentForEdit.id,
                name: selectedEquipmentForEdit.name,
                purchaseDate: selectedEquipmentForEdit.purchaseDate?.replace('Purchased ', ''),
                coverageArea: selectedEquipmentForEdit.coverageArea ?? '2.5',
                serviceInterval: selectedEquipmentForEdit.serviceInterval ?? '120',
              }
              : undefined
          }
          onNavigateBack={goBack}
          onSave={() => goBack()}
          onRemove={() => {
            setSelectedItemForRemove({
              id: selectedEquipmentForEdit?.id,
              name: selectedEquipmentForEdit?.name || 'Drip Irrigation Kit',
              category: 'Equipment',
              dateInfo: `Equipment · ${selectedEquipmentForEdit?.purchaseDate || 'Purchased 22 Feb 2024'}`,
            });
            navigate('RemoveItem');
          }}
        />
      );
    case 'TreesList':
      return (
        <TreesListScreen
          onBack={goBack}
          onNavigateToAddPlanting={() => navigate('AddPlanting')}
          onNavigateToEditPlanting={(item) => {
            setSelectedTreeForEdit(item);
            navigate('EditPlanting');
          }}
        />
      );
    case 'AddPlanting':
      return <AddPlantingScreen onNavigateBack={goBack} onSave={goBack} />;
    case 'EditPlanting':
      return (
        <EditPlantingScreen
          planting={
            selectedTreeForEdit
              ? {
                id: selectedTreeForEdit.id,
                species: selectedTreeForEdit.species ?? selectedTreeForEdit.name.split(' (')[0],
                treeCount: selectedTreeForEdit.treeCount,
                plantedDate: selectedTreeForEdit.plantedDate?.replace('Planted ', ''),
                locationZone: selectedTreeForEdit.zoneInfo,
                // A form prefill: no recorded purpose stays empty rather than becoming sample text.
                purpose: selectedTreeForEdit.purposeText,
              }
              : undefined
          }
          onNavigateBack={goBack}
          onSave={() => goBack()}
          onRemove={() => {
            setSelectedItemForRemove({
              id: selectedTreeForEdit?.id,
              name: selectedTreeForEdit?.name || t('farmer.trees.notRecorded'),
              category: 'Trees',
              dateInfo: t('farmer.trees.removeDateInfo', {
                date: selectedTreeForEdit?.plantedDate || t('farmer.trees.notRecorded'),
              }),
            });
            navigate('RemoveItem');
          }}
        />
      );
    case 'MachineryList':
      return (
        <MachineryListScreen
          onBack={goBack}
          onNavigateToAddMachinery={() => navigate('AddMachinery')}
          onNavigateToEditMachinery={(item) => {
            setSelectedMachineryForEdit(item);
            navigate('EditMachinery');
          }}
        />
      );
    case 'AddMachinery':
      return <AddMachineryScreen onNavigateBack={goBack} onSave={goBack} />;
    case 'EditMachinery':
      return (
        <EditMachineryScreen
          machinery={
            selectedMachineryForEdit
              ? {
                id: selectedMachineryForEdit.id,
                name: selectedMachineryForEdit.name,
                makeModel: selectedMachineryForEdit.makeModel,
                purchaseDate: selectedMachineryForEdit.purchaseDate?.replace('Purchased ', ''),
                fuelType: selectedMachineryForEdit.fuelType,
                serviceInterval: selectedMachineryForEdit.serviceInterval ?? '60',
              }
              : undefined
          }
          onNavigateBack={goBack}
          onSave={() => goBack()}
          onRemove={() => {
            setSelectedItemForRemove({
              id: selectedMachineryForEdit?.id,
              name: selectedMachineryForEdit?.name || 'Power Tiller',
              category: 'Machinery',
              dateInfo: `Machinery · ${selectedMachineryForEdit?.purchaseDate || 'Purchased 08 Feb 2023'}`,
            });
            navigate('RemoveItem');
          }}
        />
      );
    case 'RemoveItem':
      return (
        <RemoveItemScreen
          item={selectedItemForRemove ?? undefined}
          onNavigateBack={goBack}
          onConfirmRemove={async () => {
            // canDeleteAsset is the single source of truth for which categories have no
            // backend delete endpoint yet (see RemoveItemScreen.tsx) -- RemoveItemScreen
            // already refuses to call onConfirmRemove for those, so this is belt-and-braces,
            // not the gate itself.
            if (
              selectedItemForRemove?.id &&
              canDeleteAsset(selectedItemForRemove.category)
            ) {
              try {
                if (selectedItemForRemove.category === 'Trees') {
                  await deleteTreePlanting(selectedItemForRemove.id);
                } else {
                  await deleteFarmAsset(selectedItemForRemove.id);
                }
              } catch {
                // Ignore error and navigate back to list which refreshes
              }
            }
            if (selectedItemForRemove?.category === 'Tools') {
              navigate('ToolsList');
            } else if (selectedItemForRemove?.category === 'Equipment') {
              navigate('EquipmentList');
            } else if (selectedItemForRemove?.category === 'Trees') {
              navigate('TreesList');
            } else {
              navigate('MachineryList');
            }
          }}
        />
      );
    default:
      return undefined;
  }
};
