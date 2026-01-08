
export interface Vehicle {
  id: string;
  name: string;
  model: string;
  plateNumber: string;
  currentOdo: number;
  insuranceExpiry: string;
  taxExpiry: string;
  permitExpiry: string;
  pollutionExpiry: string;
  fitnessExpiry: string;
}

export interface Driver {
  id: string;
  name: string;
  mobile: string;
  licenseNumber: string;
  licenseExpiry: string;
}

export interface TripSegment {
  id: string;
  category: 'uber' | 'personal' | 'other';
  km: number;
  revenue: number;
}

export interface FuelEntry {
  id: string;
  type: 'cng' | 'petrol';
  quantity: number;
  amount: number;
}

export interface Trip {
  id: string;
  vehicleId: string;
  driverId: string;
  
  // Duty Time
  dutyStart: string; // ISO String
  dutyEnd: string; // ISO String
  date: string; // Kept for index/sorting convenience (YYYY-MM-DD)

  // Odometer
  startKm: number;
  endKm: number;
  totalKm: number;

  // Breakdown
  segments: TripSegment[];
  fuelEntries: FuelEntry[];

  // Financials (Aggregates)
  revenue: number;
  fuelCost: number; // Actual cash spent on fuel
  tollOther: number;
  
  // Results
  driverPayout: number;
  profit: number; // Owner Share

  // Legacy fields (optional for migration safety if needed, though we are overwriting logic)
  tripType?: string;
}

export type MaintenanceType = 'Vehicle Service' | 'Water Wash' | 'Wheel Alignment' | 'Additional Vehicle Repair' | 'Others';

export interface MaintenanceRecord {
  id: string;
  vehicleId: string;
  date: string;
  type: MaintenanceType;
  description: string;
  cost: number;
}

export interface TariffOneWay {
  ratePerKm: number;
}

export interface TariffRoundTrip {
  ratePerKm: number;
}

export interface TariffCity {
  minimumBaseCharge: number;
  includedBaseTimeMinutes: number;
  includedBaseDistanceKM: number;
  ratePerExtraMinute: number;
  freeDistancePerMinuteFactor: number;
  extraKMRate: number;
}

export interface TariffMultiDay {
  dailyRentAmount: number;
  includedDistancePerDay: number;
  extraKMRate: number;
  nightBataAmount: number;
}

export interface TariffSettings {
  oneWay: TariffOneWay;
  roundTrip: TariffRoundTrip;
  city: TariffCity;
  multiDay: TariffMultiDay;
}

export interface LogicSettings {
  uberDriverShare: number;
  personalDriverShare: number;
  otherDriverShare: number;
  targetYield: number;
  incentiveRate: number;
  fineRate: number;
  fuelAllowanceRate: number;
}

export interface AppSettings {
  currencySymbol: string;
  tariffs: TariffSettings;
  logic: LogicSettings;
}

export type ViewType = 'dashboard' | 'estimator' | 'trips' | 'fleet' | 'drivers' | 'settings';
