import React from 'react';

interface VendorCardProps {
  vendorName: string;
  logoUrl: string;
  onSelect: () => void;
}

const VendorCard: React.FC<VendorCardProps> = ({ vendorName, logoUrl, onSelect }) => {
  return (
    <div className="bg-white rounded-xl shadow-[0_4px_16px_rgba(0,0,0,0.08)] hover:shadow-[0_8px_28px_rgba(0,0,0,0.16)] transition-all duration-300 border border-transparent hover:border-orange-500/30">
      <div className="p-5">
        {/* Header Section */}
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">{vendorName}</h3>
          <img 
            src={logoUrl}
            alt={`${vendorName} logo`}
            className="w-8 h-8 object-contain"
          />
        </div>

        {/* CTA Button */}
        <button
          onClick={onSelect}
          className="w-full bg-[#00205B] hover:bg-[#001a4d] text-white font-semibold py-2.5 px-4 rounded-full transition-colors duration-200"
        >
          Select
        </button>
      </div>
    </div>
  );
};

export default VendorCard;





