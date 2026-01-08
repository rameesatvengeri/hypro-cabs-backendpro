
import React from 'react';
import { ViewType } from '../types';

interface NavigationProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
}

const Navigation: React.FC<NavigationProps> = ({ currentView, onViewChange }) => {
  const items = [
    { id: 'dashboard', icon: 'fa-chart-pie', label: 'Home' },
    { id: 'estimator', icon: 'fa-calculator', label: 'Estimator' },
    { id: 'trips', icon: 'fa-route', label: 'Trips' },
    { id: 'fleet', icon: 'fa-car', label: 'Fleet' },
    { id: 'drivers', icon: 'fa-id-card', label: 'Drivers' },
    { id: 'settings', icon: 'fa-cog', label: 'Settings' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 flex justify-around items-center h-16 safe-area-inset-bottom z-50">
      {items.map((item) => (
        <button
          key={item.id}
          onClick={() => onViewChange(item.id as ViewType)}
          className={`flex flex-col items-center justify-center w-full h-full transition-colors ${
            currentView === item.id ? 'text-brand-500' : 'text-slate-400'
          }`}
        >
          <i className={`fas ${item.icon} text-lg mb-1`}></i>
          <span className="text-[10px] font-medium">{item.label}</span>
        </button>
      ))}
    </nav>
  );
};

export default Navigation;
