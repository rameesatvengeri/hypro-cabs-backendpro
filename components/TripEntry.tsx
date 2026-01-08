
import React, { useState, useMemo, useEffect } from 'react';
import { Vehicle, Driver, Trip, AppSettings, TripSegment, FuelEntry } from '../types';
import { DEFAULT_SETTINGS } from '../constants';

interface TripEntryProps {
  vehicles: Vehicle[];
  drivers: Driver[];
  trips: Trip[];
  onAddTrip: (trip: Trip) => void;
  onUpdateTrip: (trip: Trip) => void;
  settings: AppSettings;
}

const TripEntry: React.FC<TripEntryProps> = ({ vehicles, drivers, trips, onAddTrip, onUpdateTrip, settings }) => {
  const [activeTab, setActiveTab] = useState<'list' | 'new'>('list');
  const [editingTripId, setEditingTripId] = useState<string | null>(null);

  // --- Form State ---
  const [vehicleId, setVehicleId] = useState(vehicles[0]?.id || '');
  const [driverId, setDriverId] = useState(drivers[0]?.id || '');
  
  // Duty Times
  const [dutyStart, setDutyStart] = useState('');
  const [dutyEnd, setDutyEnd] = useState('');
  
  // Odometer
  const [startKm, setStartKm] = useState<number>(0);
  const [endKm, setEndKm] = useState<number>(0);
  // Derived Total Distance
  const totalKm = Math.max(0, endKm - startKm);

  // Multi-Rows
  const [segments, setSegments] = useState<TripSegment[]>([
      { id: '1', category: 'uber', km: 0, revenue: 0 }
  ]);
  const [fuelEntries, setFuelEntries] = useState<FuelEntry[]>([]);
  const [tollOther, setTollOther] = useState<number>(0);

  // Filter/Sort State
  const [filterVehicle, setFilterVehicle] = useState('all');
  const [filterDriver, setFilterDriver] = useState('all');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'revenue' | 'profit'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Logic Settings (Fallback to default if undefined to prevent crashes)
  const logic = settings.logic || DEFAULT_SETTINGS.logic;

  // --- Effects ---

  // Auto-fetch Start KM when Vehicle ID changes (Only if NOT editing)
  useEffect(() => {
    if (vehicleId && !editingTripId) {
        const vehicle = vehicles.find(v => v.id === vehicleId);
        if (vehicle) {
            setStartKm(vehicle.currentOdo);
            setEndKm(vehicle.currentOdo); 
        }
    }
  }, [vehicleId, vehicles, editingTripId]);

  // Set default times for new trip (Local Time)
  useEffect(() => {
    if (!editingTripId) {
        const now = new Date();
        // Adjust for timezone to get local time in ISO string
        const localNow = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
        const endStr = localNow.toISOString().slice(0, 16);

        const start = new Date(now.getTime() - 12 * 60 * 60 * 1000); // 12 hours ago
        const localStart = new Date(start.getTime() - start.getTimezoneOffset() * 60000);
        const startStr = localStart.toISOString().slice(0, 16);

        setDutyEnd(endStr);
        setDutyStart(startStr);
    }
  }, [editingTripId, activeTab]);

  // --- Actions ---

  const addSegment = () => {
      setSegments([...segments, { id: Date.now().toString(), category: 'uber', km: 0, revenue: 0 }]);
  };

  const removeSegment = (id: string) => {
      if (segments.length > 1) {
          setSegments(segments.filter(s => s.id !== id));
      }
  };

  const addFuel = () => {
      setFuelEntries([...fuelEntries, { id: Date.now().toString(), type: 'cng', quantity: 0, amount: 0 }]);
  };

  const removeFuel = (id: string) => {
      setFuelEntries(fuelEntries.filter(f => f.id !== id));
  };

  const resetForm = () => {
    setEditingTripId(null);
    setSegments([{ id: Date.now().toString(), category: 'uber', km: 0, revenue: 0 }]);
    setFuelEntries([]);
    setTollOther(0);
    // Refresh vehicle ODO
    if (vehicles.length > 0 && vehicleId) {
         const vehicle = vehicles.find(v => v.id === vehicleId);
         if (vehicle) {
             setStartKm(vehicle.currentOdo);
             setEndKm(vehicle.currentOdo);
         }
    }
  };

  const handleEditTrip = (trip: Trip) => {
      setEditingTripId(trip.id);
      setVehicleId(trip.vehicleId);
      setDriverId(trip.driverId);
      setDutyStart(trip.dutyStart || trip.date + 'T09:00'); // Fallback for legacy
      setDutyEnd(trip.dutyEnd || trip.date + 'T21:00');
      setStartKm(trip.startKm);
      setEndKm(trip.endKm);
      setTollOther(trip.tollOther);
      
      // Handle segments
      if (trip.segments && trip.segments.length > 0) {
          setSegments(trip.segments);
      } else {
          // Legacy trip conversion
          setSegments([{ 
              id: 'legacy', 
              category: (trip.tripType as any) === 'uber' ? 'uber' : (trip.tripType as any) === 'personal' ? 'personal' : 'other',
              km: trip.totalKm, 
              revenue: trip.revenue 
          }]);
      }

      // Handle Fuel
      if (trip.fuelEntries && trip.fuelEntries.length > 0) {
          setFuelEntries(trip.fuelEntries);
      } else if (trip.fuelCost > 0) {
           setFuelEntries([{ id: 'legacy', type: 'cng', quantity: 0, amount: trip.fuelCost }]);
      } else {
          setFuelEntries([]);
      }
      
      setActiveTab('new');
  };

  // --- Calculations ---

  const calculatedResults = useMemo(() => {
    let totalRevenue = 0;
    let totalFuelBill = fuelEntries.reduce((acc, f) => acc + f.amount, 0);
    
    // Auto-distribute KM if single segment
    // CRITICAL FIX: Deep copy to avoid mutating state directly during render
    let processedSegments = segments.map(s => ({...s}));
    if (processedSegments.length === 1) {
        processedSegments[0].km = totalKm;
    }

    let totalDriverPayout = 0;
    let totalOwnerShare = 0;

    const breakdown = processedSegments.map(seg => {
        totalRevenue += seg.revenue;
        
        let driverShareAmount = 0;
        let ownerShareAmount = 0;
        let incentive = 0;
        let fine = 0;
        let fuelAllowance = 0;

        if (seg.category === 'uber') {
            // Uber Logic
            const baseShare = seg.revenue * (logic.uberDriverShare / 100);
            
            // Yield Logic
            const targetDistance = logic.targetYield > 0 ? seg.revenue / logic.targetYield : 0;
            const diff = seg.km - targetDistance;
            
            if (diff > 0) {
                // Inefficient: Fine
                fine = diff * logic.fineRate;
            } else {
                // Efficient: Incentive (diff is negative, make positive)
                incentive = Math.abs(diff) * logic.incentiveRate;
            }

            driverShareAmount = baseShare + incentive - fine;
            
            // Owner gets remaining revenue
            // Driver pays fuel, so owner share is just Revenue - DriverPayout
            ownerShareAmount = seg.revenue - driverShareAmount;

        } else if (seg.category === 'personal') {
            // Personal Logic
            driverShareAmount = seg.revenue * (logic.personalDriverShare / 100);
            fuelAllowance = seg.km * logic.fuelAllowanceRate;
            
            // Owner pays fuel (accounted via allowance for profit calc)
            ownerShareAmount = seg.revenue - driverShareAmount - fuelAllowance;

        } else {
            // Other Logic
            driverShareAmount = seg.revenue * (logic.otherDriverShare / 100);
            fuelAllowance = seg.km * logic.fuelAllowanceRate;
            ownerShareAmount = seg.revenue - driverShareAmount - fuelAllowance;
        }

        return {
            ...seg,
            driverShareAmount,
            ownerShareAmount,
            incentive,
            fine,
            fuelAllowance
        };
    });

    totalDriverPayout = breakdown.reduce((acc, b) => acc + b.driverShareAmount, 0);
    totalOwnerShare = breakdown.reduce((acc, b) => acc + b.ownerShareAmount, 0) - tollOther;

    return {
        breakdown,
        totalRevenue,
        totalFuelBill,
        totalDriverPayout,
        totalOwnerShare
    };
  }, [segments, totalKm, fuelEntries, tollOther, logic]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (endKm <= startKm) {
        alert("End KM must be greater than Start KM");
        return;
    }
    if (!dutyStart || !dutyEnd) {
        alert("Please set Duty Start and End times.");
        return;
    }
    
    // Date from dutyStart
    const dateStr = dutyStart.split('T')[0];

    // Ensure segments are saved correctly (handle the single row override)
    const segmentsToSave = segments.length === 1 
        ? [{ ...segments[0], km: totalKm }] 
        : segments;

    const tripData: Trip = {
      id: editingTripId || Date.now().toString(),
      vehicleId,
      driverId,
      dutyStart,
      dutyEnd,
      date: dateStr,
      startKm,
      endKm,
      totalKm,
      segments: segmentsToSave,
      fuelEntries,
      revenue: calculatedResults.totalRevenue,
      fuelCost: calculatedResults.totalFuelBill,
      tollOther,
      driverPayout: calculatedResults.totalDriverPayout,
      profit: calculatedResults.totalOwnerShare,
      tripType: segments[0]?.category || 'other' // Legacy compat
    };

    if (editingTripId) {
        if (window.confirm("Are you sure you want to save changes to this trip?")) {
            onUpdateTrip(tripData);
            resetForm();
            setActiveTab('list');
        }
    } else {
        onAddTrip(tripData);
        alert("Trip logged successfully!");
        resetForm();
        setActiveTab('list');
    }
  };

  // --- Filtering & Sorting (Same as before but updated fields) ---
  const processedTrips = useMemo(() => {
    let result = [...trips];
    if (filterVehicle !== 'all') result = result.filter(t => t.vehicleId === filterVehicle);
    if (filterDriver !== 'all') result = result.filter(t => t.driverId === filterDriver);
    if (filterStartDate) result = result.filter(t => t.date >= filterStartDate);
    if (filterEndDate) result = result.filter(t => t.date <= filterEndDate);

    result.sort((a, b) => {
        let valA, valB;
        switch (sortBy) {
            case 'revenue': valA = a.revenue; valB = b.revenue; break;
            case 'profit': valA = a.profit; valB = b.profit; break;
            case 'date': 
            default:
                valA = new Date(a.dutyStart || a.date).getTime();
                valB = new Date(b.dutyStart || b.date).getTime();
                break;
        }
        return sortOrder === 'asc' ? valA - valB : valB - valA;
    });
    return result;
  }, [trips, filterVehicle, filterDriver, filterStartDate, filterEndDate, sortBy, sortOrder]);

  return (
    <div className="p-4 space-y-6 pb-20">
      <header className="flex justify-between items-center relative">
        <div>
          <h1 className="text-2xl font-bold">Trip Manager</h1>
          <p className="text-slate-400 text-sm">Duty Entry & Payouts</p>
        </div>
      </header>
      
      {/* Floating Action Button for New Trip (Only visible in list view) */}
      {activeTab === 'list' && (
        <button
            onClick={() => { setActiveTab('new'); resetForm(); }}
            className="fixed bottom-20 right-4 w-14 h-14 bg-brand-500 rounded-full shadow-2xl shadow-brand-500/40 flex items-center justify-center z-40 active:scale-95 transition-transform"
        >
            <i className="fas fa-plus text-2xl text-slate-900"></i>
        </button>
      )}

      {activeTab === 'new' ? (
        <form onSubmit={handleSubmit} className="space-y-5 animate-fade-in">
            <div className="flex justify-between items-center bg-slate-800 p-4 rounded-xl border border-slate-700">
                 <h3 className="font-bold text-lg">{editingTripId ? 'Edit Trip' : 'New Trip Entry'}</h3>
                 <button type="button" onClick={() => { resetForm(); setActiveTab('list'); }} className="text-xs text-red-400 font-bold px-3 py-1 bg-red-400/10 rounded-lg">CANCEL</button>
            </div>
            
            {/* 1. Duty Details */}
            <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 space-y-4">
                <h4 className="text-xs font-bold text-brand-500 uppercase">Duty Info</h4>
                <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                         <label className="block text-xs font-semibold text-slate-400 mb-1">Vehicle</label>
                         <select
                            value={vehicleId}
                            onChange={(e) => setVehicleId(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 outline-none"
                         >
                            {vehicles.map(v => <option key={v.id} value={v.id}>{v.name} ({v.plateNumber})</option>)}
                         </select>
                    </div>
                    <div className="col-span-2">
                        <label className="block text-xs font-semibold text-slate-400 mb-1">Driver</label>
                        <select
                            value={driverId}
                            onChange={(e) => setDriverId(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 outline-none"
                        >
                            {drivers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-400 mb-1">Duty Start</label>
                        <input
                            type="datetime-local"
                            value={dutyStart}
                            onChange={(e) => setDutyStart(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2 py-3 text-xs outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-400 mb-1">Duty End</label>
                        <input
                            type="datetime-local"
                            value={dutyEnd}
                            onChange={(e) => setDutyEnd(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2 py-3 text-xs outline-none"
                        />
                    </div>
                </div>
            </div>

            {/* 2. Odometer */}
            <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 space-y-4">
                <div className="flex justify-between items-center">
                    <h4 className="text-xs font-bold text-brand-500 uppercase">Odometer</h4>
                    <span className="text-xs font-mono bg-black/30 px-2 py-1 rounded text-white">Total: {totalKm} KM</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                     <div>
                        <label className="block text-xs font-semibold text-slate-400 mb-1">Start KM</label>
                        <input
                            type="number"
                            value={startKm}
                            onChange={(e) => setStartKm(Number(e.target.value))}
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 outline-none text-slate-500"
                        />
                     </div>
                     <div>
                        <label className="block text-xs font-semibold text-slate-400 mb-1">End KM</label>
                        <input
                            type="number"
                            value={endKm}
                            onChange={(e) => setEndKm(Number(e.target.value))}
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 outline-none font-bold"
                        />
                     </div>
                </div>
            </div>

            {/* 3. Trip Breakdown */}
            <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 space-y-4">
                <div className="flex justify-between items-center">
                    <h4 className="text-xs font-bold text-brand-500 uppercase">Trip Breakdown</h4>
                    <button type="button" onClick={addSegment} className="text-xs bg-slate-700 hover:bg-slate-600 px-2 py-1 rounded transition-colors"><i className="fas fa-plus mr-1"></i> Add Row</button>
                </div>
                
                {segments.map((seg, idx) => (
                    <div key={seg.id} className="flex gap-2 items-start relative bg-slate-900/50 p-2 rounded-lg">
                        <div className="flex-1">
                            <label className="text-[10px] text-slate-500 block mb-1">Category</label>
                            <select
                                value={seg.category}
                                onChange={(e) => {
                                    const newSegs = [...segments];
                                    newSegs[idx].category = e.target.value as any;
                                    setSegments(newSegs);
                                }}
                                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-2 py-2 text-xs outline-none"
                            >
                                <option value="uber">Uber/App</option>
                                <option value="personal">Personal</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                        {segments.length > 1 && (
                            <div className="w-20">
                                <label className="text-[10px] text-slate-500 block mb-1">KM</label>
                                <input
                                    type="number"
                                    value={seg.km}
                                    onChange={(e) => {
                                        const newSegs = [...segments];
                                        newSegs[idx].km = Number(e.target.value);
                                        setSegments(newSegs);
                                    }}
                                    className="w-full bg-slate-800 border border-slate-600 rounded-lg px-2 py-2 text-xs outline-none"
                                />
                            </div>
                        )}
                         <div className="flex-1">
                            <label className="text-[10px] text-slate-500 block mb-1">Revenue ({settings.currencySymbol})</label>
                            <input
                                type="number"
                                value={seg.revenue}
                                onChange={(e) => {
                                    const newSegs = [...segments];
                                    newSegs[idx].revenue = Number(e.target.value);
                                    setSegments(newSegs);
                                }}
                                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-2 py-2 text-xs outline-none"
                            />
                        </div>
                        <button 
                            type="button" 
                            onClick={() => removeSegment(seg.id)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white w-5 h-5 rounded-full flex items-center justify-center shadow-md"
                        >
                            <i className="fas fa-times text-[10px]"></i>
                        </button>
                    </div>
                ))}
                {segments.length === 1 && (
                    <p className="text-[10px] text-slate-500 italic text-center">KM defaults to Total Distance ({totalKm}) for single row.</p>
                )}
            </div>

            {/* 4. Fuel & Expenses */}
            <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 space-y-4">
                <div className="flex justify-between items-center">
                    <h4 className="text-xs font-bold text-brand-500 uppercase">Fuel & Expenses</h4>
                    <button type="button" onClick={addFuel} className="text-xs bg-slate-700 hover:bg-slate-600 px-2 py-1 rounded transition-colors"><i className="fas fa-plus mr-1"></i> Add Fuel</button>
                </div>

                {fuelEntries.map((fuel, idx) => (
                    <div key={fuel.id} className="flex gap-2 items-start relative bg-slate-900/50 p-2 rounded-lg">
                        <div className="w-20">
                            <label className="text-[10px] text-slate-500 block mb-1">Type</label>
                            <select
                                value={fuel.type}
                                onChange={(e) => {
                                    const newF = [...fuelEntries];
                                    newF[idx].type = e.target.value as any;
                                    setFuelEntries(newF);
                                }}
                                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-2 py-2 text-xs outline-none"
                            >
                                <option value="cng">CNG</option>
                                <option value="petrol">Petrol</option>
                            </select>
                        </div>
                        <div className="flex-1">
                            <label className="text-[10px] text-slate-500 block mb-1">Qty</label>
                            <input
                                type="number"
                                value={fuel.quantity}
                                onChange={(e) => {
                                    const newF = [...fuelEntries];
                                    newF[idx].quantity = Number(e.target.value);
                                    setFuelEntries(newF);
                                }}
                                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-2 py-2 text-xs outline-none"
                            />
                        </div>
                         <div className="flex-1">
                            <label className="text-[10px] text-slate-500 block mb-1">Cost ({settings.currencySymbol})</label>
                            <input
                                type="number"
                                value={fuel.amount}
                                onChange={(e) => {
                                    const newF = [...fuelEntries];
                                    newF[idx].amount = Number(e.target.value);
                                    setFuelEntries(newF);
                                }}
                                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-2 py-2 text-xs outline-none"
                            />
                        </div>
                        <button 
                            type="button" 
                            onClick={() => removeFuel(fuel.id)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white w-5 h-5 rounded-full flex items-center justify-center shadow-md"
                        >
                            <i className="fas fa-times text-[10px]"></i>
                        </button>
                    </div>
                ))}
                
                <div>
                     <label className="block text-xs font-semibold text-slate-400 mb-1">Other Expenses (Toll/Parking)</label>
                     <input
                        type="number"
                        value={tollOther}
                        onChange={(e) => setTollOther(Number(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 outline-none"
                    />
                </div>
            </div>

            {/* 5. Result Card */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-5 rounded-xl border border-slate-700 shadow-lg">
                <h4 className="text-xs font-bold text-slate-400 uppercase mb-4 tracking-widest border-b border-slate-700 pb-2">Final Payout Calculation</h4>
                
                <div className="space-y-3">
                    <div className="flex justify-between items-center">
                        <span className="text-slate-300 font-medium">Total Revenue</span>
                        <span className="text-white font-bold">{settings.currencySymbol}{calculatedResults.totalRevenue.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-400">Driver Payout</span>
                        <span className="text-brand-500 font-bold font-mono text-lg">{settings.currencySymbol}{Math.round(calculatedResults.totalDriverPayout).toLocaleString()}</span>
                    </div>
                     <div className="flex justify-between items-center text-xs text-slate-500 border-t border-slate-700 pt-2 mt-2">
                        <span>Owner Share (Net Profit)</span>
                        <span className={calculatedResults.totalOwnerShare >= 0 ? 'text-green-400 font-bold' : 'text-red-400 font-bold'}>
                            {settings.currencySymbol}{Math.round(calculatedResults.totalOwnerShare).toLocaleString()}
                        </span>
                    </div>
                </div>
                
                {/* Debug Breakdown (Optional, hidden usually but good for confidence) */}
                <div className="mt-4 pt-4 border-t border-dashed border-slate-700">
                    <p className="text-[10px] text-slate-500 uppercase mb-2">Details:</p>
                    {calculatedResults.breakdown.map((b, i) => (
                        <div key={b.id} className="text-[10px] text-slate-400 flex justify-between mb-1">
                            <span>{b.category.toUpperCase()} ({Math.round(b.km)}km)</span>
                            <span>
                                {b.incentive > 0 ? `+Inc ${Math.round(b.incentive)} ` : ''}
                                {b.fine > 0 ? `-Fine ${Math.round(b.fine)} ` : ''}
                                = {settings.currencySymbol}{Math.round(b.driverShareAmount)}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            <button
            type="submit"
            className="w-full bg-brand-500 hover:bg-brand-600 text-slate-900 font-bold py-4 rounded-xl transition-colors shadow-lg shadow-brand-500/20"
            >
            {editingTripId ? 'Update Trip Log' : 'Save Duty Record'}
            </button>
        </form>
      ) : (
        <div className="space-y-4">
            {/* Filter & Sort Controls */}
            <div className="bg-slate-800 p-3 rounded-xl border border-slate-700 space-y-3 shadow-lg">
                <div className="grid grid-cols-2 gap-3">
                    <div className="relative">
                        <select
                            value={filterVehicle}
                            onChange={(e) => setFilterVehicle(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 text-xs rounded-lg px-2 py-2.5 outline-none appearance-none"
                        >
                            <option value="all">All Vehicles</option>
                            {vehicles.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                        </select>
                        <i className="fas fa-chevron-down absolute right-3 top-3 text-xs text-slate-500 pointer-events-none"></i>
                    </div>
                    <div className="relative">
                        <select
                            value={filterDriver}
                            onChange={(e) => setFilterDriver(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 text-xs rounded-lg px-2 py-2.5 outline-none appearance-none"
                        >
                            <option value="all">All Drivers</option>
                            {drivers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                        </select>
                        <i className="fas fa-chevron-down absolute right-3 top-3 text-xs text-slate-500 pointer-events-none"></i>
                    </div>
                </div>

                {/* Date Range Filters */}
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="text-[10px] text-slate-400 font-bold uppercase ml-1 mb-1 block">From Date</label>
                        <input
                            type="date"
                            value={filterStartDate}
                            onChange={(e) => setFilterStartDate(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 text-xs rounded-lg px-2 py-2 outline-none text-slate-300"
                        />
                    </div>
                    <div>
                        <label className="text-[10px] text-slate-400 font-bold uppercase ml-1 mb-1 block">To Date</label>
                        <input
                            type="date"
                            value={filterEndDate}
                            onChange={(e) => setFilterEndDate(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 text-xs rounded-lg px-2 py-2 outline-none text-slate-300"
                        />
                    </div>
                </div>

                <div className="flex justify-between items-center gap-3 pt-1 border-t border-slate-700/50 mt-1">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Sort</span>
                    <div className="flex gap-2 flex-1">
                        {(['date', 'revenue', 'profit'] as const).map(key => (
                            <button
                                key={key}
                                onClick={() => {
                                    if (sortBy === key) {
                                        setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                                    } else {
                                        setSortBy(key);
                                        setSortOrder('desc');
                                    }
                                }}
                                className={`flex-1 py-1.5 text-[10px] font-bold uppercase rounded-lg border transition-all ${
                                    sortBy === key
                                        ? 'bg-brand-500/20 border-brand-500 text-brand-500'
                                        : 'bg-slate-900 border-slate-700 text-slate-400 hover:bg-slate-700'
                                }`}
                            >
                                {key} {sortBy === key && (sortOrder === 'asc' ? '↑' : '↓')}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Trips List */}
            <div className="space-y-3">
                {processedTrips.map(trip => {
                    const vehicle = vehicles.find(v => v.id === trip.vehicleId);
                    const driver = drivers.find(d => d.id === trip.driverId);
                    // Legacy compat for display date
                    const displayDate = trip.dutyStart ? trip.dutyStart.replace('T', ' ').slice(0, 16) : trip.date;

                    return (
                        <div key={trip.id} className="bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-sm relative overflow-hidden group">
                             <div className="flex justify-between items-start mb-2 relative z-10">
                                <div>
                                    <h4 className="font-bold text-sm text-slate-200">{vehicle?.name || 'Unknown Vehicle'}</h4>
                                    <p className="text-[10px] text-slate-400 mt-0.5">
                                        <i className="fas fa-clock mr-1"></i> {displayDate}
                                    </p>
                                    <p className="text-[10px] text-slate-500 mt-0.5">
                                        <i className="fas fa-user mr-1"></i> {driver?.name || 'Unknown'}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-brand-500 text-base">{settings.currencySymbol}{trip.revenue.toLocaleString()}</p>
                                    <button 
                                        onClick={() => handleEditTrip(trip)}
                                        className="text-[10px] text-slate-400 hover:text-white underline mt-1"
                                    >
                                        Edit Details
                                    </button>
                                </div>
                             </div>
                             <div className="bg-slate-900/50 rounded-lg p-2.5 flex justify-between items-center text-xs relative z-10">
                                <div>
                                    <span className="text-slate-500">Dist: </span>
                                    <span className="font-mono text-slate-300 font-bold ml-1">{trip.totalKm || (trip.endKm - trip.startKm)} km</span>
                                </div>
                                <div>
                                    <span className="text-slate-500">Owner Net: </span>
                                    <span className={`font-mono font-bold ml-1 ${trip.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                        {settings.currencySymbol}{Math.round(trip.profit).toLocaleString()}
                                    </span>
                                </div>
                             </div>
                        </div>
                    );
                })}
                {processedTrips.length === 0 && (
                    <div className="text-center py-12 bg-slate-800/30 rounded-2xl border-2 border-dashed border-slate-700">
                        <i className="fas fa-route text-4xl text-slate-700 mb-4"></i>
                        <p className="text-slate-500 font-medium">No trips match your filters.</p>
                    </div>
                )}
            </div>
        </div>
      )}
    </div>
  );
};

export default TripEntry;
