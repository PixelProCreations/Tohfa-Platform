import type { ImageSourcePropType } from 'react-native';
import beetrootPhoto from '../../../../assets/images/real_beetroot.jpg';
import cabbagePhoto from '../../../../assets/images/real_cabbage.jpg';
import carrotPhoto from '../../../../assets/images/real_carrot.jpg';
import frenchBeansPhoto from '../../../../assets/images/real_french_beans.jpg';
import tomatoPhoto from '../../../../assets/images/real_tomato.jpg';

/**
 * The stock crop photos the listing designs use, keyed by crop name/slug
 * (crop_master `slug` and `name` both lower-case to these). This is a picture
 * of the crop TYPE, not of the farmer's produce: a listing's own uploaded
 * photo always wins, and a crop with no bundled photo renders the design's
 * tinted box empty rather than borrowing a different crop's picture.
 */
const CROP_PHOTOS: Record<string, ImageSourcePropType> = {
  carrot: carrotPhoto,
  cabbage: cabbagePhoto,
  beetroot: beetrootPhoto,
  beans: frenchBeansPhoto,
  'french beans': frenchBeansPhoto,
  tomato: tomatoPhoto,
};

export function cropPhotoFor(...keys: (string | null | undefined)[]): ImageSourcePropType | null {
  for (const key of keys) {
    if (!key) continue;
    const photo = CROP_PHOTOS[key.trim().toLowerCase()];
    if (photo !== undefined) return photo;
  }
  return null;
}

/** A listing's first uploaded photo, else the crop's stock photo, else null. */
export function listingPhotoSource(listing: { photos: string[]; cropName: string }): ImageSourcePropType | null {
  const uploaded = listing.photos[0];
  if (uploaded) return { uri: uploaded };
  return cropPhotoFor(listing.cropName);
}
