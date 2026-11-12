import React from 'react';
import { LivestockScreen } from '../screens/farm/livestock/LivestockScreen';
import { RegisterAnimalScreen } from '../screens/farm/livestock/RegisterAnimalScreen';
import { EditAnimalScreen } from '../screens/farm/livestock/EditAnimalScreen';
import { AnimalDetailScreen } from '../screens/farm/livestock/AnimalDetailScreen';
import { SaleTransferCullScreen } from '../screens/farm/livestock/SaleTransferCullScreen';
import { readRouteParams } from './routeParams';
import type { FarmerRouteRenderer } from './types';

/** Livestock: the herd, an animal's detail, register / edit, and sale / transfer / cull. */
export const renderLivestockRoute: FarmerRouteRenderer = ({ screen, params, navigate, goBack }) => {
  switch (screen) {
    case 'Livestock':
      return (
        <LivestockScreen
          onBack={goBack}
          onNavigateToAddAnimal={() => navigate('RegisterAnimal')}
          onNavigateToAnimalDetail={(animal) =>
            navigate('AnimalDetail', {
              animalId: animal.id,
              animalName: animal.name,
              animalCode: animal.code,
              species: animal.type,
              breed: animal.breed,
              gender: animal.gender,
              age: animal.age,
              statusBadge: animal.statusBadge,
            })
          }
        />
      );
    case 'AnimalDetail':
      // No stand-in animal: a missing id renders AnimalDetailScreen's error state.
      // The detail screen remounts when EditAnimal / RegisterAnimal go back, so it re-fetches.
      return (
        <AnimalDetailScreen
          {...(typeof params['animalId'] === 'string' ? { animalId: params['animalId'] } : {})}
          {...(typeof params['animalName'] === 'string' ? { animalName: params['animalName'] } : {})}
          {...(typeof params['animalCode'] === 'string' ? { animalCode: params['animalCode'] } : {})}
          {...(typeof params['species'] === 'string' ? { species: params['species'] } : {})}
          {...(typeof params['breed'] === 'string' ? { breed: params['breed'] } : {})}
          {...(typeof params['gender'] === 'string' ? { gender: params['gender'] } : {})}
          {...(typeof params['age'] === 'string' ? { age: params['age'] } : {})}
          {...(typeof params['statusBadge'] === 'string' ? { statusBadge: params['statusBadge'] } : {})}
          onBack={goBack}
          onNavigateToEdit={(animalData) => navigate('EditAnimal', animalData || {})}
          onNavigateToRegisterOffspring={() => navigate('RegisterAnimal')}
          onNavigateToSale={() =>
            navigate('SaleTransferCull', {
              animalId: params['animalId'],
              animalName: params['animalName'],
              animalCode: params['animalCode'],
            })
          }
        />
      );
    case 'EditAnimal':
      return (
        <EditAnimalScreen
          initialAnimal={readRouteParams('EditAnimal', params)}
          onBack={goBack}
          onCancel={goBack}
          onSave={() => goBack()}
        />
      );
    case 'SaleTransferCull':
      return (
        <SaleTransferCullScreen
          {...(typeof params['animalId'] === 'string' ? { animalId: params['animalId'] } : {})}
          {...(typeof params['animalName'] === 'string' ? { animalName: params['animalName'] } : {})}
          {...(typeof params['animalCode'] === 'string' ? { animalCode: params['animalCode'] } : {})}
          onBack={goBack}
          onSuccess={() => navigate('Livestock')}
        />
      );
    case 'RegisterAnimal':
      return (
        <RegisterAnimalScreen
          initialAnimal={readRouteParams('RegisterAnimal', params)}
          onBack={goBack}
          onCancel={goBack}
          onSave={() => goBack()}
        />
      );
    default:
      return undefined;
  }
};
