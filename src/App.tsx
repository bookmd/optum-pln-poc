import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { EHR } from "vim-os-js-browser/types";
import { useVimOsContext } from "./hooks/useVimOsContext";
import { useVimOSOrders } from "./hooks/useOrders";
import { useVimOSPatient } from "./hooks/usePatient";
import { Toaster } from "./components/ui/toaster";
import { useToast } from "./hooks/use-toast";
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
  const { toast } = useToast();
  const hasTrackedPopupShown = useRef(false);
  const trackedLabOrderIds = useRef<Set<string>>(new Set());
  const shownPopupOrderIds = useRef<Set<string>>(new Set());
  const trackRef = useRef(track);
  const previousPatientId = useRef<string | undefined>(undefined);
  const hasOpenedAppInHub = useRef(false); // Track if user has opened the app in Vim Hub for current context
  const hasBadgeBeenSet = useRef(false); // Track if badge has been set for current context
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

  // Reset app state when patient leaves context (was present, now gone)
  useEffect(() => {
    const currentPatientId = patient?.identifiers?.vimPatientId;
    
    // Only reset if patient was previously present and is now gone
    if (previousPatientId.current && !currentPatientId) {
      console.log('Patient left context - resetting app state');
      console.log('Before reset - shownPopupOrderIds:', Array.from(shownPopupOrderIds.current));
      hasTrackedPopupShown.current = false;
      trackedLabOrderIds.current.clear();
      shownPopupOrderIds.current.clear();
      hasOpenedAppInHub.current = false; // Reset badge tracking
      hasBadgeBeenSet.current = false; // Reset badge set tracking
      console.log('After reset - shownPopupOrderIds:', Array.from(shownPopupOrderIds.current));
      navigate('/');
    }
    
    // Update the previous patient ID for next comparison
    previousPatientId.current = currentPatientId;
  }, [patient, navigate]);

  // Subscribe to onOrderCreated workflow event
  useEffect(function subscribeToOrderCreated() {
    // Subscribe once
    vimOs.ehr.workflowEvents.order.onOrderCreated((order: EHR.Order) => {
      console.log('Order created event received:', order);
      console.log('Order type:', order?.basicInformation?.type);
      
      // Check if order type is LAB and track
      if (order?.basicInformation?.type === 'LAB') {
        const ehrOrderId = order?.identifiers?.ehrOrderId;
        console.log('Tracking Order Created event to Mixpanel:', { ehrOrderId, orderType: 'LAB' });
        trackRef.current("optum_pln_order_created_event", {
          ehrOrderId,
          orderType: 'LAB',
        });
      } else {
        console.log('Order type is not LAB, skipping Mixpanel tracking. Type was:', order?.basicInformation?.type);
      }
    });
  }, [vimOs]);

  // Track #5: App becomes visible in Vim Hub (user clicks "Select a Lab" or app tab)
  // Tracks every time the app is opened, not just once per session
  // Also hides notification badge when user opens the app
  useEffect(function subscribeToAppOpenStatus() {
    if (!isVimOsReady) return;

    const handleAppOpenStatus = () => {
      // Track every time app becomes visible (isAppOpen is true)
      if (vimOs.hub.appState.isAppOpen) {
        const labOrder = orders?.find(order => order.basicInformation?.type === 'LAB');
        const ehrOrderId = labOrder?.identifiers?.ehrOrderId;
        const vimPatientId = patient?.identifiers?.vimPatientId;
        
        console.log('App became visible in Vim Hub');
        trackRef.current("optum_pln_app_opened_in_hub", {
          ehrOrderId,
          vimPatientId,
        });

        // Mark that user has opened the app and hide notification badge
        if (!hasOpenedAppInHub.current) {
          hasOpenedAppInHub.current = true;
          console.log('🔔 User opened app - hiding notification badge');
          try {
            vimOs.hub.notificationBadge.set(0);
          } catch (error) {
            console.warn('Failed to hide notification badge:', error);
          }
        }
      }
    };

    // Subscribe to open status changes (don't check initial state to avoid duplicate on mount)
    vimOs.hub.appState.subscribe("appOpenStatus", handleAppOpenStatus);

    return () => {
      vimOs.hub.appState.unsubscribe("appOpenStatus", handleAppOpenStatus);
    };
  }, [isVimOsReady, vimOs, orders, patient]);

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
        track("optum_pln_lab_order_detected", {
          ehrOrderId,
          vimPatientId,
          orderType: order.basicInformation?.type,
        });
      }
    });
  }, [orders, patient, track]);

  // Track #6: Lab network selected
  const handleVendorSelect = (vendorName: string) => {
    console.log('Selected vendor:', vendorName);
    
    const { ehrOrderId, vimPatientId } = getTrackingData();
    track("optum_pln_lab_network_selected", {
      labNetwork: vendorName,
      ehrOrderId,
      vimPatientId,
    });
    
    navigate('/thank-you');

    // Auto-collapse Vim Hub after 5 seconds
    setTimeout(() => {
      // Only collapse if this app is still active (user hasn't switched to another app)
      if (vimOs.hub.appState.isAppOpen) {
        console.log('Auto-collapsing Vim Hub after lab network selection');
        vimOs.hub.closeApp();
      } else {
        console.log('Skipping auto-collapse: user switched to another app');
      }
    }, 5000);
  };

  // Effect for showing notification
  useEffect(() => {
    if (!isVimOsReady || !orders) return;

    const labOrder = orders.find(order => order.basicInformation?.type === 'LAB');
    const ehrOrderId = labOrder?.identifiers?.ehrOrderId;
    const patientName = patient?.demographics?.firstName;
    const vimPatientId = patient?.identifiers?.vimPatientId;
    
    // Use ehrOrderId if available, otherwise use vimPatientId as fallback for tracking
    const popupTrackingId = ehrOrderId || (vimPatientId ? `patient-${vimPatientId}` : null);
    const alreadyShown = popupTrackingId ? shownPopupOrderIds.current.has(popupTrackingId) : false;
    const isAppOpen = vimOs.hub.appState.isAppOpen;

    console.log('Popup check:', { 
      isVimOsReady, 
      hasLabOrder: !!labOrder,
      ehrOrderId,
      popupTrackingId,
      patientName,
      alreadyShown,
      isAppOpen,
      shownPopupOrderIds: Array.from(shownPopupOrderIds.current)
    });

    // Show popup when lab order exists, patient has name, and popup hasn't been shown
    if (labOrder && patientName && popupTrackingId && !alreadyShown) {
      console.log('✅ ENTERING popup block for order:', popupTrackingId);
      
      // Mark this as having shown a popup
      shownPopupOrderIds.current.add(popupTrackingId);
      
      // Check if app is already open - use in-app toast instead of push notification
      if (isAppOpen) {
        console.log('📱 App is open - showing in-app toast instead of push notification');
        toast({
          title: "Lab Order Detected",
          description: `Choose a lab in the Preferred Lab Network to help ${patientName} access higher-quality lab services with faster results`,
          duration: 10000,
        });
        
        // Track notification shown
        if (!hasTrackedPopupShown.current) {
          trackRef.current("optum_pln_popup_shown", {
            ehrOrderId,
            vimPatientId,
            notificationType: "in_app_toast",
          });
          hasTrackedPopupShown.current = true;
        }
      } else {
        // App is collapsed - show push notification
        const notificationId = `lab-order-${popupTrackingId}`;
        
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
                trackRef.current("optum_pln_popup_button_clicked", {
                  ehrOrderId,
                  vimPatientId,
                });
              }
            }
          }
        };
        
        setTimeout(() => {
          console.log('⏰ setTimeout fired, calling pushNotification.show()');
          try {
            vimOs.hub.pushNotification.show(notificationPayload);
            console.log('📬 pushNotification.show() called successfully');
            // Track #3: Popup shown (only track once)
            if (!hasTrackedPopupShown.current) {
              trackRef.current("optum_pln_popup_shown", {
                ehrOrderId,
                vimPatientId,
                notificationType: "push_notification",
              });
              hasTrackedPopupShown.current = true;
            }
          } catch (error) {
            console.error('❌ Error showing notification:', error);
          }
        }, 100);
      }
    } else {
      console.log('❌ Popup condition NOT met:', { 
        hasLabOrder: !!labOrder, 
        hasPatientName: !!patientName, 
        hasEhrOrderId: !!ehrOrderId, 
        alreadyShown 
      });
    }
  }, [isVimOsReady, orders, vimOs, patient, toast]);

  // Effect for activation status and notification badge
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
      
      // Show notification badge if user hasn't opened the app yet for this context
      if (!hasOpenedAppInHub.current && !hasBadgeBeenSet.current) {
        hasBadgeBeenSet.current = true;
        console.log('🔔 App enabled and user hasn\'t opened it yet - showing notification badge');
        try {
          vimOs.hub.notificationBadge.set(1);
        } catch (error) {
          console.warn('Failed to set notification badge:', error);
        }
      }
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
