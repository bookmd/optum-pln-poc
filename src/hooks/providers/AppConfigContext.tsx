import { useCallback, useEffect, useState } from "react";
import { useVimOsContext } from "../useVimOsContext";
import { AppConfigContext } from "./app-config-context";

export const AppConfigProvider: React.FC<React.PropsWithChildren> = ({
  children,
}) => {
  const vimOs = useVimOsContext();
  const [jsonMode, setJsonMode] = useState(false);
  const [notifications, setNotifications] = useState<Record<string, number>>(
    {}
  );

  const updateNotification = useCallback((id: string, amount: number) => {
    setNotifications((prev) => ({
      ...prev,
      [id]: amount,
    }));
  }, []);

  useEffect(() => {
    const syncNotifications = () => {
      try {
        if (vimOs.hub.appState.isAppOpen) {
          vimOs.hub.notificationBadge.hide();

          if (Object.keys(notifications).length > 0) {
            setNotifications({});
          }
        } else {
          const sumNotifications = Object.values(notifications).reduce(
            (acc, val) => acc + val,
            0
          );

          if (sumNotifications > 0) {
            vimOs.hub.notificationBadge.set(sumNotifications);
          } else {
            vimOs.hub.notificationBadge.hide();
          }
        }
      } catch (e) {
        console.error("Failed to sync notifications", e);
      }
    };
    syncNotifications();
    vimOs.hub.appState.subscribe("appOpenStatus", syncNotifications);

    return () => {
      vimOs.hub.appState.unsubscribe("appOpenStatus", syncNotifications);
    };
  }, [vimOs, notifications]);

  return (
    <AppConfigContext.Provider
      value={{
        jsonMode,
        setJsonMode,
        notifications,
        updateNotification,
      }}
    >
      {children}
    </AppConfigContext.Provider>
  );
};
