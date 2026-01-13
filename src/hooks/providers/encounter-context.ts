import { createContext } from "react";
import { EHR } from "vim-os-js-browser/types";

interface EncounterContext {
  encounter: EHR.Encounter | undefined;
}

export const VimOSEncounterContext = createContext<EncounterContext>({
  encounter: undefined,
});



