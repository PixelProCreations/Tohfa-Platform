import React from 'react';
import { CounterOfferScreen } from '../screens/listings/CounterOfferScreen';
import { CreateListingScreen } from '../screens/listings/CreateListingScreen';
import { CreateListingStep2Screen } from '../screens/listings/CreateListingStep2Screen';
import { ListingDetailScreen } from '../screens/listings/ListingDetailScreen';
import { MyListingsScreen } from '../screens/listings/MyListingsScreen';
import type { FarmerRouteRenderer } from './types';

/** Create a listing (two steps), counter an offer, a listing's detail and My Listings. */
export const renderListingRoute: FarmerRouteRenderer = ({ screen, params, navigate, goBack, nav, selections }) => {
  const { selectedListing, setSelectedListing, listingDraftCrop, setListingDraftCrop } = selections;
  switch (screen) {
    case 'CreateListing':
      return (
        <CreateListingScreen
          onCancel={goBack}
          onNext={(crop) => {
            setListingDraftCrop(crop);
            navigate('CreateListingStep2');
          }}
        />
      );
    case 'CreateListingStep2':
      return (
        <CreateListingStep2Screen
          crop={listingDraftCrop}
          onCancel={goBack}
          onBack={goBack}
          onSuccess={() => {
            // Land on My Listings (it fetches on mount, so the new listing is
            // on it) with the create flow dropped from history: Back goes to
            // the Marketing tab, not to an emptied step 2. The draft crop is
            // cleared last so step 2 never re-renders without it.
            nav.setHistory([{ screen: 'MainTabs', params: {}, tab: 'Listings' }]);
            nav.setCurrentTab('Listings');
            nav.setParams({});
            nav.setScreen('MyListings');
            setListingDraftCrop(null);
          }}
        />
      );
    case 'CounterOffer':
      return (
        <CounterOfferScreen
          listing={selectedListing}
          listingId={
            typeof params['listingId'] === 'string' ? params['listingId'] : selectedListing?.id
          }
          // The screen we return to re-fetches on mount, so it shows the new
          // status. selectedListing is left as-is (the next open overwrites it):
          // clearing it here would re-render this screen as "no longer open"
          // for a frame before the back navigation lands.
          onSuccess={() => goBack()}
          onCancel={goBack}
        />
      );
    case 'ListingDetail':
      return <ListingDetailScreen listing={selectedListing} onBack={goBack} />;
    case 'MyListings':
      return (
        <MyListingsScreen
          onNavigateBack={goBack}
          onNavigateToListingDetail={(listing) => {
            setSelectedListing(listing);
            navigate('ListingDetail');
          }}
          onNavigateToCounterOffer={(listing) => {
            setSelectedListing(listing);
            navigate('CounterOffer');
          }}
        />
      );
    default:
      return undefined;
  }
};
