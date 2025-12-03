import React from 'react';
import Header from './Header';

const ThankYou: React.FC = () => {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto py-8">
          <div className="text-center">
            <p className="text-lg text-gray-700">
              Thank you for ordering from the <span className="font-bold">Optum Health Preferred Lab Network</span>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ThankYou;


