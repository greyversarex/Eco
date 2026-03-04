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

// ============================================================================
// TRUST PROXY - КРИТИЧНО для работы за Nginx
// ============================================================================
// Обязательно включить trust proxy для корректной работы secure cookies и IP forwarding
app.set('trust proxy', 1);

// ============================================================================
// HELMET - Разрешающая конфигурация для PWA/Mobile/iframe
// ============================================================================
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: false,
  crossOriginOpenerPolicy: false,
  frameguard: false,
}));

// ============================================================================
// CORS - МАКСИМАЛЬНО РАЗРЕШАЮЩИЙ для PWA/Android/iOS
// ============================================================================
// ВНИМАНИЕ: origin: true разрешает ВСЕ origins (включая cross-origin PWA/WebView)
// Это необходимо для Mobile PWA, но для дополнительной безопасности в production
// можно настроить переменную окружения ALLOWED_ORIGINS (через запятую)
app.use(cors({
  origin: true, // Разрешить ВСЕ origins (критично для PWA/Mobile)
  credentials: true, // КРИТИЧНО: разрешить отправку cookies
  exposedHeaders: ['set-cookie', 'Content-Type'],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie', 'X-Requested-With'],
  maxAge: 3600,
}));

// ============================================================================
// SESSION - КРИТИЧНО: Должен быть ДО body parsers!
// ============================================================================
const PgSession = connectPgSimple(session);

if (!process.env.SESSION_SECRET) {
  throw new Error('SESSION_SECRET environment variable must be set');
}

// Определить HTTPS режим (production ИЛИ явно установлен env флаг для staging/mobile testing)
// HTTPS режим включает secure cookies + sameSite:'none' для поддержки PWA/Mobile
const isHTTPS = isProduction || process.env.FORCE_HTTPS === 'true';

if (isHTTPS) {
  log('🔒 HTTPS mode enabled: secure cookies + sameSite:none (PWA/Mobile support)');
} else {
  log('⚠️  HTTP mode: secure:false + sameSite:lax (local development only)');
  log('⚠️  For PWA/Mobile testing set FORCE_HTTPS=true or use NODE_ENV=production');
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
    // Rolling sessions - обновлять cookie при каждом запросе
    rolling: true,
    // КРИТИЧНО: proxy: true для работы за Nginx
    proxy: true,
    cookie: {
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 дней
      httpOnly: true, // Защита от XSS
      // КРИТИЧНО для PWA/WebView:
      // HTTPS mode (production/staging):
      //   - secure: true + sameSite: 'none' = поддержка cross-site PWA/Mobile
      // HTTP mode (local dev):
      //   - secure: false + sameSite: 'lax' = работает без HTTPS
      // 
      // Для staging с HTTPS: установить FORCE_HTTPS=true ИЛИ NODE_ENV=production
      secure: isHTTPS, // true для HTTPS, false для HTTP
      sameSite: isHTTPS ? 'none' : 'lax', // 'none' для PWA (требует HTTPS), 'lax' для local dev
      path: '/',
    },
  })
);

// ============================================================================
// COMPRESSION
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
// DISABLE ETAG FOR AUTH ROUTES - Prevent 304 caching issues
// ============================================================================
app.use('/api/auth', (req, res, next) => {
  // Disable ETag for all auth routes to prevent stale cache responses
  app.set('etag', false);
  res.removeHeader('ETag');
  next();
});

// ============================================================================
// BODY PARSERS - ПОСЛЕ session middleware
// ============================================================================
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

// ============================================================================
// REQUEST LOGGING
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
// DIAGNOSTIC LOGGING для Push Notifications
// ============================================================================
app.use((req, res, next) => {
  // Логировать все /api/push запросы для диагностики
  if (req.path.startsWith('/api/push')) {
    const cookies = req.headers.cookie ? 'YES' : 'NO';
    const origin = req.get('origin') || 'NO_ORIGIN';
    const userAgent = req.get('user-agent')?.substring(0, 50) || 'UNKNOWN';
    const req_any = req as any;
    
    log(
      `[PUSH] ${req.method} ${req.path} | Origin: ${origin} | Cookies: ${cookies}`
    );

    // Логировать session перед обработкой middleware
    if (req_any.session) {
      const sessionInfo = {
        id: req_any.session?.id ? 'YES' : 'NO',
        departmentId: req_any.session?.departmentId || null,
        adminId: req_any.session?.adminId || null,
      };
      log(`[PUSH] Session: ${JSON.stringify(sessionInfo)}`);
    } else {
      log(`[PUSH] ❌ NO SESSION OBJECT`);
    }
  }

  next();
});

// ============================================================================
// ROUTES & ERROR HANDLING
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

  // Vite в development, статика в production
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Ensure document_types has category column
  try {
    await pool.query(`ALTER TABLE document_types ADD COLUMN IF NOT EXISTS category text DEFAULT 'message' NOT NULL`);
  } catch (e) {
    log('Category column check: ' + (e as Error).message);
  }

  // Auto-seed assignment document types on startup
  try {
    const assignmentTypes = [
      { name: 'Супоришҳои Роҳбарият', order: 0 },
      { name: 'Протоколҳои чаласаи назоратӣ', order: 1 },
      { name: 'Протоколҳои ҳайяти мушовара', order: 2 },
      { name: 'Кумита - иҷрои нақша / чорабиниҳо', order: 3 },
      { name: 'Ҳукумат - иҷрои нақша / чорабиниҳо', order: 4 },
    ];
    for (const dt of assignmentTypes) {
      await pool.query(
        `INSERT INTO document_types (name, category, sort_order, is_active)
         VALUES ($1, 'assignment', $2, true)
         ON CONFLICT (name) DO UPDATE SET category = 'assignment'
         WHERE document_types.category != 'assignment'`,
        [dt.name, dt.order]
      );
    }
    log('Assignment document types seeded/updated');

    // Migrate old assignmentType field to documentTypeId
    const typeMapping = [
      { oldType: 'protocol_supervisory', name: 'Протоколҳои чаласаи назоратӣ' },
      { oldType: 'protocol_advisory', name: 'Протоколҳои ҳайяти мушовара' },
      { oldType: 'action_plan', name: 'Кумита - иҷрои нақша / чорабиниҳо' },
    ];
    for (const mapping of typeMapping) {
      await pool.query(
        `UPDATE assignments SET document_type_id = (SELECT id FROM document_types WHERE name = $1)
         WHERE assignment_type = $2 AND document_type_id IS NULL`,
        [mapping.name, mapping.oldType]
      );
    }
    log('Assignments migrated to document type IDs');
  } catch (e) {
    log('Could not seed document types: ' + (e as Error).message);
  }

  // Запуск сервера
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
