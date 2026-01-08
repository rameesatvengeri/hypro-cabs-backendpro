
import React, { useState } from 'react';
import { Driver } from '../types';

interface DriversProps {
  drivers: Driver[];
  onAddDriver: (d: Driver) => void;
  onDeleteDriver: (id: string) => void;
}

const Drivers: React.FC<DriversProps> = ({ drivers, onAddDriver, onDeleteDriver }) => {
  const [showAdd, setShowAdd] = useState(false);
  const [newD, setNewD] = useState<Partial<Driver>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newD.name || !newD.mobile) return;
    onAddDriver({
      id: Date.now().toString(),
      name: newD.name || '',
      mobile: newD.mobile || '',
      licenseNumber: newD.licenseNumber || '',
      licenseExpiry: newD.licenseExpiry || ''
    });
    setShowAdd(false);
    setNewD({});
  };

  return (
    <div className="p-4 space-y-6 pb-20">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Driver Roster</h1>
          <p className="text-slate-400 text-sm">Manage staff details</p>
        </div>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="bg-brand-500 w-10 h-10 rounded-full text-slate-900 flex items-center justify-center shadow-lg active:scale-95 transition-transform"
        >
          <i className={`fas ${showAdd ? 'fa-times' : 'fa-plus'}`}></i>
        </button>
      </header>

      {showAdd && (
        <form onSubmit={handleSubmit} className="bg-slate-800 p-6 rounded-2xl border border-brand-500/30 space-y-4">
          <h3 className="font-bold text-lg">New Driver Info</h3>
          <div className="space-y-3">
            <input
              placeholder="Driver Full Name"
              required
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 outline-none"
              onChange={e => setNewD({...newD, name: e.target.value})}
            />
            <input
              placeholder="Mobile Number"
              required
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 outline-none"
              onChange={e => setNewD({...newD, mobile: e.target.value})}
            />
            <input
              placeholder="License Number"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 outline-none"
              onChange={e => setNewD({...newD, licenseNumber: e.target.value})}
            />
            <div>
                <label className="text-xs text-slate-400 mb-1 block">License Expiry Date</label>
                <input type="date" className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 outline-none" onChange={e => setNewD({...newD, licenseExpiry: e.target.value})} />
            </div>
          </div>
          <button type="submit" className="w-full bg-brand-500 text-slate-900 font-bold py-3 rounded-xl mt-2">
            Register Driver
          </button>
        </form>
      )}

      <div className="grid gap-4">
        {drivers.map((d) => (
          <div key={d.id} className="bg-slate-800 p-4 rounded-2xl border border-slate-700 flex justify-between items-center group">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-slate-700 rounded-full flex items-center justify-center border-2 border-slate-600">
                <i className="fas fa-user-tie text-slate-300"></i>
              </div>
              <div>
                <h3 className="font-bold">{d.name}</h3>
                <p className="text-sm text-slate-400 flex items-center gap-1">
                  <i className="fas fa-phone-alt text-[10px]"></i>
                  {d.mobile}
                </p>
                <p className="text-[10px] text-brand-500 uppercase mt-1">L: {d.licenseNumber || 'N/A'}</p>
              </div>
            </div>
            <button 
              onClick={() => onDeleteDriver(d.id)}
              className="p-3 text-slate-600 hover:text-red-500 transition-colors"
            >
              <i className="fas fa-trash-alt"></i>
            </button>
          </div>
        ))}

        {drivers.length === 0 && (
          <div className="text-center py-20 bg-slate-800/30 rounded-2xl border-2 border-dashed border-slate-700">
             <i className="fas fa-id-badge text-4xl text-slate-700 mb-4"></i>
             <p className="text-slate-500 font-medium">No drivers registered.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Drivers;
