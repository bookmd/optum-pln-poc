import { createContext } from "react";
import { EHR } from "vim-os-js-browser/types";

interface ReferralContext {
  referral: EHR.Referral | undefined;
}

export const VimOSReferralContext = createContext<ReferralContext>({
  referral: undefined,
});

