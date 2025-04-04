import { createRoot } from "react-dom/client";
import { StrictMode } from "react";
import App from "./App";
import "./index.css";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";

// Create a wrapper with QueryClientProvider only, other providers are in App.tsx
function AppWithProviders() {
  return (
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </StrictMode>
  );
}

// Use the wrapper for rendering
createRoot(document.getElementById("root")!).render(<AppWithProviders />);
