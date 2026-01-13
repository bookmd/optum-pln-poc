import { createContext } from "react";

interface AppConfigContext {
  jsonMode: boolean;
  setJsonMode: (jsonMode: boolean) => void;
  notifications: Record<string, number>;
  updateNotification: (notificationId: string, amount: number) => void;
}

export const AppConfigContext = createContext<AppConfigContext>({
  jsonMode: false,
  setJsonMode: () => {},
  notifications: {},
  updateNotification: () => {},
});



