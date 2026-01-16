import { useEffect, useState } from "react";
import { EHR } from "vim-os-js-browser/types";
import { useVimOsContext } from "../useVimOsContext";
import { useAppConfig } from "../useAppConfig";
import { VimOSOrdersContext } from "./orders-context";

export const VimOSOrdersProvider: React.FC<React.PropsWithChildren> = ({
  children,
}) => {
  const { updateNotification } = useAppConfig();
  const vimOS = useVimOsContext();
  const [orders, setOrders] = useState<EHR.Order[] | undefined>(undefined);

  useEffect(() => {
    const handleOrders = (data: EHR.Order[] | undefined) => {
      setOrders(data);
      updateNotification("orders", data ? 1 : 0);
    };

    vimOS.ehr.subscribe("orders", handleOrders);

    return () => {
      vimOS.ehr.unsubscribe("orders", handleOrders);
    };
  }, [vimOS, updateNotification]);

  return (
    <VimOSOrdersContext.Provider
      value={{
        orders,
      }}
    >
      {children}
    </VimOSOrdersContext.Provider>
  );
};
