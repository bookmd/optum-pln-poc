import React from 'react';
import type { LabLocation } from '../data/labLocations';

interface LabCardProps {
  lab: LabLocation;
  onSelect: (lab: LabLocation) => void;
}

const LabCard: React.FC<LabCardProps> = ({ lab, onSelect }) => {
  return (
    <div className="bg-white rounded-xl shadow-[0_4px_16px_rgba(0,0,0,0.08)] hover:shadow-[0_8px_28px_rgba(0,0,0,0.16)] transition-all duration-300 border border-transparent hover:border-orange-500/30">
      <div className="p-5">
        {/* Header Section */}
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">{lab.provider}</h3>
          <img 
            src={`https://logo.clearbit.com/${lab.provider === 'Quest' ? 'questdiagnostics.com' : 'labcorp.com'}`}
            alt={`${lab.provider} logo`}
            className="w-8 h-8 object-contain"
          />
        </div>

        {/* Distance Info */}
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span>{lab.distance} away</span>
        </div>

        {/* Address Section */}
        <div className="mb-6 pl-[2px]">
          <div className="space-y-1 text-sm">
            <p className="text-gray-700">{lab.address}</p>
            <p className="text-gray-700">{lab.city}, {lab.state} {lab.zip}</p>
            <p className="flex items-center gap-2 text-gray-500">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              {lab.phone}
            </p>
          </div>
        </div>

        {/* Status Section */}
        <div className="mb-6 bg-orange-50/50 border border-orange-100 rounded-lg p-3">
          <div className="flex items-center gap-2 text-xs mb-2">
            <svg className="w-3.5 h-3.5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-medium text-gray-700">Next Available:</span>
            <span className="text-gray-600">{lab.nextAvailable}</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <svg className="w-3.5 h-3.5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-medium text-gray-700">Estimated Patient Price:</span>
            <span className="text-gray-600">{lab.estimatedCost}</span>
          </div>
        </div>

        {/* CTA Button */}
        <button
          onClick={() => onSelect(lab)}
          className="w-full bg-[#00205B] hover:bg-[#001a4d] text-white font-semibold py-2.5 px-4 rounded-full transition-colors duration-200"
        >
          Select
        </button>
      </div>
    </div>
  );
};

export default LabCard; 