import { createContext } from "react";
import { EHR } from "vim-os-js-browser/types";

interface ClaimContext {
  claim: EHR.Claim| undefined;
}

export const VimOSClaimContext = createContext<ClaimContext>({
  claim: undefined,
});

