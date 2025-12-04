import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useVimOsContext } from "./hooks/useVimOsContext";
import { useVimOSOrders } from "./hooks/useOrders";
import { useVimOSPatient } from "./hooks/usePatient";
import { Toaster } from "./components/ui/toaster";
import Header from "./components/Header";
import VendorCard from "./components/VendorCard";


function App() {
  console.log('App component mounting...');
  const navigate = useNavigate();
  const vimOs = useVimOsContext();
  const { orders } = useVimOSOrders();
  const { patient } = useVimOSPatient();
  const [isVimOsReady, setIsVimOsReady] = useState(false);
  
  console.log('Initial render - vimOs:', vimOs);
  console.log('Initial render - orders:', orders);
  console.log('Initial render - patient:', patient);

  // Check if VimOS is ready
  useEffect(() => {
    if (vimOs?.hub) {
      console.log('VimOS is ready');
      setIsVimOsReady(true);
    }
  }, [vimOs]);

  const handleVendorSelect = (vendorName: string) => {
    console.log('Selected vendor:', vendorName);
    navigate('/thank-you');
  };

  // Effect for showing notification
  useEffect(() => {
    if (!isVimOsReady || !orders) return;

    console.log('Checking for lab orders to show notification:', { 
      isVimOsReady, 
      hasOrders: !!orders,
      orders 
    });

    const hasLabOrder = orders.some(order => 
      order.basicInformation?.type === 'LAB' &&
      (order.identifiers?.ehrOrderId == null || order.identifiers?.ehrOrderId === '') &&
      (order.basicInformation?.createdDate == null || order.basicInformation?.createdDate === '')
    );
    
    if (hasLabOrder && patient?.demographics?.firstName) {
      console.log('Found lab order, attempting to show notification...');
      const notificationId = `lab-order-${Date.now()}`;
      
      const notificationPayload = {
        text: `Choose a lab in the Preferred Lab Network to help ${patient?.demographics?.firstName} access higher-quality lab services with faster results`,
        notificationId,
        timeoutInSec: 30,
        actionButtons: {
          leftButton: {
            text: "Dismiss",
            buttonStyle: "LINK" as const,
            callback: () => {
              console.log('Notification dismissed');
            }
          },
          rightButton: {
            text: "Select a lab",
            buttonStyle: "PRIMARY" as const,
            openAppButton: true,
            callback: () => {
              console.log('Opening app to select lab');
            }
          }
        }
      };
      
      setTimeout(() => {
        try {
          vimOs.hub.pushNotification.show(notificationPayload);
        } catch (error) {
          console.error('Error showing notification:', error);
        }
      }, 100);
    }
  }, [isVimOsReady, orders, vimOs, patient]);

  // Effect for activation status
  useEffect(() => {
    if (!isVimOsReady) return;

    const hasLabOrder = orders?.some(order => order.basicInformation?.type === 'LAB');
    console.log('Checking activation status:', { hasLabOrder, hasPatient: !!patient });

    if (patient && !hasLabOrder) {
      console.log('Disabling app: Patient exists but no lab order is present');
      vimOs.hub.setActivationStatus('DISABLED');
    } else if (patient && hasLabOrder) {
      console.log('Enabling app: Patient and lab order are present');
      vimOs.hub.setActivationStatus('ENABLED');
    } else {
      console.log('Disabling app: No patient present');
      vimOs.hub.setActivationStatus('DISABLED');
    }
  }, [isVimOsReady, orders, vimOs, patient]);

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto">
          {/* Vendor cards */}
          <div className="space-y-4 py-4">
            <VendorCard
              vendorName="Quest"
              logoUrl="https://logo.clearbit.com/questdiagnostics.com"
              onSelect={() => handleVendorSelect("Quest")}
            />
            <VendorCard
              vendorName="LabCorp"
              logoUrl="https://logo.clearbit.com/labcorp.com"
              onSelect={() => handleVendorSelect("LabCorp")}
            />
          </div>
        </div>
      </main>
      <Toaster />
    </div>
  );
}

export default App;
