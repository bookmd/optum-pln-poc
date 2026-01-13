import { createContext } from "react";
import { EHR } from "vim-os-js-browser/types";

interface PatientContext {
  patient: EHR.Patient | undefined;
}

export const VimOSPatientContext = createContext<PatientContext>({
  patient: undefined,
});



