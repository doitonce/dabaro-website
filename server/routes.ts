import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import path from "path";
import fs from "fs";
import { storage } from "./storage";
import { insertInquirySchema, insertSilverPriceSchema, insertNewsSchema, insertInventorySchema, insertGalleryItemSchema } from "@shared/schema";
import { z } from "zod";
import { getEmailService } from "./email";
import { silverScraper } from "./scraper";
import { newsScraper } from "./news-scraper";
import { chartScraper } from "./chart-scraper";

// Configure multer for file uploads - use permanent directory outside project folder
const uploadDir = process.env.NODE_ENV === 'production' 
  ? '/home/dabaro-gallery-uploads'  // 영구 저장소 (재배포시에도 유지됨)
  : path.join(process.cwd(), 'public', 'uploads');  // 개발용

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log(`[Gallery] Created uploads directory: ${uploadDir}`);
}

const storage_multer = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage_multer,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Contact form submission endpoint
  app.post("/api/contact", async (req, res) => {
    try {
      const validatedData = insertInquirySchema.parse(req.body);
      const inquiry = await storage.createInquiry(validatedData);
      
      // Send email notification
      const emailService = getEmailService();
      if (emailService) {
        try {
          await emailService.sendInquiryNotification(inquiry);
          console.log(`Email notification sent for inquiry ${inquiry.id}`);
        } catch (emailError) {
          console.error('Failed to send email notification:', emailError);
          // Continue without failing the request
        }
      } else {
        console.log('Email service not configured - inquiry saved but no email sent');
      }
      
      res.json({ 
        success: true, 
        message: "문의가 성공적으로 접수되었습니다. 빠른 시일 내에 연락드리겠습니다.",
        id: inquiry.id 
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ 
          success: false, 
          message: "입력 정보를 확인해 주세요.",
          errors: error.errors 
        });
      } else {
        res.status(500).json({ 
          success: false, 
          message: "서버 오류가 발생했습니다. 잠시 후 다시 시도해 주세요." 
        });
      }
    }
  });

  // Get all inquiries (for admin purposes)
  app.get("/api/inquiries", async (req, res) => {
    try {
      const inquiries = await storage.getAllInquiries();
      res.json(inquiries);
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: "문의 목록을 불러오는 중 오류가 발생했습니다." 
      });
    }
  });

  // Silver price endpoints
  app.get("/api/silver-prices", async (req, res) => {
    try {
      const prices = await storage.getAllSilverPrices();
      res.json(prices);
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: "은 공시가 데이터를 불러오는 중 오류가 발생했습니다." 
      });
    }
  });

  app.get("/api/silver-prices/latest", async (req, res) => {
    try {
      const latestPrice = await storage.getLatestSilverPrice();
      if (!latestPrice) {
        res.status(404).json({ 
          success: false, 
          message: "최신 은 공시가 데이터를 찾을 수 없습니다." 
        });
        return;
      }
      res.json(latestPrice);
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: "최신 은 공시가 데이터를 불러오는 중 오류가 발생했습니다." 
      });
    }
  });

  app.post("/api/silver-prices/scrape", async (req, res) => {
    try {
      await silverScraper.scrapeSilverPrice();
      res.json({ 
        success: true, 
        message: "은 공시가 데이터가 성공적으로 업데이트되었습니다." 
      });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: "은 공시가 데이터 업데이트 중 오류가 발생했습니다." 
      });
    }
  });

  // News endpoints
  app.get("/api/news", async (req, res) => {
    try {
      // Get recent news (최근 4개만 가져오기)
      const recentNews = await storage.getRecentNews(4);
      res.json(recentNews);
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: "뉴스 데이터를 불러오는 중 오류가 발생했습니다." 
      });
    }
  });

  app.get("/api/news/all", async (req, res) => {
    try {
      const news = await storage.getAllNews();
      res.json(news);
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: "뉴스 데이터를 불러오는 중 오류가 발생했습니다." 
      });
    }
  });

  // News scraping with rate limiting to prevent abuse
  let lastNewsRefreshTime = 0;
  const NEWS_REFRESH_COOLDOWN = 2 * 60 * 1000; // 2 minutes cooldown

  app.post("/api/news/scrape", async (req, res) => {
    try {
      const now = Date.now();
      
      // Check if enough time has passed since last news refresh
      if (now - lastNewsRefreshTime < NEWS_REFRESH_COOLDOWN) {
        return res.json({ 
          success: true, 
          message: "뉴스가 최근에 업데이트되었습니다." 
        });
      }

      lastNewsRefreshTime = now;
      console.log('Manual news scraping triggered...');
      await newsScraper.scrapeNews();
      
      res.json({ 
        success: true, 
        message: "뉴스 데이터가 성공적으로 업데이트되었습니다." 
      });
    } catch (error) {
      console.error('News scraping error:', error);
      res.status(500).json({ 
        success: false, 
        message: "뉴스 데이터 업데이트 중 오류가 발생했습니다." 
      });
    }
  });

  // Test translation endpoint for debugging
  app.post("/api/news/test-translation", async (req, res) => {
    try {
      const { text } = req.body;
      if (!text) {
        return res.status(400).json({ error: "Text is required" });
      }

      const testTranslation = await newsScraper.translateText(text);
      res.json({ 
        original: text,
        translated: testTranslation,
        hasDeeplKey: !!process.env.DEEPL_API_KEY 
      });
    } catch (error: any) {
      console.error('Translation test error:', error);
      res.status(500).json({ error: error?.message || 'Translation test failed' });
    }
  });

  // Chart endpoints
  app.get("/api/silver-chart", async (req, res) => {
    try {
      const chart = await storage.getLatestSilverChart();
      if (!chart) {
        res.status(404).json({ 
          success: false, 
          message: "차트 데이터를 찾을 수 없습니다." 
        });
        return;
      }
      res.json(chart);
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: "차트 데이터를 불러오는 중 오류가 발생했습니다." 
      });
    }
  });

  app.post("/api/silver-chart/scrape", async (req, res) => {
    try {
      await chartScraper.scrapeChart();
      res.json({ 
        success: true, 
        message: "차트 데이터가 성공적으로 업데이트되었습니다." 
      });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: "차트 데이터 업데이트 중 오류가 발생했습니다." 
      });
    }
  });

  // Inventory endpoints
  app.get("/api/inventory", async (req, res) => {
    try {
      const items = await storage.getAllInventoryItems();
      res.json(items);
    } catch (error: any) {
      console.error("Inventory fetch error:", error);
      res.status(500).json({ 
        success: false, 
        message: "재고 데이터를 불러오는 중 오류가 발생했습니다.",
        error: error?.message || 'Unknown error'
      });
    }
  });

  app.post("/api/inventory", async (req, res) => {
    try {
      console.log("Received inventory data:", req.body);
      const validatedData = insertInventorySchema.parse(req.body);
      console.log("Validated data:", validatedData);
      const item = await storage.createInventoryItem(validatedData);
      res.json({ 
        success: true, 
        message: "재고 항목이 성공적으로 등록되었습니다.",
        data: item 
      });
    } catch (error) {
      console.error("Inventory creation error:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ 
          success: false, 
          message: "입력 정보를 확인해 주세요.",
          errors: error.errors 
        });
      } else {
        res.status(500).json({ 
          success: false, 
          message: "재고 등록 중 오류가 발생했습니다.",
          error: (error as any)?.message || 'Unknown error' 
        });
      }
    }
  });

  app.put("/api/inventory/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertInventorySchema.partial().parse(req.body);
      const item = await storage.updateInventoryItem(id, validatedData);
      res.json({ 
        success: true, 
        message: "재고 항목이 성공적으로 수정되었습니다.",
        data: item 
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ 
          success: false, 
          message: "입력 정보를 확인해 주세요.",
          errors: error.errors 
        });
      } else {
        res.status(500).json({ 
          success: false, 
          message: "재고 수정 중 오류가 발생했습니다." 
        });
      }
    }
  });

  app.delete("/api/inventory/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteInventoryItem(id);
      res.json({ 
        success: true, 
        message: "재고 항목이 성공적으로 삭제되었습니다." 
      });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: "재고 삭제 중 오류가 발생했습니다." 
      });
    }
  });

  // Gallery routes
  // File upload endpoint for gallery images
  app.post("/api/upload", upload.single('image'), (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ 
          success: false, 
          message: "이미지 파일이 없습니다." 
        });
      }
      
      const imageUrl = `/uploads/${req.file.filename}`;
      res.json({ 
        success: true, 
        imageUrl,
        message: "이미지가 성공적으로 업로드되었습니다." 
      });
    } catch (error: any) {
      res.status(500).json({ 
        success: false, 
        message: "이미지 업로드 중 오류가 발생했습니다.",
        error: error.message 
      });
    }
  });

  app.get("/api/gallery", async (req, res) => {
    try {
      const galleryItems = await storage.getAllGalleryItems();
      res.json(galleryItems);
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: "갤러리 조회 중 오류가 발생했습니다." 
      });
    }
  });

  app.get("/api/gallery/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const galleryItem = await storage.getGalleryItem(id);
      if (!galleryItem) {
        return res.status(404).json({ 
          success: false, 
          message: "갤러리 항목을 찾을 수 없습니다." 
        });
      }
      res.json(galleryItem);
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: "갤러리 조회 중 오류가 발생했습니다." 
      });
    }
  });

  app.post("/api/gallery", async (req, res) => {
    try {
      const validatedData = insertGalleryItemSchema.parse(req.body);
      const galleryItem = await storage.createGalleryItem(validatedData);
      res.status(201).json({ 
        success: true, 
        message: "갤러리 항목이 성공적으로 등록되었습니다.",
        data: galleryItem 
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ 
          success: false, 
          message: "입력 정보를 확인해 주세요.",
          errors: error.errors 
        });
      } else {
        res.status(500).json({ 
          success: false, 
          message: "갤러리 등록 중 오류가 발생했습니다." 
        });
      }
    }
  });

  app.put("/api/gallery/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertGalleryItemSchema.partial().parse(req.body);
      const galleryItem = await storage.updateGalleryItem(id, validatedData);
      res.json({ 
        success: true, 
        message: "갤러리 항목이 성공적으로 수정되었습니다.",
        data: galleryItem 
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ 
          success: false, 
          message: "입력 정보를 확인해 주세요.",
          errors: error.errors 
        });
      } else {
        res.status(500).json({ 
          success: false, 
          message: "갤러리 수정 중 오류가 발생했습니다." 
        });
      }
    }
  });

  app.delete("/api/gallery/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteGalleryItem(id);
      res.json({ 
        success: true, 
        message: "갤러리 항목이 성공적으로 삭제되었습니다." 
      });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: "갤러리 삭제 중 오류가 발생했습니다." 
      });
    }
  });

  // Cached refresh to prevent rate limiting
  let lastRefreshTime = 0;
  const REFRESH_COOLDOWN = 5 * 60 * 1000; // 5 minutes cooldown

  // Refresh data endpoint - triggers all scrapers on demand with rate limiting
  app.post("/api/refresh-data", async (req, res) => {
    try {
      const now = Date.now();
      
      // Check if enough time has passed since last refresh
      if (now - lastRefreshTime < REFRESH_COOLDOWN) {
        const remainingTime = Math.ceil((REFRESH_COOLDOWN - (now - lastRefreshTime)) / 1000 / 60);
        return res.json({ 
          success: true, 
          message: `데이터가 최근에 업데이트되었습니다. ${remainingTime}분 후에 다시 시도해주세요.`,
          cached: true,
          lastRefresh: new Date(lastRefreshTime).toISOString()
        });
      }
      
      console.log('Manual data refresh triggered');
      
      // Run all scrapers in parallel with error handling
      const refreshPromises = [
        silverScraper.scrapeSilverPrice().catch(e => console.error('Silver price scraping failed:', e)),
        newsScraper.scrapeNews().catch(e => console.error('News scraping failed:', e)),
        chartScraper.scrapeChart().catch(e => console.error('Chart scraping failed:', e))
      ];
      
      await Promise.allSettled(refreshPromises);
      lastRefreshTime = now;
      
      res.json({ 
        success: true, 
        message: "데이터가 성공적으로 새로고침되었습니다.",
        timestamp: new Date().toISOString(),
        cached: false
      });
    } catch (error) {
      console.error('Error during manual refresh:', error);
      res.status(500).json({ 
        success: false, 
        message: "데이터 새로고침 중 오류가 발생했습니다." 
      });
    }
  });

  // Silver price source testing endpoint
  app.post('/api/silver-sources/test', async (req, res) => {
    try {
      const sources = [
        { name: 'YC Metal', url: 'http://www.ycmetal.co.kr/price/price02.php' },
        { name: 'LT Metal', url: 'https://www.ltmetal.co.kr/kr/5_customer/sub_sg_list.html' },
        { name: 'SY Metal', url: 'http://www.symetal.net/bbs/board.php?w=u&bo_table=table49&sca=%EA%B3%A0%EC%8B%9C%EA%B0%80%EC%A0%95%EB%B3%B4' }
      ];
      
      const results = [];
      
      for (const source of sources) {
        try {
          console.log(`Testing ${source.name}...`);
          const startTime = Date.now();
          
          // Test each source's scraper method
          let success = false;
          if (source.name === 'YC Metal') {
            success = await silverScraper.scrapeYCMetal(source.url);
          } else if (source.name === 'LT Metal') {
            success = await silverScraper.scrapeLTMetal(source.url);
          } else if (source.name === 'SY Metal') {
            success = await silverScraper.scrapeSYMetal(source.url);
          }
          
          const duration = Date.now() - startTime;
          results.push({
            source: source.name,
            url: source.url,
            status: success ? 'success' : 'failed',
            duration: `${duration}ms`,
            error: null
          });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          results.push({
            source: source.name,
            url: source.url,
            status: 'error',
            duration: '0ms',
            error: errorMessage
          });
        }
      }
      
      res.json({
        success: true,
        message: '은가격 소스 테스트 완료',
        results
      });
    } catch (error) {
      console.error('Source testing error:', error);
      res.status(500).json({
        success: false,
        message: '소스 테스트 중 오류 발생'
      });
    }
  });

  // SEO Routes - Force HTTPS for sitemap and robots
  app.get("/sitemap.xml", (req, res) => {
    console.log(`[Sitemap] Request from: ${req.ip}, User-Agent: ${req.get('User-Agent')?.substring(0, 50)}`);
    console.log(`[Sitemap] Protocol: ${req.protocol}, Secure: ${req.secure}, X-Forwarded-Proto: ${req.get('x-forwarded-proto')}`);
    
    // Force HTTPS redirect for SEO files
    if (process.env.NODE_ENV === 'production' && !req.secure && req.get('x-forwarded-proto') !== 'https') {
      console.log(`[Sitemap] Redirecting to HTTPS: https://${req.get('host')}/sitemap.xml`);
      return res.redirect(301, `https://${req.get('host')}/sitemap.xml`);
    }
    
    console.log(`[Sitemap] Serving sitemap.xml with Content-Type: application/xml`);
    res.type('application/xml');
    res.header('Cache-Control', 'public, max-age=3600'); // 1 hour cache
    res.sendFile(path.join(process.cwd(), 'public', 'sitemap.xml'));
  });

  app.get("/robots.txt", (req, res) => {
    console.log(`[Robots] Request from: ${req.ip}, User-Agent: ${req.get('User-Agent')?.substring(0, 50)}`);
    
    // Force HTTPS redirect for SEO files
    if (process.env.NODE_ENV === 'production' && !req.secure && req.get('x-forwarded-proto') !== 'https') {
      console.log(`[Robots] Redirecting to HTTPS: https://${req.get('host')}/robots.txt`);
      return res.redirect(301, `https://${req.get('host')}/robots.txt`);
    }
    
    console.log(`[Robots] Serving robots.txt with Content-Type: text/plain`);
    res.type('text/plain');
    res.header('Cache-Control', 'public, max-age=3600'); // 1 hour cache
    res.sendFile(path.join(process.cwd(), 'public', 'robots.txt'));
  });



  const httpServer = createServer(app);
  
  // Scrapers are now triggered on-demand when accessing the homepage
  // No automatic scheduling on server startup
  
  return httpServer;
}
