import React from 'react';

interface HeaderProps {
  searchTerm?: string;
  onSearchChange?: (value: string) => void;
  onSearchSubmit?: (e: React.FormEvent) => void;
  suggestions?: Array<{ text: string }>;
  onSuggestionClick?: (suggestion: string) => void;
}

const Header: React.FC<HeaderProps> = () => {
  return (
    <header className="sticky top-0 w-full bg-[#cef2f8] text-black shadow-[0_4px_12px_rgba(0,0,0,0.16)] z-50">
      <div className="container mx-auto flex items-center h-12">
        <img 
          src="https://www.optum.com/content/dam/optum4/images/logos/optum-logo-ora-rgb1.svg" 
          alt="Optum Logo" 
          className="h-6 w-auto ml-0"
        />
        <h1 className="text-lg font-semibold whitespace-nowrap ml-3">
          Preferred Network
        </h1>
      </div>
    </header>
  );
};

export default Header; 