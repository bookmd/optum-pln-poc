import { createContext } from "react";
import { EHR } from "vim-os-js-browser/types";

interface OrderContext {
  orders: EHR.Order[] | undefined;
}

export const VimOSOrdersContext = createContext<OrderContext>({
  orders: undefined,
});

