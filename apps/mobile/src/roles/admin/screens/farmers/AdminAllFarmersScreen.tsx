/**
 * AdminAllFarmersScreen: the farmers list (Farmers | Applications). The
 * screen lives in ./list/ (FarmersListScreen and its parts); this file keeps
 * the public names exported through ./index.ts. Hosts do not mount it
 * directly: they mount the shared ./FarmersFlow.
 *
 * FarmerListItem is re-exported from the legacy bridge only because the
 * satellite screens of other modules (map, scorecard, KYC review, cert
 * verification) still import the type from here.
 */
export { FarmersListScreen as AdminAllFarmersScreen } from './list/FarmersListScreen';
export type { AdminAllFarmersScreenProps } from './list/FarmersListScreen';
export type { FarmersMainTab } from './list/farmersListLogic';
export type { FarmersListNavTab } from './list/FarmersListParts';
export type { FarmerListItem } from './list/legacyFarmerListItem';
