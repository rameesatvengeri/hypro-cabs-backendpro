
import React, { useState, useMemo } from 'react';
import { AppSettings } from '../types';

interface EstimatorProps {
  settings: AppSettings;
}

type TripType = 'one-way' | 'round-trip' | 'city' | 'multi-day';

const Estimator: React.FC<EstimatorProps> = ({ settings }) => {
  const [tripType, setTripType] = useState<TripType>('one-way');
  
  // Inputs
  const [routeNote, setRouteNote] = useState('');
  const [kms, setKms] = useState<number>(0);
  const [days, setDays] = useState<number>(1);
  const [extraCharges, setExtraCharges] = useState<number>(0);
  
  // City Trip Specifics
  const [fromTime, setFromTime] = useState('10:00');
  const [toTime, setToTime] = useState('11:00');

  const estimate = useMemo(() => {
    let total = 0;
    let details: { label: string; amount: string }[] = [];
    const sym = settings.currencySymbol;

    switch (tripType) {
      case 'one-way': {
        const rate = settings.tariffs.oneWay.ratePerKm;
        const base = kms * rate;
        total = base + extraCharges;
        details = [
          { label: `Base Fare (${kms} km × ${sym}${rate})`, amount: `${sym}${base}` },
        ];
        break;
      }
      case 'round-trip': {
        const rate = settings.tariffs.roundTrip.ratePerKm;
        const base = kms * rate;
        total = base + extraCharges;
        details = [
          { label: `Fare (${kms} km × ${sym}${rate})`, amount: `${sym}${base}` },
        ];
        break;
      }
      case 'city': {
        const conf = settings.tariffs.city;
        
        // Time Calculation
        const [h1, m1] = fromTime.split(':').map(Number);
        const [h2, m2] = toTime.split(':').map(Number);
        const startMin = h1 * 60 + m1;
        const endMin = h2 * 60 + m2;
        let timeMinutes = endMin - startMin;
        if (timeMinutes < 0) timeMinutes += 24 * 60; // Handle midnight crossover simply

        // Allowed Distance
        const additionalAllowedKm = timeMinutes * conf.freeDistancePerMinuteFactor;
        const totalAllowedKm = conf.includedBaseDistanceKM + additionalAllowedKm;
        
        // Extra Distance Charge
        const extraDist = Math.max(0, kms - totalAllowedKm);
        const extraDistCharge = extraDist * conf.extraKMRate;

        // Time Charge
        const extraTime = Math.max(0, timeMinutes - conf.includedBaseTimeMinutes);
        const timeCharge = extraTime * conf.ratePerExtraMinute;

        // Total
        const computedExtras = extraDistCharge + timeCharge;
        total = conf.minimumBaseCharge + computedExtras + extraCharges;

        // Formatting details
        details = [
          { label: `Base Charge (${conf.includedBaseTimeMinutes}m / ${conf.includedBaseDistanceKM}km)`, amount: `${sym}${conf.minimumBaseCharge}` },
          { label: `Duration`, amount: `${timeMinutes} mins` },
          { label: `Allowed Dist (Base + Time)`, amount: `${totalAllowedKm.toFixed(1)} km` },
        ];

        if (extraTime > 0) {
            details.push({ label: `Extra Time (${extraTime}m × ${sym}${conf.ratePerExtraMinute})`, amount: `${sym}${timeCharge}` });
        }
        if (extraDist > 0) {
            details.push({ label: `Extra Dist (${extraDist.toFixed(1)}km × ${sym}${conf.extraKMRate})`, amount: `${sym}${extraDistCharge.toFixed(0)}` });
        }
        break;
      }
      case 'multi-day': {
        const conf = settings.tariffs.multiDay;
        const rent = days * conf.dailyRentAmount;
        const includedKm = days * conf.includedDistancePerDay;
        
        const extraDist = Math.max(0, kms - includedKm);
        const extraDistCharge = extraDist * conf.extraKMRate;
        
        const nights = Math.max(0, days - 1);
        const bata = nights * conf.nightBataAmount;
        
        total = rent + extraDistCharge + bata + extraCharges;
        
        details = [
          { label: `Rent (${days} days × ${sym}${conf.dailyRentAmount})`, amount: `${sym}${rent}` },
          { label: `Included Dist`, amount: `${includedKm} km` },
        ];
        
        if (extraDist > 0) {
            details.push({ label: `Extra KM (${extraDist}km × ${sym}${conf.extraKMRate})`, amount: `${sym}${extraDistCharge}` });
        }
        if (nights > 0) {
            details.push({ label: `Night Bata (${nights} × ${sym}${conf.nightBataAmount})`, amount: `${sym}${bata}` });
        }
        break;
      }
    }

    if (extraCharges > 0) {
        details.push({ label: 'Extra Charges (Toll/Park)', amount: `${sym}${extraCharges}` });
    }

    return { total, details, kms };
  }, [tripType, kms, days, fromTime, toTime, extraCharges, settings, routeNote]);

  const generateText = () => {
    const lines = estimate.details.map(d => ` - ${d.label}: ${d.amount}`).join('\n');
    return `*Hypro Cabs — Estimate*
Trip Type: ${tripType.toUpperCase()}
Route: ${routeNote || 'Local'}
Distance: ${kms} km

*Breakdown:*
${lines}

*Total: ${settings.currencySymbol}${estimate.total.toLocaleString()}*`;
  };

  const handleShare = () => {
    const text = generateText();
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handleCopy = () => {
      const text = generateText().replace(/\*/g, ''); // Remove markdown stars for cleaner copy
      navigator.clipboard.writeText(text).then(() => {
          alert("Estimate copied to clipboard!");
      });
  };

  return (
    <div className="p-4 space-y-6 pb-20">
      <header>
        <h1 className="text-2xl font-bold">Fare Estimator</h1>
        <p className="text-slate-400 text-sm">Calculate & Share Quotes</p>
      </header>

      {/* Tabs */}
      <div className="flex bg-slate-800 p-1 rounded-xl overflow-x-auto no-scrollbar">
        {(['one-way', 'round-trip', 'city', 'multi-day'] as TripType[]).map((t) => (
          <button
            key={t}
            onClick={() => setTripType(t)}
            className={`flex-1 min-w-[80px] py-2 text-[10px] font-bold rounded-lg transition-colors whitespace-nowrap ${
              tripType === t ? 'bg-brand-500 text-slate-900' : 'text-slate-400'
            }`}
          >
            {t.replace('-', ' ').toUpperCase()}
          </button>
        ))}
      </div>

      <div className="bg-slate-800 p-5 rounded-2xl border border-slate-700 space-y-5">
        {/* Common Input: Route Note */}
        <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Route / Note</label>
            <input
                placeholder="e.g. Airport to City Center"
                value={routeNote}
                onChange={(e) => setRouteNote(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 outline-none focus:ring-1 focus:ring-brand-500"
            />
        </div>

        {/* Dynamic Inputs */}
        <div className="grid grid-cols-2 gap-4">
            {tripType !== 'city' && (
                 <div className={tripType === 'one-way' || tripType === 'round-trip' ? 'col-span-2' : ''}>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Distance (KM)</label>
                    <input
                        type="number"
                        value={kms}
                        onChange={(e) => setKms(Number(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 outline-none focus:ring-1 focus:ring-brand-500"
                    />
                 </div>
            )}

            {tripType === 'multi-day' && (
                <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Days</label>
                    <input
                        type="number"
                        value={days}
                        onChange={(e) => setDays(Number(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 outline-none focus:ring-1 focus:ring-brand-500"
                    />
                </div>
            )}

            {tripType === 'city' && (
                <>
                    <div>
                        <label className="block text-xs font-semibold text-slate-400 mb-1">Start Time</label>
                        <input
                            type="time"
                            value={fromTime}
                            onChange={(e) => setFromTime(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 outline-none focus:ring-1 focus:ring-brand-500"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-400 mb-1">End Time</label>
                        <input
                            type="time"
                            value={toTime}
                            onChange={(e) => setToTime(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 outline-none focus:ring-1 focus:ring-brand-500"
                        />
                    </div>
                    <div className="col-span-2">
                         <label className="block text-xs font-semibold text-slate-400 mb-1">Total Distance (KM)</label>
                         <input
                            type="number"
                            value={kms}
                            onChange={(e) => setKms(Number(e.target.value))}
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 outline-none focus:ring-1 focus:ring-brand-500"
                        />
                    </div>
                </>
            )}

            <div className="col-span-2">
                <label className="block text-xs font-semibold text-slate-400 mb-1">Extra Charges (Toll, etc)</label>
                <input
                    type="number"
                    value={extraCharges}
                    onChange={(e) => setExtraCharges(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 outline-none focus:ring-1 focus:ring-brand-500"
                />
            </div>
        </div>

        <hr className="border-slate-700" />

        {/* Result Area */}
        <div>
            <div className="flex justify-between items-end mb-4">
                <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">Total Estimate</span>
                <span className="text-4xl font-black text-brand-500">{settings.currencySymbol}{estimate.total.toLocaleString()}</span>
            </div>
            
            <div className="bg-slate-900/50 rounded-xl p-4 space-y-2 mb-4">
                {estimate.details.map((d, i) => (
                    <div key={i} className="flex justify-between text-xs text-slate-300">
                        <span>{d.label}</span>
                        <span className="font-mono font-bold">{d.amount}</span>
                    </div>
                ))}
            </div>

            <div className="flex gap-3">
                <button
                    onClick={handleCopy}
                    className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-lg"
                >
                    <i className="fas fa-copy text-xl"></i>
                    Copy
                </button>
                <button
                    onClick={handleShare}
                    className="flex-[2] bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-lg shadow-green-900/20"
                >
                    <i className="fab fa-whatsapp text-2xl"></i>
                    Share via WhatsApp
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Estimator;
