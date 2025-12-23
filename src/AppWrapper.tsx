import React, { useEffect, useState, useRef } from "react";
import { SDK } from "vim-os-js-browser/types";
import { loadSdk } from "vim-os-js-browser";
import { Toaster } from "@/components/ui/toaster";
import {
  VimOSContext,
  VimOSPatientProvider,
  VimOSEncounterProvider,
  VimOSReferralProvider,
  VimOSOrdersProvider,
  VimOSClaimProvider,
} from "@/hooks/providers";
import { useAnalytics } from "@/hooks/useAnalytics";

// Set to true to bypass VimSDK loading in development
const BYPASS_VIM_SDK = import.meta.env.VITE_BYPASS_VIM_SDK === "true" || false;

// Create a minimal mock SDK for development
const createMockSDK = (): SDK => {
  return {
    hub: {
      pushNotification: {
        show: () => {},
      },
      setActivationStatus: () => {},
    },
    sessionContext: {},
    ehr: {
      subscribe: () => {},
      unsubscribe: () => {},
    },
  } as unknown as SDK;
};

export const AppWrapper: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [vimOS, setVimOS] = useState<SDK | undefined>(undefined);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const hasTrackedLogin = useRef(false);
  const { track, identify } = useAnalytics();
  
  useEffect(() => {
    // If bypass is enabled, use mock SDK immediately
    if (BYPASS_VIM_SDK) {
      console.warn("⚠️ VimSDK loading bypassed - using mock SDK for development");
      setVimOS(createMockSDK());
      return;
    }

    // Otherwise, try to load the real SDK with a timeout
    const timeout = setTimeout(() => {
      console.warn("⚠️ VimSDK loading timed out after 5 seconds - using mock SDK");
      setVimOS(createMockSDK());
      setLoadingError("VimSDK loading timed out");
    }, 5000);

    (async () => {
      try {
        const vimOsSdk = await loadSdk();
        clearTimeout(timeout);
        setVimOS(vimOsSdk);
      } catch (error) {
        clearTimeout(timeout);
        console.error("Error loading VimSDK:", error);
        setLoadingError(error instanceof Error ? error.message : "Unknown error");
        // Use mock SDK on error so app can still render
        setVimOS(createMockSDK());
      }
    })();

    return () => clearTimeout(timeout);
  }, []);

  // Track #1: User Login - Track when session context is available
  useEffect(() => {
    if (vimOS?.sessionContext && !hasTrackedLogin.current) {
      const vimUserId = vimOS.sessionContext.user?.identifiers?.vimUserID;
      const organizationId = vimOS.sessionContext.organization?.identifiers?.id;

      if (vimUserId) {
        identify(vimUserId);
        track("User Login", {
          vimUserId,
          organizationId,
        });
        hasTrackedLogin.current = true;
      }
    }
  }, [vimOS, track, identify]);

  if (!vimOS) {
    return (
      <div>
        <div>Loading VimSDK...</div>
        {loadingError && <div style={{ color: "red", marginTop: "10px" }}>Error: {loadingError}</div>}
      </div>
    );
  }
  return (
    <VimOSContext.Provider value={vimOS}>
      <VimOSPatientProvider>
        <VimOSReferralProvider>
          <VimOSOrdersProvider>
            <VimOSClaimProvider>
              <VimOSEncounterProvider>{children}</VimOSEncounterProvider>
            </VimOSClaimProvider>
          </VimOSOrdersProvider>
        </VimOSReferralProvider>
      </VimOSPatientProvider>
      <Toaster />
    </VimOSContext.Provider>
  );
};
