import { useEffect, useState } from "react";
import { EHR } from "vim-os-js-browser/types";
import { useVimOsContext } from "../useVimOsContext";
import { useAppConfig } from "../useAppConfig";
import { VimOSPatientContext } from "./patient-context";

export const VimOSPatientProvider: React.FC<React.PropsWithChildren> = ({
  children,
}) => {
  const { updateNotification } = useAppConfig();
  const vimOS = useVimOsContext();
  const [patient, setPatient] = useState<EHR.Patient | undefined>(undefined);

  useEffect(() => {
    const handlePatient = (data: EHR.Patient | undefined) => {
      setPatient(data);
      updateNotification("patient", data ? 1 : 0);
    };

    vimOS.ehr.subscribe("patient", handlePatient);

    return () => {
      vimOS.ehr.unsubscribe("patient", handlePatient);
    };
  }, [vimOS, updateNotification]);

  return (
    <VimOSPatientContext.Provider
      value={{
        patient,
      }}
    >
      {children}
    </VimOSPatientContext.Provider>
  );
};
