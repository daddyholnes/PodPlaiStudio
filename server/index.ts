import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { validateConfig, GEMINI_API_KEY } from "./config";
import os from "os";

// Debug environment variables and API key check
console.log("===================== ENVIRONMENT VERIFICATION =====================");
console.log("Node.js process.env.GEMINI_API_KEY exists:", !!process.env.GEMINI_API_KEY);
console.log("GEMINI_API_KEY value:", GEMINI_API_KEY ? `${GEMINI_API_KEY.substring(0, 4)}...` : "Not found");
console.log("GEMINI_API_KEY length:", GEMINI_API_KEY?.length || 0);

// Try alternative ways to access environment variables
try {
  const envVars = Object.keys(process.env).filter(key => !key.includes('KEY') && !key.includes('TOKEN'));
  console.log("Available environment variables:", envVars.join(", "));
  
  if (process.env.GEMINI_API_KEY) {
    console.log("API key successfully loaded from process.env");
  } else {
    console.log("API key not found in process.env");
  }
} catch (error) {
  console.error("Error accessing environment variables:", error);
}
console.log("===================================================================");

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
