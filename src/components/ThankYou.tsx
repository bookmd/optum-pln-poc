import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from './Header';
import { useVimOSPatient } from '../hooks/usePatient';

const ThankYou: React.FC = () => {
  const navigate = useNavigate();
  const { patient } = useVimOSPatient();

  // Navigate back to home when patient is no longer in context
  useEffect(() => {
    if (!patient) {
      console.log('Patient no longer in context - navigating back to home');
      navigate('/');
    }
  }, [patient, navigate]);

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



