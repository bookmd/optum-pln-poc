import { useCallback } from "react";
import mixpanel, { type Config } from "mixpanel-browser";

// Get token from environment variable based on build mode
// DEV mode (npm run dev) uses VITE_MIXPANEL_DEV_TOKEN
// PROD mode (npm run build) uses VITE_MIXPANEL_PROD_TOKEN
const MIXPANEL_TOKEN = import.meta.env.DEV
  ? (import.meta.env.VITE_MIXPANEL_DEV_TOKEN || "")
  : (import.meta.env.VITE_MIXPANEL_PROD_TOKEN || "");

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
 * Sanitize properties - convert undefined/null values to "Null"
 */
const sanitizeProperties = (properties?: Record<string, unknown>): Record<string, unknown> => {
  if (!properties) return {};
  
  return Object.fromEntries(
    Object.entries(properties).map(([key, value]) => [
      key,
      value === undefined || value === null ? "Null" : value
    ])
  );
};

/**
 * Custom hook for tracking analytics events
 */
export const useAnalytics = () => {
  const track = useCallback(
    (eventName: string, properties?: Record<string, unknown>) => {
      if (!isInitialized) {
        console.warn("Mixpanel not initialized, skipping track:", eventName, properties);
        return;
      }
      try {
        const sanitizedProperties = sanitizeProperties(properties);
        console.log("Mixpanel tracking event:", eventName, sanitizedProperties);
        mixpanel.track(eventName, {
          ...sanitizedProperties,
          timestamp: new Date().toISOString(),
        });
        console.log("Mixpanel event tracked successfully:", eventName);
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

  /**
   * Register super properties that will be sent with every event
   * These persist for the session (stored in sessionStorage based on our config)
   */
  const register = useCallback((properties: Record<string, unknown>) => {
    if (!isInitialized) return;
    try {
      const sanitizedProperties = sanitizeProperties(properties);
      mixpanel.register(sanitizedProperties);
    } catch (error) {
      console.warn("Mixpanel register failed:", error);
    }
  }, []);

  return { track, identify, setUserProperties, register };
};

