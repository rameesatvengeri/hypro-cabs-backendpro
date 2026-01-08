import React, { useState, useEffect, useCallback } from 'react';
import { 
  ViewType, 
  Vehicle, 
  Driver, 
  Trip, 
  MaintenanceRecord, 
  AppSettings 
} from './types';
import { 
  DEFAULT_SETTINGS, 
  STORAGE_KEYS 
} from './constants';
import { 
  safeLoad, 
  safeSave 
} from './services/storage';

// Components
import Navigation from './components/Navigation.tsx';
import Dashboard from './components/Dashboard.tsx';
import Estimator from './components/Estimator.tsx';
import TripEntry from './components/TripEntry.tsx';
import Fleet from './components/Fleet.tsx';
import Drivers from './components/Drivers.tsx';
import Settings from './components/Settings.tsx';

const App: React.FC = () => {
  const [view, setView] = useState<ViewType>('dashboard');
  
  // State initialization from storage
  const [vehicles, setVehicles] = useState<Vehicle[]>(() => safeLoad(STORAGE_KEYS.VEHICLES, []));
  const [drivers, setDrivers] = useState<Driver[]>(() => safeLoad(STORAGE_KEYS.DRIVERS, []));
  const [trips, setTrips] = useState<Trip[]>(() => safeLoad(STORAGE_KEYS.TRIPS, []));
  const [maintenance, setMaintenance] = useState<MaintenanceRecord[]>(() => safeLoad(STORAGE_KEYS.MAINTENANCE, []));
  
  // Settings with robust migration (Deep Merge)
  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = safeLoad(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
    return {
      ...DEFAULT_SETTINGS,
      ...saved,
      // Ensure nested objects are merged correctly so new fields (like 'logic') are not missing
      tariffs: { ...DEFAULT_SETTINGS.tariffs, ...(saved.tariffs || {}) },
      logic: { ...DEFAULT_SETTINGS.logic, ...(saved.logic || {}) }
    };
  });

  // Persistence Effects
  useEffect(() => safeSave(STORAGE_KEYS.VEHICLES, vehicles), [vehicles]);
  useEffect(() => safeSave(STORAGE_KEYS.DRIVERS, drivers), [drivers]);
  useEffect(() => safeSave(STORAGE_KEYS.TRIPS, trips), [trips]);
  useEffect(() => safeSave(STORAGE_KEYS.MAINTENANCE, maintenance), [maintenance]);
  useEffect(() => safeSave(STORAGE_KEYS.SETTINGS, settings), [settings]);

  // Handlers
  const handleAddTrip = useCallback((trip: Trip) => {
    setTrips(prev => [...prev, trip]);
    // Update Vehicle ODO
    setVehicles(prev => prev.map(v => 
      v.id === trip.vehicleId ? { ...v, currentOdo: trip.endKm } : v
    ));
  }, []);

  const handleUpdateTrip = useCallback((updatedTrip: Trip) => {
    setTrips(prev => prev.map(t => t.id === updatedTrip.id ? updatedTrip : t));
  }, []);

  const handleAddVehicle = (v: Vehicle) => setVehicles(prev => [...prev, v]);
  const handleUpdateVehicle = (updatedVehicle: Vehicle) => {
    setVehicles(prev => prev.map(v => v.id === updatedVehicle.id ? updatedVehicle : v));
  };
  const handleAddDriver = (d: Driver) => setDrivers(prev => [...prev, d]);
  const handleDeleteDriver = (id: string) => setDrivers(prev => prev.filter(d => d.id !== id));
  const handleAddMaintenance = (m: MaintenanceRecord) => setMaintenance(prev => [...prev, m]);

  // Main Render
  const renderContent = () => {
    switch (view) {
      case 'dashboard':
        return <Dashboard vehicles={vehicles} drivers={drivers} trips={trips} settings={settings} />;
      case 'estimator':
        return <Estimator settings={settings} />;
      case 'trips':
        return (
            <TripEntry 
                vehicles={vehicles} 
                drivers={drivers} 
                trips={trips} 
                onAddTrip={handleAddTrip} 
                onUpdateTrip={handleUpdateTrip}
                settings={settings} 
            />
        );
      case 'fleet':
        return (
          <Fleet 
            vehicles={vehicles} 
            trips={trips} 
            maintenance={maintenance} 
            onAddVehicle={handleAddVehicle} 
            onUpdateVehicle={handleUpdateVehicle}
            onAddMaintenance={handleAddMaintenance}
            settings={settings}
          />
        );
      case 'drivers':
        return <Drivers drivers={drivers} onAddDriver={handleAddDriver} onDeleteDriver={handleDeleteDriver} />;
      case 'settings':
        return <Settings settings={settings} onSettingsUpdate={setSettings} />;
      default:
        return <Dashboard vehicles={vehicles} drivers={drivers} trips={trips} settings={settings} />;
    }
  };

  return (
    <div className="max-w-md mx-auto min-h-screen bg-slate-950 relative shadow-2xl">
      <main className="pb-20">
        {renderContent()}
      </main>
      <Navigation currentView={view} onViewChange={setView} />
    </div>
  );
};

export default App;