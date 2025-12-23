import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useVimOsContext } from "./hooks/useVimOsContext";
import { useVimOSOrders } from "./hooks/useOrders";
import { useVimOSPatient } from "./hooks/usePatient";
import { Toaster } from "./components/ui/toaster";
import Header from "./components/Header";
import VendorCard from "./components/VendorCard";
import { useAnalytics } from "./hooks/useAnalytics";


function App() {
  console.log('App component mounting...');
  const navigate = useNavigate();
  const vimOs = useVimOsContext();
  const { orders } = useVimOSOrders();
  const { patient } = useVimOSPatient();
  const [isVimOsReady, setIsVimOsReady] = useState(false);
  const { track } = useAnalytics();
  const hasTrackedAppOpened = useRef(false);
  const hasTrackedPopupShown = useRef(false);
  const trackedLabOrderIds = useRef<Set<string>>(new Set());
  const trackRef = useRef(track);
  trackRef.current = track; // Always keep ref updated with latest track function
  
  console.log('Initial render - vimOs:', vimOs);
  console.log('Initial render - orders:', orders);
  console.log('Initial render - patient:', patient);

  // Helper function to get tracking data
  const getTrackingData = () => {
    const labOrder = orders?.find(order => order.basicInformation?.type === 'LAB');
    return {
      ehrOrderId: labOrder?.identifiers?.ehrOrderId,
      vimPatientId: patient?.identifiers?.vimPatientId,
    };
  };

  // Check if VimOS is ready
  useEffect(() => {
    if (vimOs?.hub) {
      console.log('VimOS is ready');
      setIsVimOsReady(true);
    }
  }, [vimOs]);

  // Track #5: App opened in Vim Hub
  useEffect(() => {
    if (isVimOsReady && orders && patient && !hasTrackedAppOpened.current) {
      const { ehrOrderId, vimPatientId } = getTrackingData();
      track("App Opened in Vim Hub", {
        ehrOrderId,
        vimPatientId,
      });
      hasTrackedAppOpened.current = true;
    }
  }, [isVimOsReady, orders, patient, track]);

  // Track #2 & #7: Lab order available & New order event (LAB type)
  useEffect(() => {
    if (!orders || !patient) return;

    const vimPatientId = patient.identifiers?.vimPatientId;

    orders.forEach((order) => {
      const ehrOrderId = order.identifiers?.ehrOrderId;
      
      // Only track each order once
      if (
        order.basicInformation?.type === "LAB" &&
        ehrOrderId &&
        !trackedLabOrderIds.current.has(ehrOrderId)
      ) {
        trackedLabOrderIds.current.add(ehrOrderId);

        // Track #2: Lab order available from SDK
        track("Lab Order Available", {
          ehrOrderId,
          vimPatientId,
          orderType: order.basicInformation?.type,
        });

        // Track #7: New order event registered (LAB type)
        track("New Order Event Registered", {
          eventType: "LAB",
          ehrOrderId,
          vimPatientId,
        });
      }
    });
  }, [orders, patient, track]);

  // Track #6: Lab network selected
  const handleVendorSelect = (vendorName: string) => {
    console.log('Selected vendor:', vendorName);
    
    const { ehrOrderId, vimPatientId } = getTrackingData();
    track("Lab Network Selected", {
      labNetwork: vendorName,
      ehrOrderId,
      vimPatientId,
    });
    
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

    const hasLabOrder = orders.some(order => order.basicInformation?.type === 'LAB');
    
    // Show popup when lab order exists and patient has name
    if (hasLabOrder && patient?.demographics?.firstName) {
      console.log('Found lab order, attempting to show notification...');
      const notificationId = `lab-order-${Date.now()}`;
      const labOrder = orders.find(order => order.basicInformation?.type === 'LAB');
      const ehrOrderId = labOrder?.identifiers?.ehrOrderId;
      const vimPatientId = patient?.identifiers?.vimPatientId;
      
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
              // Track #4: Select a Lab button clicked in popup
              trackRef.current("Select a Lab Button Clicked", {
                ehrOrderId,
                vimPatientId,
              });
            }
          }
        }
      };
      
      setTimeout(() => {
        try {
          vimOs.hub.pushNotification.show(notificationPayload);
          // Track #3: Popup shown (only track once)
          if (!hasTrackedPopupShown.current) {
            trackRef.current("Popup Shown", {
              ehrOrderId,
              vimPatientId,
            });
            hasTrackedPopupShown.current = true;
          }
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
              logoUrl="/quest-logo.png"
              onSelect={() => handleVendorSelect("Quest")}
            />
            <VendorCard
              vendorName="LabCorp"
              logoUrl="/labcorp-logo.png"
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
