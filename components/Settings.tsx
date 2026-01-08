
import React, { useState } from 'react';
import { AppSettings, TariffSettings, LogicSettings } from '../types';
import { DEFAULT_SETTINGS } from '../constants';

interface SettingsProps {
  settings: AppSettings;
  onSettingsUpdate: (s: AppSettings) => void;
}

const Settings: React.FC<SettingsProps> = ({ settings, onSettingsUpdate }) => {
  const [activeSection, setActiveSection] = useState<string>('admin');

  // Ensure logic settings exist (migration helper)
  const logic = settings.logic || DEFAULT_SETTINGS.logic;

  const handleTariffChange = (
    category: keyof TariffSettings, 
    field: string, 
    value: number
  ) => {
    onSettingsUpdate({
        ...settings,
        tariffs: {
            ...settings.tariffs,
            [category]: {
                ...settings.tariffs[category],
                [field]: value
            }
        }
    });
  };

  const handleLogicChange = (field: keyof LogicSettings, value: number) => {
      onSettingsUpdate({
          ...settings,
          logic: {
              ...logic,
              [field]: value
          }
      });
  };

  const resetDefaults = () => {
    if (confirm("Reset all settings and tariffs to default?")) {
        onSettingsUpdate(DEFAULT_SETTINGS);
    }
  };

  return (
    <div className="p-4 space-y-6 pb-20">
      <header>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-slate-400 text-sm">App configuration & Tariffs</p>
      </header>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
        <button 
            onClick={() => setActiveSection('admin')} 
            className={`px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap ${activeSection === 'admin' ? 'bg-slate-800 text-brand-500' : 'text-slate-500'}`}
        >
            ADMIN PANEL
        </button>
        <button 
            onClick={() => setActiveSection('tariffs')} 
            className={`px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap ${activeSection === 'tariffs' ? 'bg-slate-800 text-brand-500' : 'text-slate-500'}`}
        >
            TARIFFS
        </button>
      </div>

      {activeSection === 'admin' && (
          <div className="space-y-4">
              <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
                  <h3 className="text-xs font-bold text-brand-500 uppercase mb-3">Driver Revenue Share (%)</h3>
                  <div className="grid grid-cols-1 gap-3">
                      <div>
                          <label className="text-[10px] text-slate-400 uppercase">Uber / App Trips</label>
                          <div className="relative">
                            <input 
                                type="number" 
                                value={logic.uberDriverShare}
                                onChange={(e) => handleLogicChange('uberDriverShare', Number(e.target.value))}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-3 pr-8 py-2 text-sm"
                            />
                            <span className="absolute right-3 top-2 text-slate-500 text-xs">%</span>
                          </div>
                      </div>
                      <div>
                          <label className="text-[10px] text-slate-400 uppercase">Personal Trips</label>
                          <div className="relative">
                            <input 
                                type="number" 
                                value={logic.personalDriverShare}
                                onChange={(e) => handleLogicChange('personalDriverShare', Number(e.target.value))}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-3 pr-8 py-2 text-sm"
                            />
                            <span className="absolute right-3 top-2 text-slate-500 text-xs">%</span>
                          </div>
                      </div>
                      <div>
                          <label className="text-[10px] text-slate-400 uppercase">Other Sources</label>
                          <div className="relative">
                            <input 
                                type="number" 
                                value={logic.otherDriverShare}
                                onChange={(e) => handleLogicChange('otherDriverShare', Number(e.target.value))}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-3 pr-8 py-2 text-sm"
                            />
                            <span className="absolute right-3 top-2 text-slate-500 text-xs">%</span>
                          </div>
                      </div>
                  </div>
              </div>

              <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
                  <h3 className="text-xs font-bold text-brand-500 uppercase mb-3">Performance Metrics (Uber)</h3>
                  <div className="grid grid-cols-1 gap-3">
                      <div>
                          <label className="text-[10px] text-slate-400 uppercase">Target Yield (₹/KM)</label>
                          <input 
                            type="number" 
                            value={logic.targetYield}
                            onChange={(e) => handleLogicChange('targetYield', Number(e.target.value))}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm"
                          />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-[10px] text-slate-400 uppercase">Incentive Rate</label>
                            <input 
                                type="number" 
                                value={logic.incentiveRate}
                                onChange={(e) => handleLogicChange('incentiveRate', Number(e.target.value))}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] text-slate-400 uppercase">Fine Rate</label>
                            <input 
                                type="number" 
                                value={logic.fineRate}
                                onChange={(e) => handleLogicChange('fineRate', Number(e.target.value))}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm"
                            />
                        </div>
                      </div>
                  </div>
              </div>

              <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
                  <h3 className="text-xs font-bold text-brand-500 uppercase mb-3">Accounting Allowances</h3>
                  <div>
                      <label className="text-[10px] text-slate-400 uppercase">Fuel Allowance Rate (₹/KM)</label>
                      <input 
                        type="number" 
                        value={logic.fuelAllowanceRate}
                        onChange={(e) => handleLogicChange('fuelAllowanceRate', Number(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm"
                      />
                      <p className="text-[10px] text-slate-500 mt-1">Used to calculate expenses for Personal/Other trips.</p>
                  </div>
              </div>
          </div>
      )}

      {activeSection === 'tariffs' && (
          <div className="space-y-4">
              {/* One Way */}
              <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
                  <h3 className="text-xs font-bold text-brand-500 uppercase mb-3">One-Way Drop</h3>
                  <div className="grid grid-cols-1 gap-3">
                      <div>
                          <label className="text-[10px] text-slate-400 uppercase">Rate Per KM</label>
                          <input 
                            type="number" 
                            value={settings.tariffs.oneWay.ratePerKm}
                            onChange={(e) => handleTariffChange('oneWay', 'ratePerKm', Number(e.target.value))}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm"
                          />
                      </div>
                  </div>
              </div>

              {/* Round Trip */}
              <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
                  <h3 className="text-xs font-bold text-brand-500 uppercase mb-3">Round Trip</h3>
                  <div className="grid grid-cols-1 gap-3">
                      <div>
                          <label className="text-[10px] text-slate-400 uppercase">Rate Per KM</label>
                          <input 
                            type="number" 
                            value={settings.tariffs.roundTrip.ratePerKm}
                            onChange={(e) => handleTariffChange('roundTrip', 'ratePerKm', Number(e.target.value))}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm"
                          />
                      </div>
                  </div>
              </div>

              {/* City */}
              <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
                  <h3 className="text-xs font-bold text-brand-500 uppercase mb-3">City / Local</h3>
                  <div className="grid grid-cols-2 gap-3">
                      <div>
                          <label className="text-[10px] text-slate-400 uppercase">Min Base Charge</label>
                          <input type="number" value={settings.tariffs.city.minimumBaseCharge} onChange={(e) => handleTariffChange('city', 'minimumBaseCharge', Number(e.target.value))} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm" />
                      </div>
                      <div>
                          <label className="text-[10px] text-slate-400 uppercase">Base Time (Min)</label>
                          <input type="number" value={settings.tariffs.city.includedBaseTimeMinutes} onChange={(e) => handleTariffChange('city', 'includedBaseTimeMinutes', Number(e.target.value))} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm" />
                      </div>
                      <div>
                          <label className="text-[10px] text-slate-400 uppercase">Base Dist (KM)</label>
                          <input type="number" value={settings.tariffs.city.includedBaseDistanceKM} onChange={(e) => handleTariffChange('city', 'includedBaseDistanceKM', Number(e.target.value))} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm" />
                      </div>
                      <div>
                          <label className="text-[10px] text-slate-400 uppercase">Extra KM Rate</label>
                          <input type="number" value={settings.tariffs.city.extraKMRate} onChange={(e) => handleTariffChange('city', 'extraKMRate', Number(e.target.value))} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm" />
                      </div>
                      <div>
                          <label className="text-[10px] text-slate-400 uppercase">Extra Min Rate</label>
                          <input type="number" value={settings.tariffs.city.ratePerExtraMinute} onChange={(e) => handleTariffChange('city', 'ratePerExtraMinute', Number(e.target.value))} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm" />
                      </div>
                  </div>
              </div>

               {/* Multi Day */}
               <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
                  <h3 className="text-xs font-bold text-brand-500 uppercase mb-3">Multi-Day Tour</h3>
                  <div className="grid grid-cols-2 gap-3">
                      <div>
                          <label className="text-[10px] text-slate-400 uppercase">Daily Rent</label>
                          <input type="number" value={settings.tariffs.multiDay.dailyRentAmount} onChange={(e) => handleTariffChange('multiDay', 'dailyRentAmount', Number(e.target.value))} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm" />
                      </div>
                      <div>
                          <label className="text-[10px] text-slate-400 uppercase">Daily Incl. KM</label>
                          <input type="number" value={settings.tariffs.multiDay.includedDistancePerDay} onChange={(e) => handleTariffChange('multiDay', 'includedDistancePerDay', Number(e.target.value))} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm" />
                      </div>
                      <div>
                          <label className="text-[10px] text-slate-400 uppercase">Extra KM Rate</label>
                          <input type="number" value={settings.tariffs.multiDay.extraKMRate} onChange={(e) => handleTariffChange('multiDay', 'extraKMRate', Number(e.target.value))} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm" />
                      </div>
                      <div>
                          <label className="text-[10px] text-slate-400 uppercase">Night Bata</label>
                          <input type="number" value={settings.tariffs.multiDay.nightBataAmount} onChange={(e) => handleTariffChange('multiDay', 'nightBataAmount', Number(e.target.value))} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm" />
                      </div>
                  </div>
              </div>

              <button 
                onClick={resetDefaults}
                className="w-full py-3 text-slate-400 text-xs font-bold border border-slate-700 rounded-xl hover:bg-slate-800"
              >
                Reset to System Defaults
              </button>
          </div>
      )}
    </div>
  );
};

export default Settings;
