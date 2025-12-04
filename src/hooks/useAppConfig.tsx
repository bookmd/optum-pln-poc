import { useContext } from "react";
import { AppConfigContext } from "./providers/app-config-context";

export const useAppConfig = () => {
  return useContext(AppConfigContext);
};
