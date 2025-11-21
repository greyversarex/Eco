import 'dotenv/config';
import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import compression from "compression";
import cors from "cors";
import helmet from "helmet";
import http from "http";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { pool } from "./db";

const app = express();

const isProduction = process.env.NODE_ENV === 'production';

// CRITICAL: Trust proxy ALWAYS (required for Nginx with secure cookies)
// Without this, secure: true breaks authorization on HTTPS->HTTP proxied connections
app.set('trust proxy', 1);

// ============================================================================
// HELMET CONFIGURATION - Permissive for iframe/mobile compatibility
// ============================================================================
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: false,
  crossOriginOpenerPolicy: false,
  frameguard: false,
}));

// ============================================================================
// CORS CONFIGURATION - Bulletproof for PWA/Android/Nginx
// ============================================================================
app.use(cors({
  origin: (origin, callback) => {
    // List of allowed origins from environment or fallback
    const allowedOrigins = process.env.ALLOWED_ORIGINS
      ?.split(',')
      .map(o => o.trim())
      .filter(o => o.length > 0) || [];

    // Development: allow all origins (including no origin)
    if (!isProduction) {
      callback(null, true);
      return;
    }

    // Production: strict origin checking
    // Allow requests WITHOUT origin header (native mobile apps, Capacitor)
    if (!origin) {
      callback(null, true);
      return;
    }

    // Allow wildcard (if explicitly set)
    if (allowedOrigins.includes('*')) {
      callback(null, true);
      return;
    }

    // Check if origin is in allowed list
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    // Reject unauthorized origins
    log(`[CORS] Blocked origin: ${origin}`);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true, // CRITICAL: Allow cookies to be sent
  exposedHeaders: ['set-cookie', 'Content-Type'],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 3600,
}));

// ============================================================================
// COMPRESSION CONFIGURATION
// ============================================================================
app.use(compression({
  filter: (req: Request, res: Response) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  },
  threshold: 1024,
  level: 6,
}));

// ============================================================================
// BODY PARSERS
// ============================================================================
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// ============================================================================
// SESSION CONFIGURATION - Bulletproof for Nginx + HTTPS + PWA/Android
// ============================================================================
const PgSession = connectPgSimple(session);

if (!process.env.SESSION_SECRET) {
  throw new Error('SESSION_SECRET environment variable must be set');
}

app.use(
  session({
    store: new PgSession({
      pool: pool,
      tableName: 'sessions',
      createTableIfMissing: true,
    }),
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    // CRITICAL: proxy: true tells Express that cookies are set correctly via X-Forwarded-* headers
    proxy: true,
    cookie: {
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      httpOnly: true, // Prevent JavaScript access (security)
      // secure: true = HTTPS only (required for production behind Nginx)
      // sameSite: 'lax' = Allow cookies in cross-site requests from links but not form submissions
      secure: isProduction, // true for HTTPS, false for local HTTP
      sameSite: 'lax', // 'lax' is most compatible with Android PWA/native apps
      // Domain matching for subdomain compatibility (if needed, set explicitly)
      // domain: process.env.COOKIE_DOMAIN,
      path: '/',
    },
  })
);

// ============================================================================
// REQUEST LOGGING MIDDLEWARE
// ============================================================================
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

// ============================================================================
// DIAGNOSTIC LOGGING FOR PUSH NOTIFICATIONS
// ============================================================================
// Log cookies and origin specifically for push subscription endpoint
app.use((req, res, next) => {
  if (req.path === '/api/push/subscribe' && req.method === 'POST') {
    const cookies = req.headers.cookie || 'NO_COOKIE_HEADER';
    const origin = req.get('origin') || 'NO_ORIGIN_HEADER';
    const xForwardedFor = req.get('x-forwarded-for') || 'NONE';
    const userAgent = req.get('user-agent') || 'UNKNOWN';
    
    log(
      `[PUSH_SUBSCRIBE] Origin: ${origin} | IP: ${xForwardedFor} | ` +
      `Cookies: ${cookies.substring(0, 50)}... | UA: ${userAgent.substring(0, 40)}...`
    );

    // Log session info
    if ((req as any).session && (req as any).session.passport) {
      log(`[PUSH_SUBSCRIBE] Session found - User: ${JSON.stringify((req as any).session.passport.user)}`);
    } else if ((req as any).session) {
      log(`[PUSH_SUBSCRIBE] Session found but no passport info`);
    } else {
      log(`[PUSH_SUBSCRIBE] NO SESSION FOUND`);
    }
  }

  next();
});

// ============================================================================
// ROUTE REGISTRATION & ERROR HANDLING
// ============================================================================
(async () => {
  registerRoutes(app);
  const server = http.createServer(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // Setup Vite in development, serve static files in production
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Start server
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
