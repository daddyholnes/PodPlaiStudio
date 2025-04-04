import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { GeminiProvider } from "./contexts/gemini-context";
import { ThemeProvider } from "./contexts/theme-context";
import { ConversationsProvider } from "./contexts/conversations-context";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <GeminiProvider>
        <ConversationsProvider>
          <App />
        </ConversationsProvider>
      </GeminiProvider>
    </ThemeProvider>
  </QueryClientProvider>
);
