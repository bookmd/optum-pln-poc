import { useEffect, useState } from "react";
import { EHR } from "vim-os-js-browser/types";
import { useVimOsContext } from "../useVimOsContext";
import { useAppConfig } from "../useAppConfig";
import { VimOSClaimContext } from "./claim-context";

export const VimOSClaimProvider: React.FC<React.PropsWithChildren> = ({
  children,
}) => {
  const { updateNotification } = useAppConfig();
  const vimOS = useVimOsContext();
  const [claim, setClaim] = useState<EHR.Claim | undefined>(undefined);

  useEffect(() => {
    vimOS.ehr.subscribe("claim", (data) => {
      setClaim(data);
      updateNotification("claim", data ? 1 : 0);
    });

    return () => {
      vimOS.ehr.unsubscribe("claim", setClaim);
    };
  }, [vimOS, updateNotification]);

  return (
    <VimOSClaimContext.Provider
      value={{
        claim,
      }}
    >
      {children}
    </VimOSClaimContext.Provider>
  );
};
