# Project Orientation Guide

This guide provides code examples for the main components of this Vim Canvas™️ application.

## Overview

This is a React application built on the Vim Canvas™️ platform that helps healthcare providers select preferred lab networks. The app integrates with EHR systems through VimOS.js SDK and uses Cloudflare Pages Functions for authentication.

---

## 1. Authentication

The authentication flow uses OAuth 2.0 with Vim Canvas™️. The flow consists of three main parts:

### 1.1 Launch Handler (Frontend Entry Point)

When the app is launched from the EHR, it redirects to `/launch` which initiates the OAuth flow:

**File: `src/components/LaunchHandler.tsx`**

```tsx
import { useEffect } from "react";

export const LaunchHandler = () => {
  useEffect(() => {
    // Get the current URL search params (launch_id, vim_organization_id, etc.)
    const currentParams = new URLSearchParams(window.location.search);
    
    // Redirect to the API launch endpoint with the same parameters
    const apiUrl = `/api/launch?${currentParams.toString()}`;
    window.location.href = apiUrl;
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
        <p>Launching application...</p>
      </div>
    </div>
  );
};
```

### 1.2 Launch Endpoint (Backend - Initiates OAuth)

The `/api/launch` endpoint redirects to Vim's authorization server:

**File: `functions/api/launch.ts`**

```typescript
import { Env } from "../context-env";

const SETTINGS_LAUNCH_TYPE = "APP_SETTINGS";

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const url = new URL(context.request.url);
  const queryParams = url.searchParams;
  const launchId = queryParams.get("launch_id");
  const launchType = queryParams.get("launch_type");

  // Redirect to the settings application page if the launch type is APP_SETTINGS
  let redirect_uri = context.env.REDIRECT_URL ?? "http://localhost:8788";
  redirect_uri =
    launchType === SETTINGS_LAUNCH_TYPE
      ? `${redirect_uri}/settings`
      : redirect_uri;

  const redirectUrl = new URL(
    context.env.VIM_AUTHORIZE_ENDPOINT ??
      "https://api.getvim.com/v1/oauth/authorize"
  );
  redirectUrl.searchParams.append("launch_id", launchId);
  redirectUrl.searchParams.append("client_id", context.env.CLIENT_ID);
  redirectUrl.searchParams.append("redirect_uri", redirect_uri);
  redirectUrl.searchParams.append("response_type", "code");
  return Response.redirect(redirectUrl.toString(), 302);
};
```

### 1.3 Token Exchange (Backend - Completes OAuth)

After authorization, Vim redirects back with a code. The `/api/token` endpoint exchanges it for tokens:

**File: `functions/api/token.ts`**

```typescript
import { parseJwt } from "@cfworker/jwt";
import { Env } from "../context-env";

async function getToken(context, code: string, client_secret: string) {
  return fetch(
    context.env.VIM_TOKEN_ENDPOINT ?? "https://api.getvim.com/v1/oauth/token",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: context.env.CLIENT_ID,
        code,
        client_secret,
        grant_type: "authorization_code",
      }),
    }
  );
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const { code } = await context.request.json<{ code: string }>();
    let vimResponse = await getToken(context, code, context.env.CLIENT_SECRET);
    
    // Fallback to secondary secret if primary fails
    if (
      vimResponse.status >= 400 &&
      vimResponse.status < 500 &&
      context.env.CLIENT_SECRET_FALLBACK
    ) {
      vimResponse = await getToken(
        context,
        code,
        context.env.CLIENT_SECRET_FALLBACK
      );
    }
    
    const tokenData = await vimResponse.json();
    
    // Verify token and check authorization
    if (
      !(await isAuthorized(
        tokenData,
        context.env.CLIENT_ID,
        context.env.VIM_ISSUER
      ))
    ) {
      return new Response("", {
        status: 403,
        statusText: "Forbidden: You do not have access to this resource.",
      });
    }
    
    return Response.json(tokenData);
  } catch (error) {
    console.log("Error verifying token", { context });
    throw error;
  }
};

async function isAuthorized(
  vimTokenData,
  clientId: string,
  vimIssuer = "https://auth.getvim.com/"
) {
  try {
    const decodedIdToken = await parseJwt({
      jwt: vimTokenData.id_token,
      issuer: vimIssuer,
      audience: clientId,
    });
    
    if (decodedIdToken.valid) {
      return await isUserEligibleToMyApp({
        email: decodedIdToken.payload["email"],
        vimUserId: decodedIdToken.payload["sub"],
      });
    }
    
    return false;
  } catch (error) {
    console.error("Error verifying token", error);
    return false;
  }
}

async function isUserEligibleToMyApp({ email, vimUserId }) {
  console.info(`User ${email}, ${vimUserId} is eligible to my app.`);
  return true; // Customize this logic based on your requirements
}
```

### 1.4 VimOS SDK Initialization

After authentication, the VimOS SDK is loaded and made available through React context:

**File: `src/AppWrapper.tsx`**

```tsx
import React, { useEffect, useState } from "react";
import { SDK } from "vim-os-js-browser/types";
import { loadSdk } from "vim-os-js-browser";
import {
  VimOSContext,
  VimOSPatientProvider,
  VimOSEncounterProvider,
  VimOSReferralProvider,
  VimOSOrdersProvider,
  VimOSClaimProvider,
} from "@/hooks/providers";

export const AppWrapper: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [vimOS, setVimOS] = useState<SDK | undefined>(undefined);
  
  useEffect(() => {
    (async () => {
      const vimOsSdk = await loadSdk();
      setVimOS(vimOsSdk);
    })();
  }, []);

  if (!vimOS) {
    return <div>Loading VimSDK...</div>;
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
    </VimOSContext.Provider>
  );
};
```

**Usage in components:**

```tsx
import { useVimOsContext } from "./hooks/useVimOsContext";

function MyComponent() {
  const vimOs = useVimOsContext();
  
  // Access VimOS SDK methods
  const hub = vimOs.hub;
  const sessionContext = vimOs.sessionContext;
  
  // ... rest of component
}
```

---

## 2. Setting an Event to Show the Pop-up (Notification)

The app uses VimOS Hub's push notification system to show pop-ups. Here's how to trigger a notification:

**File: `src/App.tsx` (lines 127-174)**

```tsx
import { useEffect } from "react";
import { useVimOsContext } from "./hooks/useVimOsContext";
import { useVimOSOrders } from "./hooks/useOrders";
import { useVimOSPatient } from "./hooks/usePatient";

function App() {
  const vimOs = useVimOsContext();
  const { orders } = useVimOSOrders();
  const { patient } = useVimOSPatient();
  const [isVimOsReady, setIsVimOsReady] = useState(false);

  // Check if VimOS is ready
  useEffect(() => {
    if (vimOs?.hub) {
      setIsVimOsReady(true);
    }
  }, [vimOs]);

  // Effect for showing notification
  useEffect(() => {
    if (!isVimOsReady || !orders) return;

    const hasLabOrder = orders.some(order => order.basicInformation?.type === 'LAB');
    
    if (hasLabOrder && patient?.demographics?.firstName) {
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

  // ... rest of component
}
```

### Notification Payload Structure

```typescript
interface NotificationPayload {
  text: string;                    // Main notification message
  notificationId: string;          // Unique identifier for the notification
  timeoutInSec?: number;           // Auto-dismiss timeout (optional)
  actionButtons?: {
    leftButton?: {
      text: string;
      buttonStyle: "LINK" | "PRIMARY" | "SECONDARY";
      callback: () => void;
    };
    rightButton?: {
      text: string;
      buttonStyle: "LINK" | "PRIMARY" | "SECONDARY";
      openAppButton?: boolean;     // If true, opens the app when clicked
      callback: () => void;
    };
  };
}
```

### Setting App Activation Status

You can also control when the app appears in the EHR by setting activation status:

```tsx
useEffect(() => {
  if (!isVimOsReady) return;

  const hasLabOrder = orders?.some(order => order.basicInformation?.type === 'LAB');

  if (patient && !hasLabOrder) {
    // Disable app: Patient exists but no lab order is present
    vimOs.hub.setActivationStatus('DISABLED');
  } else if (patient && hasLabOrder) {
    // Enable app: Patient and lab order are present
    vimOs.hub.setActivationStatus('ENABLED');
  } else {
    // Disable app: No patient present
    vimOs.hub.setActivationStatus('DISABLED');
  }
}, [isVimOsReady, orders, vimOs, patient]);
```

---

## 3. The Main UI

The main UI is structured with React components using Tailwind CSS and Radix UI. Here's the structure:

### 3.1 Main App Component

**File: `src/App.tsx`**

```tsx
import React, { useEffect, useState } from "react";
import { useVimOsContext } from "./hooks/useVimOsContext";
import { useVimOSOrders } from "./hooks/useOrders";
import { useVimOSPatient } from "./hooks/usePatient";
import { useToast } from "./hooks/use-toast";
import { Toaster } from "./components/ui/toaster";
import Header from "./components/Header";
import LabCard from "./components/LabCard";
import { labLocations, type LabLocation } from "./data/labLocations";

function App() {
  const vimOs = useVimOsContext();
  const { orders } = useVimOSOrders();
  const { patient } = useVimOSPatient();
  const { toast } = useToast();
  const [sortedLabs, setSortedLabs] = useState<LabLocation[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>('best-match');

  // ... sorting and filtering logic ...

  const handleLabSelect = (lab: LabLocation) => {
    console.log('Selected lab:', lab);
    toast({
      title: "Lab Selected",
      description: `${lab.provider}: ${lab.address}, ${lab.city}`,
      className: "bg-black border-none",
    });
  };

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main className="container mx-auto px-4">
        {patient?.address ? (
          <div className="max-w-2xl mx-auto">
            {/* Info box */}
            <div className="pt-6">
              <div className="border border-orange-500/30 bg-orange-50/30 rounded-lg p-3">
                {/* Practice Preferred Lab Usage info */}
              </div>
            </div>

            {/* Sorting dropdown */}
            <div className="sticky top-12 bg-white py-3 z-40 border-b border-gray-100">
              {/* Sort dropdown menu */}
            </div>

            {/* Lab cards */}
            <div className="space-y-4 py-4">
              {sortedLabs.map(lab => (
                <LabCard 
                  key={lab.id} 
                  lab={lab} 
                  onSelect={handleLabSelect}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center text-gray-600">
            No patient address available. Please ensure patient information is loaded.
          </div>
        )}
      </main>
      <Toaster />
    </div>
  );
}

export default App;
```

### 3.2 Header Component

**File: `src/components/Header.tsx`**

```tsx
import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="sticky top-0 w-full bg-[#E5F3FF] text-black shadow-[0_4px_12px_rgba(0,0,0,0.16)] z-50">
      <div className="container mx-auto flex items-center h-12">
        <img 
          src="https://www.optum.com/content/dam/optum4/images/logos/optum-logo-ora-rgb1.svg" 
          alt="Optum Logo" 
          className="h-6 w-auto ml-0"
        />
        <h1 className="text-lg font-semibold whitespace-nowrap ml-3">
          Preferred Lab Network
        </h1>
      </div>
    </header>
  );
};

export default Header;
```

### 3.3 Using Toast Notifications (In-App)

For in-app notifications (different from VimOS push notifications), use the toast hook:

```tsx
import { useToast } from "./hooks/use-toast";

function MyComponent() {
  const { toast } = useToast();

  const handleAction = () => {
    toast({
      title: "Success",
      description: "Action completed successfully",
      className: "bg-black border-none",
    });
  };

  return (
    <button onClick={handleAction}>
      Click me
    </button>
  );
}
```

### 3.4 Accessing EHR Data

The app uses custom hooks to access EHR data:

```tsx
import { useVimOSPatient } from "./hooks/usePatient";
import { useVimOSOrders } from "./hooks/useOrders";
import { useVimOSEncounter } from "./hooks/useEncounter";

function MyComponent() {
  const { patient } = useVimOSPatient();
  const { orders } = useVimOSOrders();
  const { encounter } = useVimOSEncounter();

  // Access patient data
  const patientName = patient?.demographics?.firstName;
  const patientAddress = patient?.address;

  // Access orders
  const labOrders = orders?.filter(order => 
    order.basicInformation?.type === 'LAB'
  );

  // Access encounter data
  const encounterDate = encounter?.basicInformation?.date;

  return (
    <div>
      <p>Patient: {patientName}</p>
      {/* ... render data ... */}
    </div>
  );
}
```

### 3.5 Routing Structure

**File: `src/main.tsx`**

```tsx
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { AppWrapper } from "./AppWrapper.tsx";
import "./globals.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppSettingsWrapper } from "./AppSettingsWrapper.tsx";
import { LaunchHandler } from "./components/LaunchHandler.tsx";

createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <Routes>
      <Route
        path="/"
        element={
          <AppWrapper>
            <App />
          </AppWrapper>
        }
      />
      <Route path="/launch" element={<LaunchHandler />} />
      <Route path="/settings" element={<AppSettingsWrapper />} />
    </Routes>
  </BrowserRouter>
);
```

---

## Key Files Summary

### Authentication
- `src/components/LaunchHandler.tsx` - Frontend launch handler
- `functions/api/launch.ts` - OAuth initiation endpoint
- `functions/api/token.ts` - Token exchange endpoint
- `src/AppWrapper.tsx` - VimOS SDK initialization

### Notifications/Pop-ups
- `src/App.tsx` (lines 127-174) - Push notification example
- `src/hooks/use-toast.ts` - In-app toast notifications
- `src/components/ui/toaster.tsx` - Toast UI component

### Main UI
- `src/App.tsx` - Main application component
- `src/components/Header.tsx` - Header component
- `src/components/LabCard.tsx` - Lab card component
- `src/main.tsx` - Application entry point and routing

### Data Hooks
- `src/hooks/usePatient.tsx` - Patient data hook
- `src/hooks/useOrders.tsx` - Orders data hook
- `src/hooks/useEncounter.tsx` - Encounter data hook
- `src/hooks/useVimOsContext.tsx` - VimOS SDK context hook

---

## Environment Variables

Required environment variables (in `.dev.vars` for local development):

```env
CLIENT_ID=<<YOUR ACCOUNT CLIENT ID>>
CLIENT_SECRET=<<YOUR ACCOUNT CLIENT SECRET>>
REDIRECT_URL=http://localhost:8788
VIM_AUTHORIZE_ENDPOINT=https://api.getvim.com/v1/oauth/authorize
VIM_TOKEN_ENDPOINT=https://api.getvim.com/v1/oauth/token
VIM_ISSUER=https://auth.getvim.com/
```

---

## Next Steps

1. **Customize Authentication**: Modify `isUserEligibleToMyApp()` in `functions/api/token.ts` to add custom authorization logic
2. **Add More Notifications**: Use `vimOs.hub.pushNotification.show()` to trigger notifications based on different conditions
3. **Extend UI**: Add new components in `src/components/` and integrate them into `App.tsx`
4. **Access More EHR Data**: Use additional hooks from `src/hooks/` to access referrals, claims, etc.



