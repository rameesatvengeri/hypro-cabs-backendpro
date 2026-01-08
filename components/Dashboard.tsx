
import React, { useMemo } from 'react';
import { Vehicle, Driver, Trip, AppSettings } from '../types';
import { EXPIRY_WARNING_DAYS } from '../constants';

interface DashboardProps {
  vehicles: Vehicle[];
  drivers: Driver[];
  trips: Trip[];
  settings: AppSettings;
}

const Dashboard: React.FC<DashboardProps> = ({ vehicles, drivers, trips, settings }) => {
  const stats = useMemo(() => {
    const totalRevenue = trips.reduce((acc, trip) => acc + trip.revenue, 0);
    const totalProfit = trips.reduce((acc, trip) => acc + trip.profit, 0);
    // Include actual fuel cost (cash spent) + tolls in expenses
    const totalExpenses = trips.reduce((acc, trip) => acc + trip.fuelCost + trip.tollOther, 0);

    return {
      revenue: totalRevenue,
      profit: totalProfit,
      expenses: totalExpenses,
    };
  }, [trips]);

  const alerts = useMemo(() => {
    const today = new Date();
    const warnDate = new Date();
    warnDate.setDate(today.getDate() + EXPIRY_WARNING_DAYS);

    const vehicleAlerts: { name: string; type: string; date: string }[] = [];

    vehicles.forEach((v) => {
      const docs = [
        { label: 'Insurance', date: v.insuranceExpiry },
        { label: 'Tax', date: v.taxExpiry },
        { label: 'Permit', date: v.permitExpiry },
        { label: 'Pollution', date: v.pollutionExpiry },
        { label: 'Fitness', date: v.fitnessExpiry },
      ];

      docs.forEach((doc) => {
        if (doc.date && new Date(doc.date) <= warnDate) {
          vehicleAlerts.push({ name: v.name, type: doc.label, date: doc.date });
        }
      });
    });

    return vehicleAlerts;
  }, [vehicles]);

  return (
    <div className="p-4 space-y-6 pb-20">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Hypro Cabs</h1>
          <p className="text-slate-400 text-sm">Business Overview</p>
        </div>
        <div className="bg-brand-500/10 p-2 rounded-lg">
          <i className="fas fa-taxi text-brand-500 text-xl"></i>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
          <p className="text-slate-400 text-xs mb-1 uppercase tracking-wider">Total Revenue</p>
          <h2 className="text-xl font-bold">{settings.currencySymbol}{stats.revenue.toLocaleString()}</h2>
        </div>
        <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
          <p className="text-slate-400 text-xs mb-1 uppercase tracking-wider">Owner Net Profit</p>
          <h2 className="text-xl font-bold text-green-400">{settings.currencySymbol}{Math.round(stats.profit).toLocaleString()}</h2>
        </div>
        <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
          <p className="text-slate-400 text-xs mb-1 uppercase tracking-wider">Vehicles</p>
          <h2 className="text-xl font-bold">{vehicles.length}</h2>
        </div>
        <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
          <p className="text-slate-400 text-xs mb-1 uppercase tracking-wider">Drivers</p>
          <h2 className="text-xl font-bold">{drivers.length}</h2>
        </div>
      </div>

      {/* Expiry Alerts */}
      {alerts.length > 0 && (
        <section className="space-y-3">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <i className="fas fa-exclamation-triangle text-amber-500"></i>
            Expiry Alerts
          </h3>
          <div className="space-y-2">
            {alerts.map((alert, idx) => (
              <div key={idx} className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-lg flex justify-between items-center">
                <div>
                  <p className="font-semibold text-sm">{alert.name}</p>
                  <p className="text-xs text-amber-500">{alert.type} Expiring</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-mono">{alert.date}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Quick Actions */}
      <section className="space-y-3">
        <h3 className="text-lg font-semibold">Quick Actions</h3>
        <div className="grid grid-cols-3 gap-2">
            <div className="bg-slate-800/50 p-4 rounded-xl flex flex-col items-center justify-center border border-slate-700/50 active:scale-95 transition-transform">
                <i className="fas fa-plus-circle text-brand-500 text-xl mb-2"></i>
                <span className="text-[10px] font-medium">New Trip</span>
            </div>
            <div className="bg-slate-800/50 p-4 rounded-xl flex flex-col items-center justify-center border border-slate-700/50 active:scale-95 transition-transform">
                <i className="fas fa-gas-pump text-brand-500 text-xl mb-2"></i>
                <span className="text-[10px] font-medium">Add Fuel</span>
            </div>
            <div className="bg-slate-800/50 p-4 rounded-xl flex flex-col items-center justify-center border border-slate-700/50 active:scale-95 transition-transform">
                <i className="fas fa-tools text-brand-500 text-xl mb-2"></i>
                <span className="text-[10px] font-medium">Service</span>
            </div>
        </div>
      </section>

      {/* Recent Activity Mock */}
      <section className="space-y-3">
        <h3 className="text-lg font-semibold">Recent Trips</h3>
        <div className="space-y-2">
            {trips.slice(-3).reverse().map((trip) => {
                const vehicle = vehicles.find(v => v.id === trip.vehicleId);
                const displayDate = trip.dutyStart ? trip.dutyStart.slice(0, 10) : trip.date;
                return (
                    <div key={trip.id} className="bg-slate-800/30 p-3 rounded-lg border border-slate-700 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center">
                                <i className="fas fa-car-side text-slate-300"></i>
                            </div>
                            <div>
                                <p className="text-sm font-medium">{vehicle?.name || 'Unknown'}</p>
                                <p className="text-xs text-slate-400">{displayDate}</p>
                            </div>
                        </div>
                        <p className="font-bold text-green-400">+{settings.currencySymbol}{trip.revenue}</p>
                    </div>
                );
            })}
            {trips.length === 0 && <p className="text-center text-slate-500 py-8 italic">No trips recorded yet.</p>}
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
