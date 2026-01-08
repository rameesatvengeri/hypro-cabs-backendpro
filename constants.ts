
import { AppSettings } from './types';

export const DEFAULT_SETTINGS: AppSettings = {
  currencySymbol: '₹',
  tariffs: {
    oneWay: {
      ratePerKm: 36
    },
    roundTrip: {
      ratePerKm: 20
    },
    city: {
      minimumBaseCharge: 400,
      includedBaseTimeMinutes: 60,
      includedBaseDistanceKM: 10,
      ratePerExtraMinute: 5,
      freeDistancePerMinuteFactor: 0.2,
      extraKMRate: 18
    },
    multiDay: {
      dailyRentAmount: 2800,
      includedDistancePerDay: 120,
      extraKMRate: 18,
      nightBataAmount: 400
    }
  },
  logic: {
    uberDriverShare: 60, // Percentage
    personalDriverShare: 25, // Percentage
    otherDriverShare: 30, // Percentage
    targetYield: 19, // INR per KM
    incentiveRate: 2, // INR per KM
    fineRate: 2, // INR per KM
    fuelAllowanceRate: 4 // INR per KM
  }
};

export const STORAGE_KEYS = {
  VEHICLES: 'hypro_vehicles',
  DRIVERS: 'hypro_drivers',
  TRIPS: 'hypro_trips',
  MAINTENANCE: 'hypro_maintenance',
  SETTINGS: 'hypro_settings',
};

export const EXPIRY_WARNING_DAYS = 15;
