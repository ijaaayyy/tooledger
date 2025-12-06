import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";

const app = express();
const httpServer = createServer(app);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false }));

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

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

      log(logLine);
    }
  });

  next();
});

(async () => {
  await registerRoutes(httpServer, app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || "5000", 10);
  // prefer an explicit HOST env var; default to localhost to avoid
  // environments where binding to 0.0.0.0 is unsupported
  const host = process.env.HOST || "127.0.0.1";

  // Try listening. If the environment disallows the requested host
  // (eg. ENOTSUP on 0.0.0.0 in some sandboxes), retry on localhost.
  let attemptedHost = host;

  const tryListen = (listenHost?: string) => {
    if (!listenHost) {
      // let Node pick the address — avoids ENOTSUP in some sandboxes
      return httpServer.listen(port, () => {
        log(`serving on ${port}`);
      });
    }

    // use hostname form when a host is explicitly requested
    return httpServer.listen(port, listenHost, () => {
      log(`serving on ${listenHost}:${port}`);
    });
  };

  // Handle asynchronous listen errors (prevents uncaught 'error' events)
  httpServer.on("error", (err: any) => {
    if (err && (err.code === "ENOTSUP" || err.code === "EADDRNOTAVAIL")) {
      if (attemptedHost !== "127.0.0.1") {
        log(`failed to bind to ${attemptedHost}:${port} (${err.code}), retrying without host`);
        attemptedHost = undefined as unknown as string;
        tryListen();
        return;
      }
    }

    console.error(err);
    process.exit(1);
  });

  // initial listen attempt (try without host first, then with host)
  try {
    // Try without specifying host first
    attemptedHost = undefined as unknown as string;
    tryListen();
  } catch (err: any) {
    // If that fails synchronously, retry with the configured host
    if (err && (err.code === "ENOTSUP" || err.code === "EADDRNOTAVAIL")) {
      log(`initial bind without host failed (${err.code}), retrying on ${host}`);
      attemptedHost = host;
      tryListen(host);
    } else {
      throw err;
    }
  }
})();
