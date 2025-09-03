import express, { type Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import path from "path";
import https from "https";
import fs from "fs";
import { registerRoutes } from "./routes";
// Production build - no vite needed
export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit", 
    second: "2-digit",
    hour12: true,
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
import { initializeEmailService } from "./email";
import { dataCleanupService } from "./data-cleanup";
import { silverScraper } from "./scraper";

const app = express();

// Trust proxy setting for proper IP detection behind reverse proxies
app.set('trust proxy', 1);

// Simplified request handling for Cafe24 hosting
app.use((req, res, next) => {
  // No automatic redirects - let Cafe24 handle HTTPS if configured
  next();
});

// Security middleware
app.use(helmet({
  // Disable CSP temporarily for production deployment debugging
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
  crossOriginOpenerPolicy: false,
  crossOriginResourcePolicy: false,
}));

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://dabaro0432.cafe24.com', 'http://dabaro0432.cafe24.com', 'http://dabaro0432.cafe24.com:4000']
    : ['http://localhost:5000', 'http://127.0.0.1:5000', 'http://localhost:4000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting - relaxed for development and production
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'development' ? 1000 : 500, // increased for production
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for static assets in all environments
    return !!req.url.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$/);
  }
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'development' ? 500 : 200, // increased for production
  message: 'Too many API requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', apiLimiter);
app.use(limiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

// Serve uploaded files statically from permanent directory
const uploadsPath = process.env.NODE_ENV === 'production' 
  ? '/home/dabaro-gallery-uploads'  // 영구 저장소 (재배포시에도 유지됨)
  : path.join(process.cwd(), 'public', 'uploads');  // 개발용

if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
  console.log('[Gallery] Created permanent uploads directory:', uploadsPath);
}
app.use('/uploads', express.static(uploadsPath));

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
  try {
    // Initialize email service
    initializeEmailService();
    
    // Start scheduled data cleanup
    dataCleanupService.startScheduledCleanup();
    
    // Start scheduled silver price scraping
    silverScraper.startScheduledScraping();
    
    // Google Search Console verification file
    app.get('/googled89fa426649c79ad.html', (_req, res) => {
      res.type('text/plain');
      res.send('google-site-verification: googled89fa426649c79ad.html');
    });

    // Health check endpoint
    app.get('/health', (_req, res) => {
      res.status(200).json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
      });
    });

    // Test database connection if using database storage
    if (process.env.DATABASE_URL) {
      try {
        const { testConnection } = await import('./db.js');
        const isConnected = await testConnection();
        if (isConnected) {
          console.log('[Server] Database connection verified');
        } else {
          console.warn('[Server] Database connection failed, but continuing with fallback storage');
        }
      } catch (dbError) {
        console.warn('[Server] Database test failed:', dbError);
        console.log('[Server] Continuing with memory storage fallback');
      }
    }

    const server = await registerRoutes(app);

    // Frontend serving - Production only (성공했던 7/27 버전 방식)
    // Serve static files from dist/public
    app.use(express.static(path.join(process.cwd(), 'dist', 'public')));
    
    // Handle all other routes by serving index.html (SPA fallback)
    app.get('*', (_req, res) => {
      res.sendFile(path.join(process.cwd(), 'dist', 'public', 'index.html'));
    });

    // Development vs Production routing handled above

    // Port configuration for Cafe24 hosting:
    // - Development: HTTP on port 5000
    // - Production: HTTP on port 4000 (HTTPS handled by external proxy if needed)
    
    // HTTP 서버 (Cafe24 호환: 포트 4000)
    const port = process.env.PORT ? parseInt(process.env.PORT) : (process.env.NODE_ENV === 'production' ? 4000 : 5000);
    // Enhanced error handling (must be last middleware)
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      
      // Log error in production
      if (process.env.NODE_ENV === 'production') {
        console.error('Error:', {
          status,
          message,
          stack: err.stack,
          url: _req.url,
          method: _req.method,
          timestamp: new Date().toISOString()
        });
      }

      res.status(status).json({ 
        message: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : message 
      });
    });

    server.listen({
      port,
      host: "0.0.0.0",
      reusePort: true,
    }, () => {
      const serverType = process.env.NODE_ENV === 'production' ? 'HTTP server (Cafe24 hosting)' : 'HTTP server';
      log(`${serverType} running on port ${port}`);
    });
  } catch (startupError) {
    console.error('[Server] Critical startup error:', startupError);
    console.log('[Server] Attempting to start with minimal configuration...');
    
    // Fallback startup with minimal configuration
    try {
      const { createServer } = await import('http');
      const fallbackServer = createServer(app);
      
      const port = process.env.PORT ? parseInt(process.env.PORT) : (process.env.NODE_ENV === 'production' ? 4000 : 5000);
      fallbackServer.listen(port, "0.0.0.0", () => {
        log(`fallback server running on port ${port}`);
      });
    } catch (fallbackError) {
      console.error('[Server] Fallback startup also failed:', fallbackError);
      process.exit(1);
    }
  }
})();
