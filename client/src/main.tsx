import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { GeminiProvider } from "./contexts/gemini-context";
import { ThemeProvider } from "./contexts/theme-context";

createRoot(document.getElementById("root")!).render(
  <ThemeProvider>
    <GeminiProvider>
      <App />
    </GeminiProvider>
  </ThemeProvider>
);
