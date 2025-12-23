import { useCallback } from "react";
import mixpanel, { type Config } from "mixpanel-browser";

// Get token from environment variable
const MIXPANEL_TOKEN = import.meta.env.VITE_MIXPANEL_TOKEN || "";

let isInitialized = false;

/**
 * Initialize Mixpanel - call this once when the app starts
 */
export const initMixpanel = () => {
  if (!isInitialized && MIXPANEL_TOKEN) {
    try {
      mixpanel.init(MIXPANEL_TOKEN, {
        debug: import.meta.env.DEV, // Enable debug mode only in development
        track_pageview: true, // Automatically track page views
        persistence: "sessionStorage" as Config["persistence"], // Store user data in sessionStorage (clears when browser closes)
      });
      isInitialized = true;
    } catch (error) {
      console.warn("Mixpanel initialization failed:", error);
    }
  }
};

/**
 * Custom hook for tracking analytics events
 */
export const useAnalytics = () => {
  const track = useCallback(
    (eventName: string, properties?: Record<string, unknown>) => {
      if (!isInitialized) return; // Skip if not initialized
      try {
        mixpanel.track(eventName, {
          ...properties,
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        console.warn("Mixpanel track failed:", error);
      }
    },
    []
  );

  const identify = useCallback((userId: string) => {
    if (!isInitialized) return; // Skip if not initialized
    try {
      mixpanel.identify(userId);
    } catch (error) {
      console.warn("Mixpanel identify failed:", error);
    }
  }, []);

  const setUserProperties = useCallback(
    (properties: Record<string, unknown>) => {
      if (!isInitialized) return; // Skip if not initialized
      try {
        mixpanel.people.set(properties);
      } catch (error) {
        console.warn("Mixpanel setUserProperties failed:", error);
      }
    },
    []
  );

  return { track, identify, setUserProperties };
};

