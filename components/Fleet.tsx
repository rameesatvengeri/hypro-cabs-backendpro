
import React, { useState } from 'react';
import { Vehicle, MaintenanceRecord, Trip, AppSettings, MaintenanceType } from '../types';

interface FleetProps {
  vehicles: Vehicle[];
  trips: Trip[];
  maintenance: MaintenanceRecord[];
  onAddVehicle: (v: Vehicle) => void;
  onUpdateVehicle: (v: Vehicle) => void;
  onAddMaintenance: (m: MaintenanceRecord) => void;
  settings: AppSettings;
}

const MAINTENANCE_TYPES: MaintenanceType[] = [
  'Vehicle Service',
  'Water Wash',
  'Wheel Alignment',
  'Additional Vehicle Repair',
  'Others'
];

const Fleet: React.FC<FleetProps> = ({ vehicles, trips, maintenance, onAddVehicle, onUpdateVehicle, onAddMaintenance, settings }) => {
  const [activeTab, setActiveTab] = useState<'manage' | 'analytics' | 'maintenance'>('manage');
  const [showAdd, setShowAdd] = useState(false);
  const [newV, setNewV] = useState<Partial<Vehicle>>({});
  
  // Edit Vehicle State
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  
  // Maintenance Modal State
  const [maintenanceVehicleId, setMaintenanceVehicleId] = useState<string | null>(null);
  const [newMaint, setNewMaint] = useState<Partial<MaintenanceRecord>>({
      type: 'Vehicle Service',
      date: new Date().toISOString().split('T')[0]
  });

  // Maintenance Filters
  const [filterMaintVehicle, setFilterMaintVehicle] = useState('all');
  const [filterMaintType, setFilterMaintType] = useState('all');

  const handleSubmitVehicle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newV.name || !newV.plateNumber) return;
    onAddVehicle({
      id: Date.now().toString(),
      name: newV.name || '',
      model: newV.model || '',
      plateNumber: newV.plateNumber || '',
      currentOdo: newV.currentOdo || 0,
      insuranceExpiry: newV.insuranceExpiry || '',
      pollutionExpiry: newV.pollutionExpiry || '',
      fitnessExpiry: newV.fitnessExpiry || '',
      permitExpiry: newV.permitExpiry || '',
      taxExpiry: newV.taxExpiry || '' // Keeping for legacy/compatibility
    });
    setShowAdd(false);
    setNewV({});
  };

  const handleUpdateVehicleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (editingVehicle) {
          onUpdateVehicle(editingVehicle);
          setEditingVehicle(null);
      }
  };

  const handleSubmitMaintenance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!maintenanceVehicleId || !newMaint.cost) return;

    onAddMaintenance({
        id: Date.now().toString(),
        vehicleId: maintenanceVehicleId,
        date: newMaint.date || new Date().toISOString().split('T')[0],
        type: newMaint.type || 'Others',
        description: newMaint.description || '',
        cost: Number(newMaint.cost)
    });

    setMaintenanceVehicleId(null);
    setNewMaint({ type: 'Vehicle Service', date: new Date().toISOString().split('T')[0] });
    alert("Maintenance record added!");
  };

  const filteredMaintenance = maintenance.filter(record => {
      const matchVehicle = filterMaintVehicle === 'all' || record.vehicleId === filterMaintVehicle;
      const matchType = filterMaintType === 'all' || record.type === filterMaintType;
      return matchVehicle && matchType;
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="p-4 space-y-6 pb-20">
      <header>
        <div className="flex justify-between items-center mb-4">
            <div>
            <h1 className="text-2xl font-bold">Fleet Manager</h1>
            <p className="text-slate-400 text-sm">Manage vehicles & analytics</p>
            </div>
        </div>
        
        {/* Tabs */}
        <div className="flex bg-slate-800 p-1 rounded-xl">
            <button
                onClick={() => setActiveTab('manage')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors ${
                    activeTab === 'manage' ? 'bg-brand-500 text-slate-900' : 'text-slate-400'
                }`}
            >
                MANAGE FLEET
            </button>
            <button
                onClick={() => setActiveTab('analytics')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors ${
                    activeTab === 'analytics' ? 'bg-brand-500 text-slate-900' : 'text-slate-400'
                }`}
            >
                ANALYTICS
            </button>
            <button
                onClick={() => setActiveTab('maintenance')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors ${
                    activeTab === 'maintenance' ? 'bg-brand-500 text-slate-900' : 'text-slate-400'
                }`}
            >
                SERVICE LOG
            </button>
        </div>
      </header>

      {/* Edit Vehicle Modal */}
      {editingVehicle && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-900 w-full max-w-sm rounded-2xl border border-slate-700 p-6 space-y-4 max-h-[90vh] overflow-y-auto">
                <h3 className="font-bold text-lg text-white">Edit Vehicle Details</h3>
                <form onSubmit={handleUpdateVehicleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                         <div className="col-span-2">
                            <label className="text-xs text-slate-400 block mb-1">Vehicle Name</label>
                            <input
                                value={editingVehicle.name}
                                onChange={e => setEditingVehicle({...editingVehicle, name: e.target.value})}
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 outline-none"
                            />
                         </div>
                         <div>
                            <label className="text-xs text-slate-400 block mb-1">Reg Number</label>
                            <input
                                value={editingVehicle.plateNumber}
                                onChange={e => setEditingVehicle({...editingVehicle, plateNumber: e.target.value})}
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 outline-none"
                            />
                         </div>
                         <div>
                            <label className="text-xs text-slate-400 block mb-1">Model</label>
                            <input
                                value={editingVehicle.model}
                                onChange={e => setEditingVehicle({...editingVehicle, model: e.target.value})}
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 outline-none"
                            />
                         </div>
                    </div>
                    
                    <div className="space-y-3 pt-2 border-t border-slate-800">
                        <p className="text-xs font-bold text-brand-500 uppercase">Update Expiry Dates</p>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-[10px] text-slate-400 block mb-1">Insurance</label>
                                <input 
                                    type="date" 
                                    value={editingVehicle.insuranceExpiry}
                                    onChange={e => setEditingVehicle({...editingVehicle, insuranceExpiry: e.target.value})}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs" 
                                />
                            </div>
                            <div>
                                <label className="text-[10px] text-slate-400 block mb-1">Pollution</label>
                                <input 
                                    type="date" 
                                    value={editingVehicle.pollutionExpiry}
                                    onChange={e => setEditingVehicle({...editingVehicle, pollutionExpiry: e.target.value})}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs" 
                                />
                            </div>
                            <div>
                                <label className="text-[10px] text-slate-400 block mb-1">Fitness</label>
                                <input 
                                    type="date" 
                                    value={editingVehicle.fitnessExpiry}
                                    onChange={e => setEditingVehicle({...editingVehicle, fitnessExpiry: e.target.value})}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs" 
                                />
                            </div>
                            <div>
                                <label className="text-[10px] text-slate-400 block mb-1">Permit</label>
                                <input 
                                    type="date" 
                                    value={editingVehicle.permitExpiry}
                                    onChange={e => setEditingVehicle({...editingVehicle, permitExpiry: e.target.value})}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs" 
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={() => setEditingVehicle(null)} className="flex-1 bg-slate-800 text-slate-300 font-bold py-3 rounded-xl border border-slate-700">Cancel</button>
                        <button type="submit" className="flex-1 bg-brand-500 text-slate-900 font-bold py-3 rounded-xl">Update</button>
                    </div>
                </form>
            </div>
        </div>
      )}

      {/* Maintenance Modal */}
      {maintenanceVehicleId && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-900 w-full max-w-sm rounded-2xl border border-slate-700 p-6 space-y-4">
                <h3 className="font-bold text-lg text-white">Add Maintenance</h3>
                <form onSubmit={handleSubmitMaintenance} className="space-y-4">
                    <div>
                        <label className="text-xs text-slate-400 block mb-1">Date</label>
                        <input
                            type="date"
                            value={newMaint.date}
                            onChange={e => setNewMaint({...newMaint, date: e.target.value})}
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 outline-none"
                        />
                    </div>
                    <div>
                        <label className="text-xs text-slate-400 block mb-1">Type</label>
                        <select
                            value={newMaint.type}
                            onChange={e => setNewMaint({...newMaint, type: e.target.value as MaintenanceType})}
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 outline-none"
                        >
                            {MAINTENANCE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="text-xs text-slate-400 block mb-1">Cost ({settings.currencySymbol})</label>
                        <input
                            type="number"
                            value={newMaint.cost || ''}
                            onChange={e => setNewMaint({...newMaint, cost: Number(e.target.value)})}
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 outline-none"
                            placeholder="0.00"
                            required
                        />
                    </div>
                    <div>
                        <label className="text-xs text-slate-400 block mb-1">Notes</label>
                        <textarea
                            value={newMaint.description || ''}
                            onChange={e => setNewMaint({...newMaint, description: e.target.value})}
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 outline-none h-20"
                            placeholder="Details about the service..."
                        />
                    </div>
                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={() => setMaintenanceVehicleId(null)} className="flex-1 bg-slate-800 text-slate-300 font-bold py-3 rounded-xl border border-slate-700">Cancel</button>
                        <button type="submit" className="flex-1 bg-brand-500 text-slate-900 font-bold py-3 rounded-xl">Save</button>
                    </div>
                </form>
            </div>
        </div>
      )}

      {/* MANAGE FLEET TAB */}
      {activeTab === 'manage' && (
        <div className="space-y-6">
            <button
                onClick={() => setShowAdd(!showAdd)}
                className="w-full bg-slate-800 border border-dashed border-slate-600 text-slate-400 py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-700/50 hover:text-brand-500 transition-colors"
            >
                <i className={`fas ${showAdd ? 'fa-times' : 'fa-plus'}`}></i>
                {showAdd ? 'Cancel Adding' : 'Add New Vehicle'}
            </button>

            {showAdd && (
                <form onSubmit={handleSubmitVehicle} className="bg-slate-800 p-6 rounded-2xl border border-brand-500/30 space-y-4">
                <h3 className="font-bold text-lg">New Vehicle Details</h3>
                <div className="grid grid-cols-2 gap-4">
                    <input
                        placeholder="Vehicle Name"
                        required
                        className="col-span-2 bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 outline-none"
                        onChange={e => setNewV({...newV, name: e.target.value})}
                    />
                    <input
                        placeholder="Reg Number"
                        required
                        className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 outline-none"
                        onChange={e => setNewV({...newV, plateNumber: e.target.value})}
                    />
                    <input
                        placeholder="Model"
                        className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 outline-none"
                        onChange={e => setNewV({...newV, model: e.target.value})}
                    />
                    <div className="col-span-2">
                        <label className="text-xs text-slate-400 mb-1 block">Initial Odometer Reading</label>
                        <input
                            type="number"
                            placeholder="0"
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 outline-none"
                            onChange={e => setNewV({...newV, currentOdo: Number(e.target.value)})}
                        />
                    </div>
                    
                    <div className="col-span-2 space-y-3 pt-2">
                        <p className="text-xs font-bold text-brand-500 uppercase">Expiry Dates</p>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-[10px] text-slate-400 block mb-1">Insurance</label>
                                <input type="date" className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs" onChange={e => setNewV({...newV, insuranceExpiry: e.target.value})} />
                            </div>
                            <div>
                                <label className="text-[10px] text-slate-400 block mb-1">Pollution</label>
                                <input type="date" className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs" onChange={e => setNewV({...newV, pollutionExpiry: e.target.value})} />
                            </div>
                            <div>
                                <label className="text-[10px] text-slate-400 block mb-1">Fitness</label>
                                <input type="date" className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs" onChange={e => setNewV({...newV, fitnessExpiry: e.target.value})} />
                            </div>
                            <div>
                                <label className="text-[10px] text-slate-400 block mb-1">Permit</label>
                                <input type="date" className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs" onChange={e => setNewV({...newV, permitExpiry: e.target.value})} />
                            </div>
                        </div>
                    </div>
                </div>
                <button type="submit" className="w-full bg-brand-500 text-slate-900 font-bold py-3 rounded-xl mt-2">
                    Save Vehicle
                </button>
                </form>
            )}

            <div className="space-y-4">
                {vehicles.map((v) => (
                    <div key={v.id} className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden relative">
                    <div className="p-4 border-b border-slate-700 bg-slate-800/50 flex justify-between items-start">
                        <div>
                        <h3 className="font-bold text-lg">{v.name}</h3>
                        <p className="text-xs text-brand-500 font-mono uppercase tracking-tighter">{v.plateNumber}</p>
                        <p className="text-xs text-slate-500 mt-1">{v.model}</p>
                        </div>
                        <div className="text-right">
                            <button 
                                onClick={() => setEditingVehicle(v)}
                                className="text-slate-400 hover:text-white p-2 mb-2"
                            >
                                <i className="fas fa-edit"></i>
                            </button>
                            <div>
                                <p className="text-xs text-slate-400 uppercase tracking-widest">Odometer</p>
                                <p className="font-bold text-sm font-mono bg-black/30 px-2 py-1 rounded text-slate-300 inline-block mt-1">{v.currentOdo.toLocaleString()} KM</p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="p-4 grid grid-cols-2 gap-4 text-xs cursor-pointer hover:bg-slate-700/20 transition-colors" onClick={() => setEditingVehicle(v)}>
                        <div>
                            <span className="text-slate-500 block">Insurance</span>
                            <span className={v.insuranceExpiry ? 'text-slate-300' : 'text-slate-600 italic'}>{v.insuranceExpiry || 'N/A'}</span>
                        </div>
                        <div>
                            <span className="text-slate-500 block">Pollution</span>
                            <span className={v.pollutionExpiry ? 'text-slate-300' : 'text-slate-600 italic'}>{v.pollutionExpiry || 'N/A'}</span>
                        </div>
                         <div>
                            <span className="text-slate-500 block">Fitness</span>
                            <span className={v.fitnessExpiry ? 'text-slate-300' : 'text-slate-600 italic'}>{v.fitnessExpiry || 'N/A'}</span>
                        </div>
                         <div>
                            <span className="text-slate-500 block">Permit</span>
                            <span className={v.permitExpiry ? 'text-slate-300' : 'text-slate-600 italic'}>{v.permitExpiry || 'N/A'}</span>
                        </div>
                    </div>

                    <div className="p-3 bg-slate-900/30 flex justify-between gap-2 border-t border-slate-700">
                        <button 
                            onClick={() => setMaintenanceVehicleId(v.id)}
                            className="w-full text-xs bg-slate-700 py-2.5 rounded-lg font-bold hover:bg-slate-600 transition-colors text-white"
                        >
                            <i className="fas fa-tools mr-2 text-brand-500"></i>
                            ADD SERVICE
                        </button>
                    </div>
                    </div>
                ))}
                 {vehicles.length === 0 && !showAdd && (
                    <div className="text-center py-20 bg-slate-800/30 rounded-2xl border-2 border-dashed border-slate-700">
                        <i className="fas fa-car text-4xl text-slate-700 mb-4"></i>
                        <p className="text-slate-500 font-medium">No vehicles in your fleet.</p>
                    </div>
                )}
            </div>
        </div>
      )}

      {/* ANALYTICS TAB */}
      {activeTab === 'analytics' && (
        <div className="space-y-4">
             {vehicles.map((v) => {
                const vTrips = trips.filter(t => t.vehicleId === v.id);
                const revenue = vTrips.reduce((acc, t) => acc + t.revenue, 0);
                const fuel = vTrips.reduce((acc, t) => acc + t.fuelCost, 0);
                const toll = vTrips.reduce((acc, t) => acc + t.tollOther, 0);
                const maint = maintenance.filter(m => m.vehicleId === v.id).reduce((acc, m) => acc + m.cost, 0);
                
                // For Owner Profit, we use the Trip Profit field (Owner Share) which is calculated in TripEntry
                // However, Fleet was previously calculating profit on the fly.
                // Now that profit logic is complex (Uber vs Personal), we should rely on `t.profit` if it exists (New System)
                // or fallback to `revenue - fuel - toll` (Old System) if `t.profit` is undefined.
                
                let ownerProfit = 0;
                vTrips.forEach(t => {
                    if (typeof t.profit !== 'undefined') {
                        ownerProfit += t.profit;
                    } else {
                        ownerProfit += (t.revenue - t.fuelCost - t.tollOther);
                    }
                });

                // Deduct maintenance from owner profit
                const netOwnerProfit = ownerProfit - maint;

                return (
                    <div key={v.id} className="bg-slate-800 p-4 rounded-xl border border-slate-700">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="font-bold text-white">{v.name}</h3>
                                <span className="text-[10px] text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-700">{v.plateNumber}</span>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] text-slate-400 uppercase">Net Owner Profit</p>
                                <p className={`font-bold text-lg ${netOwnerProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                    {settings.currencySymbol}{Math.round(netOwnerProfit).toLocaleString()}
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-xs bg-slate-900/50 p-3 rounded-lg">
                            <div>
                                <p className="text-slate-500">Revenue</p>
                                <p className="text-white font-mono">{settings.currencySymbol}{revenue.toLocaleString()}</p>
                            </div>
                            <div>
                                <p className="text-slate-500">Expenses (Fuel/Toll)</p>
                                <p className="text-red-300 font-mono">{settings.currencySymbol}{(fuel + toll).toLocaleString()}</p>
                            </div>
                            <div className="col-span-2 border-t border-slate-700 pt-2 mt-1 flex justify-between">
                                <span className="text-slate-500">Maint Cost: {settings.currencySymbol}{maint.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                );
             })}
        </div>
      )}

      {/* MAINTENANCE TAB */}
      {activeTab === 'maintenance' && (
        <div className="space-y-4">
            {/* Filters */}
            <div className="bg-slate-800 p-3 rounded-xl border border-slate-700 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                    <div className="relative">
                        <select
                            value={filterMaintVehicle}
                            onChange={(e) => setFilterMaintVehicle(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 text-xs rounded-lg px-2 py-2.5 outline-none appearance-none"
                        >
                            <option value="all">All Vehicles</option>
                            {vehicles.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                        </select>
                        <i className="fas fa-chevron-down absolute right-3 top-3 text-xs text-slate-500 pointer-events-none"></i>
                    </div>
                    <div className="relative">
                        <select
                            value={filterMaintType}
                            onChange={(e) => setFilterMaintType(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 text-xs rounded-lg px-2 py-2.5 outline-none appearance-none"
                        >
                            <option value="all">All Service Types</option>
                            {MAINTENANCE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                        <i className="fas fa-chevron-down absolute right-3 top-3 text-xs text-slate-500 pointer-events-none"></i>
                    </div>
                </div>
            </div>

            {/* List */}
            <div className="space-y-3">
                {filteredMaintenance.map(record => {
                    const vehicle = vehicles.find(v => v.id === record.vehicleId);
                    return (
                        <div key={record.id} className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex justify-between items-start">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded">{record.date}</span>
                                    <span className="text-xs font-bold text-brand-500 uppercase">{record.type}</span>
                                </div>
                                <h4 className="font-bold text-sm text-white mb-0.5">{vehicle?.name || 'Unknown Vehicle'}</h4>
                                <p className="text-xs text-slate-400">{record.description || 'No notes provided.'}</p>
                            </div>
                            <div className="text-right">
                                <span className="block font-bold text-red-400">{settings.currencySymbol}{record.cost.toLocaleString()}</span>
                            </div>
                        </div>
                    );
                })}
                {filteredMaintenance.length === 0 && (
                    <div className="text-center py-12 bg-slate-800/30 rounded-2xl border-2 border-dashed border-slate-700">
                        <i className="fas fa-tools text-4xl text-slate-700 mb-4"></i>
                        <p className="text-slate-500 font-medium">No maintenance records found.</p>
                    </div>
                )}
            </div>
        </div>
      )}
    </div>
  );
};

export default Fleet;
