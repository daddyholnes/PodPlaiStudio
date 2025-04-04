import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { GeminiProvider } from "./contexts/gemini-context";

createRoot(document.getElementById("root")!).render(
  <GeminiProvider>
    <App />
  </GeminiProvider>
);
