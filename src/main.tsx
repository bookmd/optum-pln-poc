import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { AppWrapper } from "./AppWrapper.tsx";
import "./globals.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppSettingsWrapper } from "./AppSettingsWrapper.tsx";
import { LaunchHandler } from "./components/LaunchHandler.tsx";
import ThankYou from "./components/ThankYou.tsx";

createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <Routes>
      <Route
        path="/"
        element={
          <AppWrapper>
            <App />
          </AppWrapper>
        }
      />
      <Route path="/launch" element={<LaunchHandler />} />
      <Route path="/settings" element={<AppSettingsWrapper />} />
      <Route
        path="/thank-you"
        element={
          <AppWrapper>
            <ThankYou />
          </AppWrapper>
        }
      />
    </Routes>
  </BrowserRouter>
);
