var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  galleryItems: () => galleryItems,
  inquiries: () => inquiries,
  insertGalleryItemSchema: () => insertGalleryItemSchema,
  insertInquirySchema: () => insertInquirySchema,
  insertInventorySchema: () => insertInventorySchema,
  insertNewsSchema: () => insertNewsSchema,
  insertSilverChartSchema: () => insertSilverChartSchema,
  insertSilverPriceSchema: () => insertSilverPriceSchema,
  insertUserSchema: () => insertUserSchema,
  inventory: () => inventory,
  news: () => news,
  silverCharts: () => silverCharts,
  silverPrices: () => silverPrices,
  users: () => users
});
import { pgTable, text, serial, integer, boolean, timestamp, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
var users, inquiries, silverPrices, news, silverCharts, inventory, galleryItems, insertUserSchema, insertInquirySchema, insertSilverPriceSchema, insertNewsSchema, insertSilverChartSchema, insertInventorySchema, insertGalleryItemSchema;
var init_schema = __esm({
  "shared/schema.ts"() {
    "use strict";
    users = pgTable("users", {
      id: serial("id").primaryKey(),
      username: text("username").notNull().unique(),
      password: text("password").notNull()
    });
    inquiries = pgTable("inquiries", {
      id: serial("id").primaryKey(),
      name: text("name").notNull(),
      company: text("company"),
      phone: text("phone").notNull(),
      email: text("email").notNull(),
      inquiryType: text("inquiry_type").notNull(),
      message: text("message").notNull(),
      createdAt: timestamp("created_at").notNull().defaultNow(),
      status: text("status").notNull().default("pending")
      // pending, processed, resolved
    });
    silverPrices = pgTable("silver_prices", {
      id: serial("id").primaryKey(),
      date: text("date").notNull().unique(),
      priceKrw: integer("price_krw").notNull(),
      priceUsd: integer("price_usd").notNull(),
      priceOunce: integer("price_ounce").notNull(),
      createdAt: timestamp("created_at").notNull().defaultNow(),
      updatedAt: timestamp("updated_at").notNull().defaultNow()
    });
    news = pgTable("news", {
      id: serial("id").primaryKey(),
      title: text("title").notNull(),
      description: text("description"),
      url: text("url").notNull(),
      source: text("source").notNull(),
      publishedAt: timestamp("published_at").notNull(),
      category: text("category").notNull().default("precious-metals"),
      createdAt: timestamp("created_at").notNull().defaultNow()
    });
    silverCharts = pgTable("silver_charts", {
      id: serial("id").primaryKey(),
      imageUrl: text("image_url").notNull(),
      imageData: text("image_data").notNull(),
      lastUpdated: timestamp("last_updated").notNull().defaultNow(),
      createdAt: timestamp("created_at").notNull().defaultNow()
    });
    inventory = pgTable("inventory", {
      id: serial("id").primaryKey(),
      itemName: text("item_name").notNull(),
      silverContent: integer("silver_content").notNull(),
      // 은함량 %
      specification: text("specification").notNull(),
      isRolled: boolean("is_rolled").notNull().default(false),
      // 압연재 여부
      quantityKg: numeric("quantity_kg", { precision: 10, scale: 2 }).notNull(),
      // Kg units
      createdAt: timestamp("created_at").notNull().defaultNow(),
      updatedAt: timestamp("updated_at").notNull().defaultNow()
    });
    galleryItems = pgTable("gallery_items", {
      id: serial("id").primaryKey(),
      title: text("title").notNull(),
      description: text("description"),
      imageUrl: text("image_url").notNull(),
      displayOrder: integer("display_order").default(0).notNull(),
      isActive: boolean("is_active").default(true).notNull(),
      createdAt: timestamp("created_at").notNull().defaultNow(),
      updatedAt: timestamp("updated_at").notNull().defaultNow()
    });
    insertUserSchema = createInsertSchema(users).pick({
      username: true,
      password: true
    });
    insertInquirySchema = createInsertSchema(inquiries).pick({
      name: true,
      company: true,
      phone: true,
      email: true,
      inquiryType: true,
      message: true
    });
    insertSilverPriceSchema = createInsertSchema(silverPrices).pick({
      date: true,
      priceKrw: true,
      priceUsd: true,
      priceOunce: true
    });
    insertNewsSchema = createInsertSchema(news).pick({
      title: true,
      description: true,
      url: true,
      source: true,
      publishedAt: true,
      category: true
    }).extend({
      description: z.string().optional(),
      category: z.string().optional()
    });
    insertSilverChartSchema = createInsertSchema(silverCharts).pick({
      imageUrl: true,
      imageData: true
    }).extend({
      lastUpdated: z.date().optional()
    });
    insertInventorySchema = z.object({
      itemName: z.string().min(1),
      silverContent: z.number().int().min(1).max(100),
      specification: z.string().min(1),
      isRolled: z.boolean().default(false),
      quantityKg: z.number().positive()
    });
    insertGalleryItemSchema = createInsertSchema(galleryItems).pick({
      title: true,
      description: true,
      imageUrl: true,
      displayOrder: true,
      isActive: true
    }).extend({
      description: z.string().optional(),
      displayOrder: z.number().int().min(0).default(0),
      isActive: z.boolean().default(true)
    });
  }
});

// server/db.ts
var db_exports = {};
__export(db_exports, {
  db: () => db,
  pool: () => pool,
  testConnection: () => testConnection
});
import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
async function testConnection() {
  try {
    const client = await pool.connect();
    await client.query("SELECT 1");
    client.release();
    console.log("[Database] Connection test successful");
    return true;
  } catch (error) {
    console.error("[Database] Connection test failed:", error);
    return false;
  }
}
var pool, db;
var init_db = __esm({
  "server/db.ts"() {
    "use strict";
    init_schema();
    neonConfig.webSocketConstructor = ws;
    if (!process.env.DATABASE_URL) {
      throw new Error(
        "DATABASE_URL must be set. Did you forget to provision a database?"
      );
    }
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 1,
      // Optimize for serverless functions
      idleTimeoutMillis: 3e4,
      // 30 seconds
      connectionTimeoutMillis: 15e3,
      // 15 seconds timeout
      maxUses: 100,
      // Limit connection reuse
      allowExitOnIdle: false
    });
    pool.on("error", (err) => {
      console.error("[Database Pool] Connection error:", err.message);
    });
    pool.on("connect", () => {
      console.log("[Database Pool] New client connected");
    });
    pool.on("remove", () => {
      console.log("[Database Pool] Client removed");
    });
    db = drizzle({ client: pool, schema: schema_exports });
  }
});

// server/index.ts
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import path2 from "path";
import fs2 from "fs";

// server/routes.ts
import { createServer } from "http";
import multer from "multer";
import path from "path";
import fs from "fs";

// server/storage.ts
init_schema();
init_db();
import { eq, desc } from "drizzle-orm";
var DatabaseStorage = class {
  async withErrorHandling(operation, fallback, retries = 2) {
    let lastError;
    for (let attempt = 1; attempt <= retries + 1; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        const errorMsg = error instanceof Error ? error.message : String(error);
        const errorCode = error && typeof error === "object" && "code" in error ? error.code : "UNKNOWN";
        console.error(`[DatabaseStorage] Attempt ${attempt} failed - Code: ${errorCode}, Message: ${errorMsg}`);
        if (attempt <= retries) {
          await new Promise((resolve) => setTimeout(resolve, attempt * 1e3));
        }
      }
    }
    console.error("[DatabaseStorage] All retry attempts failed");
    if (fallback !== void 0) {
      return fallback;
    }
    throw lastError;
  }
  async getUser(id) {
    return this.withErrorHandling(async () => {
      console.log("[DatabaseStorage] Fetching user with id:", id);
      const [user] = await db.select().from(users).where(eq(users.id, id));
      return user || void 0;
    }, void 0);
  }
  async getUserByUsername(username) {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || void 0;
  }
  async createUser(insertUser) {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }
  async createInquiry(insertInquiry) {
    const [inquiry] = await db.insert(inquiries).values(insertInquiry).returning();
    return inquiry;
  }
  async getAllInquiries() {
    return await db.select().from(inquiries).orderBy(desc(inquiries.createdAt));
  }
  async getInquiry(id) {
    const [inquiry] = await db.select().from(inquiries).where(eq(inquiries.id, id));
    return inquiry || void 0;
  }
  async createOrUpdateSilverPrice(insertSilverPrice) {
    try {
      const [silverPrice] = await db.insert(silverPrices).values(insertSilverPrice).returning();
      return silverPrice;
    } catch (error) {
      const [updatedPrice] = await db.update(silverPrices).set({
        ...insertSilverPrice,
        updatedAt: /* @__PURE__ */ new Date()
      }).where(eq(silverPrices.date, insertSilverPrice.date)).returning();
      return updatedPrice;
    }
  }
  async getAllSilverPrices() {
    try {
      console.log("[DatabaseStorage] Fetching all silver prices...");
      const prices = await db.select().from(silverPrices).orderBy(desc(silverPrices.date));
      console.log("[DatabaseStorage] Retrieved", prices.length, "silver prices");
      return prices;
    } catch (error) {
      console.error("[DatabaseStorage] Error fetching all silver prices:", error);
      throw error;
    }
  }
  async getLatestSilverPrice() {
    try {
      console.log("[DatabaseStorage] Fetching latest silver price...");
      const [latestPrice] = await db.select().from(silverPrices).orderBy(desc(silverPrices.date)).limit(1);
      console.log("[DatabaseStorage] Latest price result:", latestPrice ? `Found: ${latestPrice.date}` : "Not found");
      return latestPrice || void 0;
    } catch (error) {
      console.error("[DatabaseStorage] Error fetching latest silver price:", error);
      throw error;
    }
  }
  async createNews(insertNews) {
    const [newsItem] = await db.insert(news).values(insertNews).returning();
    return newsItem;
  }
  async getAllNews() {
    return db.select().from(news).orderBy(desc(news.publishedAt));
  }
  async getRecentNews(limit = 10) {
    return db.select().from(news).orderBy(desc(news.publishedAt)).limit(limit);
  }
  async clearAllNews() {
    await db.delete(news);
  }
  async updateSilverChart(insertChart) {
    await db.delete(silverCharts);
    const [chart] = await db.insert(silverCharts).values(insertChart).returning();
    return chart;
  }
  async getLatestSilverChart() {
    const [chart] = await db.select().from(silverCharts).orderBy(desc(silverCharts.lastUpdated)).limit(1);
    return chart || void 0;
  }
  async createInventoryItem(insertInventory) {
    const inventoryData = {
      ...insertInventory,
      quantityKg: insertInventory.quantityKg.toString()
    };
    const [item] = await db.insert(inventory).values(inventoryData).returning();
    return item;
  }
  async getAllInventoryItems() {
    return db.select().from(inventory).orderBy(desc(inventory.createdAt));
  }
  async getInventoryItem(id) {
    const [item] = await db.select().from(inventory).where(eq(inventory.id, id));
    return item || void 0;
  }
  async updateInventoryItem(id, updateData) {
    const updatePayload = {
      ...updateData,
      updatedAt: /* @__PURE__ */ new Date()
    };
    if (updateData.quantityKg !== void 0) {
      updatePayload.quantityKg = updateData.quantityKg.toString();
    }
    const [item] = await db.update(inventory).set(updatePayload).where(eq(inventory.id, id)).returning();
    return item;
  }
  async deleteInventoryItem(id) {
    await db.delete(inventory).where(eq(inventory.id, id));
  }
  async createGalleryItem(insertGalleryItem) {
    return this.withErrorHandling(async () => {
      console.log("[DatabaseStorage] Creating gallery item...");
      const [item] = await db.insert(galleryItems).values(insertGalleryItem).returning();
      return item;
    });
  }
  async getAllGalleryItems() {
    return this.withErrorHandling(async () => {
      console.log("[DatabaseStorage] Fetching all gallery items...");
      const items = await db.select().from(galleryItems).where(eq(galleryItems.isActive, true)).orderBy(galleryItems.displayOrder, galleryItems.createdAt);
      console.log(`[DatabaseStorage] Retrieved ${items.length} gallery items`);
      return items;
    }, []);
  }
  async getGalleryItem(id) {
    return this.withErrorHandling(async () => {
      console.log(`[DatabaseStorage] Fetching gallery item with id: ${id}`);
      const [item] = await db.select().from(galleryItems).where(eq(galleryItems.id, id)).limit(1);
      return item;
    });
  }
  async updateGalleryItem(id, updateData) {
    return this.withErrorHandling(async () => {
      console.log(`[DatabaseStorage] Updating gallery item with id: ${id}`);
      const updatePayload = {
        ...updateData,
        updatedAt: /* @__PURE__ */ new Date()
      };
      const [item] = await db.update(galleryItems).set(updatePayload).where(eq(galleryItems.id, id)).returning();
      return item;
    });
  }
  async deleteGalleryItem(id) {
    return this.withErrorHandling(async () => {
      console.log(`[DatabaseStorage] Deleting gallery item with id: ${id}`);
      await db.delete(galleryItems).where(eq(galleryItems.id, id));
    });
  }
};
var MemStorage = class {
  users;
  inquiries;
  silverPrices;
  newsItems;
  silverCharts = null;
  inventoryItems;
  galleryItems;
  currentUserId;
  currentInquiryId;
  currentSilverPriceId;
  currentNewsId;
  currentInventoryId;
  currentGalleryId;
  constructor() {
    this.users = /* @__PURE__ */ new Map();
    this.inquiries = /* @__PURE__ */ new Map();
    this.silverPrices = /* @__PURE__ */ new Map();
    this.newsItems = /* @__PURE__ */ new Map();
    this.silverCharts = null;
    this.inventoryItems = /* @__PURE__ */ new Map();
    this.galleryItems = /* @__PURE__ */ new Map();
    this.currentUserId = 1;
    this.currentInquiryId = 1;
    this.currentSilverPriceId = 1;
    this.currentNewsId = 1;
    this.currentInventoryId = 1;
    this.currentGalleryId = 1;
    this.initializeSampleData();
  }
  initializeSampleData() {
    const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0].replace(/-/g, "/");
    const samplePrice = {
      id: this.currentSilverPriceId++,
      date: today,
      priceKrw: 156868,
      priceUsd: 1788,
      priceOunce: 49186,
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    };
    this.silverPrices.set(today, samplePrice);
    const sampleInventory = {
      id: this.currentInventoryId++,
      itemName: "S-30",
      silverContent: 30,
      specification: "\uC740\uD568\uB7C9 30% \uBE0C\uB808\uC774\uC9D5 \uD569\uAE08",
      isRolled: false,
      quantityKg: "150.5",
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    };
    this.inventoryItems.set(sampleInventory.id, sampleInventory);
    const now = /* @__PURE__ */ new Date();
    const sampleNews = {
      id: this.currentNewsId++,
      title: "\uC740 \uAC00\uACA9 \uB3D9\uD5A5 \uBD84\uC11D",
      description: "\uCD5C\uADFC \uC740 \uC2DC\uC7A5\uC758 \uAC00\uACA9 \uBCC0\uB3D9 \uBD84\uC11D \uBC0F \uC804\uB9DD",
      url: "#",
      source: "\uB2E4\uBC14\uB85C",
      publishedAt: now,
      category: "precious-metals",
      createdAt: now
    };
    this.newsItems.set(sampleNews.id, sampleNews);
  }
  async getUser(id) {
    return this.users.get(id);
  }
  async getUserByUsername(username) {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }
  async createUser(insertUser) {
    const id = this.currentUserId++;
    const user = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  async createInquiry(insertInquiry) {
    const id = this.currentInquiryId++;
    const inquiry = {
      id,
      name: insertInquiry.name,
      company: insertInquiry.company || null,
      phone: insertInquiry.phone,
      email: insertInquiry.email,
      inquiryType: insertInquiry.inquiryType,
      message: insertInquiry.message,
      createdAt: /* @__PURE__ */ new Date(),
      status: "pending"
    };
    this.inquiries.set(id, inquiry);
    return inquiry;
  }
  async getAllInquiries() {
    return Array.from(this.inquiries.values()).sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );
  }
  async getInquiry(id) {
    return this.inquiries.get(id);
  }
  async createOrUpdateSilverPrice(insertSilverPrice) {
    const existing = this.silverPrices.get(insertSilverPrice.date);
    if (existing) {
      const updated = {
        ...existing,
        priceKrw: insertSilverPrice.priceKrw,
        priceUsd: insertSilverPrice.priceUsd,
        priceOunce: insertSilverPrice.priceOunce,
        updatedAt: /* @__PURE__ */ new Date()
      };
      this.silverPrices.set(insertSilverPrice.date, updated);
      return updated;
    } else {
      const id = this.currentSilverPriceId++;
      const silverPrice = {
        id,
        ...insertSilverPrice,
        createdAt: /* @__PURE__ */ new Date(),
        updatedAt: /* @__PURE__ */ new Date()
      };
      this.silverPrices.set(insertSilverPrice.date, silverPrice);
      return silverPrice;
    }
  }
  async getAllSilverPrices() {
    return Array.from(this.silverPrices.values()).sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }
  async getLatestSilverPrice() {
    const prices = await this.getAllSilverPrices();
    return prices[0] || void 0;
  }
  async createNews(insertNews) {
    const id = this.currentNewsId++;
    const newsItem = {
      id,
      title: insertNews.title,
      description: insertNews.description || null,
      url: insertNews.url,
      source: insertNews.source,
      publishedAt: insertNews.publishedAt,
      category: insertNews.category || "precious-metals",
      createdAt: /* @__PURE__ */ new Date()
    };
    this.newsItems.set(id, newsItem);
    return newsItem;
  }
  async getAllNews() {
    return Array.from(this.newsItems.values()).sort(
      (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    );
  }
  async getRecentNews(limit = 10) {
    const allNews = await this.getAllNews();
    return allNews.slice(0, limit);
  }
  async clearAllNews() {
    this.newsItems.clear();
  }
  async updateSilverChart(insertChart) {
    const id = 1;
    const chart = {
      id,
      imageUrl: insertChart.imageUrl,
      imageData: insertChart.imageData,
      lastUpdated: insertChart.lastUpdated || /* @__PURE__ */ new Date(),
      createdAt: /* @__PURE__ */ new Date()
    };
    this.silverCharts = chart;
    return chart;
  }
  async getLatestSilverChart() {
    return this.silverCharts || void 0;
  }
  async createInventoryItem(insertInventory) {
    const id = this.currentInventoryId++;
    const item = {
      id,
      itemName: insertInventory.itemName,
      silverContent: insertInventory.silverContent,
      specification: insertInventory.specification,
      isRolled: insertInventory.isRolled,
      quantityKg: insertInventory.quantityKg.toString(),
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    };
    this.inventoryItems.set(id, item);
    return item;
  }
  async getAllInventoryItems() {
    return Array.from(this.inventoryItems.values()).sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );
  }
  async getInventoryItem(id) {
    return this.inventoryItems.get(id);
  }
  async updateInventoryItem(id, updateData) {
    const existing = this.inventoryItems.get(id);
    if (!existing) {
      throw new Error(`Inventory item with id ${id} not found`);
    }
    const updated = {
      ...existing,
      itemName: updateData.itemName ?? existing.itemName,
      silverContent: updateData.silverContent ?? existing.silverContent,
      specification: updateData.specification ?? existing.specification,
      isRolled: updateData.isRolled ?? existing.isRolled,
      quantityKg: updateData.quantityKg !== void 0 ? updateData.quantityKg.toString() : existing.quantityKg,
      updatedAt: /* @__PURE__ */ new Date()
    };
    this.inventoryItems.set(id, updated);
    return updated;
  }
  async deleteInventoryItem(id) {
    this.inventoryItems.delete(id);
  }
  async createGalleryItem(insertGalleryItem) {
    const id = this.currentGalleryId++;
    const item = {
      id,
      title: insertGalleryItem.title,
      description: insertGalleryItem.description || null,
      imageUrl: insertGalleryItem.imageUrl,
      displayOrder: insertGalleryItem.displayOrder || 0,
      isActive: insertGalleryItem.isActive !== false,
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    };
    this.galleryItems.set(id, item);
    return item;
  }
  async getAllGalleryItems() {
    return Array.from(this.galleryItems.values()).filter((item) => item.isActive).sort((a, b) => a.displayOrder - b.displayOrder || a.createdAt.getTime() - b.createdAt.getTime());
  }
  async getGalleryItem(id) {
    return this.galleryItems.get(id);
  }
  async updateGalleryItem(id, updateData) {
    const existing = this.galleryItems.get(id);
    if (!existing) {
      throw new Error(`Gallery item with id ${id} not found`);
    }
    const updated = {
      ...existing,
      ...updateData,
      updatedAt: /* @__PURE__ */ new Date()
    };
    this.galleryItems.set(id, updated);
    return updated;
  }
  async deleteGalleryItem(id) {
    this.galleryItems.delete(id);
  }
};
console.log("[Storage Init] DATABASE_URL exists:", !!process.env.DATABASE_URL);
console.log("[Storage Init] NODE_ENV:", process.env.NODE_ENV);
var storageInstance;
if (process.env.DATABASE_URL) {
  try {
    console.log("[Storage Init] Attempting to use DatabaseStorage");
    storageInstance = new DatabaseStorage();
  } catch (error) {
    console.warn("[Storage Init] DatabaseStorage failed, falling back to MemStorage:", error);
    storageInstance = new MemStorage();
  }
} else {
  console.log("[Storage Init] Using MemStorage (no DATABASE_URL)");
  storageInstance = new MemStorage();
}
var storage = storageInstance;

// server/routes.ts
init_schema();
import { z as z2 } from "zod";

// server/email.ts
import nodemailer from "nodemailer";
var EmailService = class {
  transporter;
  companyEmail;
  constructor(config, companyEmail) {
    this.companyEmail = companyEmail;
    this.transporter = nodemailer.createTransport(config);
  }
  async sendInquiryNotification(inquiry) {
    try {
      const recipients = [
        process.env.EMAIL_USER,
        // Gmail account
        "dabaro0432@naver.com"
        // Naver account
      ].filter(Boolean);
      console.log("Sending email to recipients:", recipients);
      const mailOptions = {
        from: this.companyEmail,
        to: recipients,
        subject: `[\uB2E4\uBC14\uB85C] \uC0C8\uB85C\uC6B4 \uBB38\uC758: ${inquiry.inquiryType}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb; border-bottom: 2px solid #2563eb; padding-bottom: 10px;">
              \uC0C8\uB85C\uC6B4 \uBB38\uC758\uAC00 \uC811\uC218\uB418\uC5C8\uC2B5\uB2C8\uB2E4
            </h2>
            
            <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #1e40af; margin-top: 0;">\uBB38\uC758 \uC815\uBCF4</h3>
              
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; font-weight: bold; width: 120px;">\uC774\uB984:</td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${inquiry.name}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; font-weight: bold;">\uD68C\uC0AC\uBA85:</td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${inquiry.company}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; font-weight: bold;">\uC5F0\uB77D\uCC98:</td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${inquiry.phone}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; font-weight: bold;">\uC774\uBA54\uC77C:</td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${inquiry.email}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; font-weight: bold;">\uBB38\uC758 \uC720\uD615:</td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${inquiry.inquiryType}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; vertical-align: top;">\uBB38\uC758 \uB0B4\uC6A9:</td>
                  <td style="padding: 8px 0;">${inquiry.message.replace(/\n/g, "<br>")}</td>
                </tr>
              </table>
            </div>
            
            <div style="background-color: #ecfdf5; border: 1px solid #10b981; border-radius: 8px; padding: 15px; margin: 20px 0;">
              <p style="margin: 0; color: #065f46;">
                <strong>\uC811\uC218 \uC2DC\uAC04:</strong> ${new Date(inquiry.createdAt).toLocaleString("ko-KR")}
              </p>
            </div>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px;">
              <p>\uC774 \uBA54\uC77C\uC740 \uB2E4\uBC14\uB85C \uD648\uD398\uC774\uC9C0 \uBB38\uC758 \uD3FC\uC5D0\uC11C \uC790\uB3D9\uC73C\uB85C \uBC1C\uC1A1\uB418\uC5C8\uC2B5\uB2C8\uB2E4.</p>
            </div>
          </div>
        `,
        replyTo: inquiry.email
      };
      const result = await this.transporter.sendMail(mailOptions);
      console.log("Email sent successfully:", {
        messageId: result?.messageId,
        accepted: result?.accepted,
        rejected: result?.rejected,
        recipients
      });
      return true;
    } catch (error) {
      console.error("Email sending failed:", error);
      return false;
    }
  }
  async verifyConnection() {
    try {
      await this.transporter.verify();
      return true;
    } catch (error) {
      console.error("Email service verification failed:", error);
      return false;
    }
  }
};
var emailService = null;
function initializeEmailService() {
  const emailHost = process.env.EMAIL_HOST;
  const emailPort = process.env.EMAIL_PORT;
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;
  const companyEmail = process.env.COMPANY_EMAIL || "dabaro0432@naver.com";
  if (!emailHost || !emailPort || !emailUser || !emailPass) {
    console.warn("Email configuration incomplete. Email service disabled.");
    return null;
  }
  const config = {
    host: emailHost,
    port: parseInt(emailPort),
    secure: parseInt(emailPort) === 465,
    auth: {
      user: emailUser,
      pass: emailPass
    }
  };
  console.log(`Initializing email service with host: ${emailHost}, port: ${emailPort}, user: ${emailUser}`);
  console.log(`Secure mode: ${parseInt(emailPort) === 465}`);
  emailService = new EmailService(config, companyEmail);
  return emailService;
}
function getEmailService() {
  return emailService;
}

// server/scraper.ts
import * as cheerio from "cheerio";
import * as cron from "node-cron";
var SilverPriceScraper = class {
  SOURCES = [
    {
      name: "YC Metal",
      url: "http://www.ycmetal.co.kr/price/price02.php",
      scraper: this.scrapeYCMetal.bind(this)
    },
    {
      name: "LT Metal",
      url: "https://www.ltmetal.co.kr/kr/5_customer/sub_sg_list.html",
      scraper: this.scrapeLTMetal.bind(this)
    },
    {
      name: "SY Metal",
      url: "http://www.symetal.net/bbs/board.php?w=u&bo_table=table49&sca=%EA%B3%A0%EC%8B%9C%EA%B0%80%EC%A0%95%EB%B3%B4",
      scraper: this.scrapeSYMetal.bind(this)
    }
  ];
  async scrapeSilverPrice() {
    console.log("Starting silver price scraping with fallback system...");
    for (const source of this.SOURCES) {
      try {
        console.log(`\uC2DC\uB3C4 \uC911: ${source.name} (${source.url})`);
        const result = await source.scraper(source.url);
        if (result) {
          console.log(`\u2705 ${source.name}\uC5D0\uC11C \uC740\uAC00\uACA9 \uB370\uC774\uD130 \uC218\uC9D1 \uC131\uACF5`);
          return;
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.log(`\u274C ${source.name} \uC2A4\uD06C\uB798\uD551 \uC2E4\uD328:`, errorMessage);
        continue;
      }
    }
    console.error("\u26A0\uFE0F \uBAA8\uB4E0 \uC740\uAC00\uACA9 \uC18C\uC2A4\uC5D0\uC11C \uB370\uC774\uD130 \uC218\uC9D1 \uC2E4\uD328");
  }
  // 기존 YC Metal 스크래퍼 (테스트용 public 메서드)
  async scrapeYCMetal(url) {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
        "Cache-Control": "no-cache"
      }
    });
    if (!response.ok) {
      if (response.status === 429) {
        console.log("Rate limited by YC Metal, trying next source");
        return false;
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const html = await response.text();
    const $ = cheerio.load(html);
    const table = $("table.tb-style3");
    if (table.length === 0) {
      throw new Error("YC Metal: Price table not found");
    }
    const firstRow = table.find("tr").eq(1);
    if (firstRow.length === 0) {
      throw new Error("YC Metal: No price data found");
    }
    const cells = firstRow.find("td");
    if (cells.length < 4) {
      throw new Error("YC Metal: Incomplete price data");
    }
    const date = $(cells[0]).text().trim();
    const priceKrw = parseInt($(cells[1]).text().trim().replace(/,/g, ""), 10);
    const priceUsd = parseInt($(cells[2]).text().trim().replace(/,/g, ""), 10);
    const priceOunce = parseInt($(cells[3]).text().trim().replace(/,/g, ""), 10);
    if (isNaN(priceKrw) || isNaN(priceUsd) || isNaN(priceOunce)) {
      throw new Error("YC Metal: Invalid price data format");
    }
    return await this.savePriceData(date, priceKrw, priceUsd, priceOunce, "YC Metal");
  }
  // LT Metal 스크래퍼 (테스트용 public 메서드)
  async scrapeLTMetal(baseUrl) {
    const now = /* @__PURE__ */ new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const url = `${baseUrl}?m_year=${year}&m_month=${month}&type=111`;
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
        "Cache-Control": "no-cache"
      }
    });
    if (!response.ok) {
      throw new Error(`LT Metal HTTP error! status: ${response.status}`);
    }
    const html = await response.text();
    const $ = cheerio.load(html);
    const rows = $("table tr").filter((i, row) => {
      const text2 = $(row).text();
      return text2.includes("2025.") && !text2.includes("AVG");
    });
    if (rows.length === 0) {
      throw new Error("LT Metal: No valid price data found");
    }
    for (let i = 0; i < rows.length; i++) {
      const cells = $(rows[i]).find("td");
      if (cells.length >= 4) {
        const date = $(cells[0]).text().trim().replace(/\./g, "/");
        const priceOunceText = $(cells[1]).text().trim();
        const priceKrwText = $(cells[2]).text().trim();
        const exchangeRateText = $(cells[3]).text().trim();
        const priceOunce = parseFloat(priceOunceText.replace(/,/g, ""));
        const priceKrw = parseInt(priceKrwText.replace(/,/g, ""), 10);
        const exchangeRate = parseFloat(exchangeRateText.replace(/,/g, ""));
        if (priceOunce > 0 && priceKrw > 0 && exchangeRate > 0) {
          const priceUsd = Math.round(priceKrw / exchangeRate * 1e3);
          return await this.savePriceData(date, priceKrw, priceUsd, Math.round(priceOunce * 1e3), "LT Metal");
        }
      }
    }
    throw new Error("LT Metal: No valid non-zero price data found");
  }
  // SY Metal 스크래퍼 (테스트용 public 메서드)
  async scrapeSYMetal(url) {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
        "Cache-Control": "no-cache",
        "Referer": "http://www.symetal.net/"
      }
    });
    if (!response.ok) {
      throw new Error(`SY Metal HTTP error! status: ${response.status}`);
    }
    const html = await response.text();
    const $ = cheerio.load(html);
    const tables = $("table");
    for (let i = 0; i < tables.length; i++) {
      const table = $(tables[i]);
      const rows = table.find("tr");
      for (let j = 0; j < rows.length; j++) {
        const row = $(rows[j]);
        const text2 = row.text();
        if (text2.includes("\uC740") || text2.includes("Ag") || text2.includes("silver")) {
          const cells = row.find("td");
          if (cells.length >= 3) {
            const dateText = $(cells[0]).text().trim();
            const priceText = $(cells[1]).text().trim();
            if (dateText.match(/202[4-9]/) && priceText.match(/\d+/)) {
              const priceKrw = parseInt(priceText.replace(/[^0-9]/g, ""), 10);
              if (priceKrw > 0) {
                const priceUsd = Math.round(priceKrw / 1400);
                const priceOunce = Math.round(priceKrw * 31.1);
                return await this.savePriceData(dateText, priceKrw, priceUsd, priceOunce, "SY Metal");
              }
            }
          }
        }
      }
    }
    throw new Error("SY Metal: No silver price data found");
  }
  // 공통 데이터 저장 함수
  async savePriceData(date, priceKrw, priceUsd, priceOunce, source) {
    const dateObj = new Date(date.replace(/\//g, "-"));
    const dayOfWeek = dateObj.getDay();
    if (dayOfWeek >= 1 && dayOfWeek <= 5) {
      await storage.createOrUpdateSilverPrice({
        date,
        priceKrw,
        priceUsd,
        priceOunce
      });
      console.log(`\uC740\uAC00\uACA9 \uC5C5\uB370\uC774\uD2B8 \uC644\uB8CC (${source}): ${date} - KRW: ${priceKrw}, USD: ${priceUsd}, Ounce: ${priceOunce}`);
      return true;
    } else {
      console.log(`\uC8FC\uB9D0 \uB370\uC774\uD130 \uC2A4\uD0B5 (${source}): ${date} (\uAC70\uB798\uC77C\uC774 \uC544\uB2D8)`);
      return true;
    }
  }
  // 평일 오전 9:30-10:30 20분 단위 자동 갱신 스케줄
  startScheduledScraping() {
    cron.schedule("30 9 * * 1-5", () => {
      console.log("\uC740\uAC00\uACA9 \uC790\uB3D9 \uAC31\uC2E0 \uC2DC\uC791 (09:30)");
      this.scrapeSilverPrice().catch(console.error);
    }, {
      timezone: "Asia/Seoul"
    });
    cron.schedule("50 9 * * 1-5", () => {
      console.log("\uC740\uAC00\uACA9 \uC790\uB3D9 \uAC31\uC2E0 \uC2DC\uC791 (09:50)");
      this.scrapeSilverPrice().catch(console.error);
    }, {
      timezone: "Asia/Seoul"
    });
    cron.schedule("10 10 * * 1-5", () => {
      console.log("\uC740\uAC00\uACA9 \uC790\uB3D9 \uAC31\uC2E0 \uC2DC\uC791 (10:10)");
      this.scrapeSilverPrice().catch(console.error);
    }, {
      timezone: "Asia/Seoul"
    });
    cron.schedule("30 10 * * 1-5", () => {
      console.log("\uC740\uAC00\uACA9 \uC790\uB3D9 \uAC31\uC2E0 \uC2DC\uC791 (10:30)");
      this.scrapeSilverPrice().catch(console.error);
    }, {
      timezone: "Asia/Seoul"
    });
    console.log("\uC740\uAC00\uACA9 \uC790\uB3D9 \uAC31\uC2E0 \uC2A4\uCF00\uC904\uC774 \uC2DC\uC791\uB418\uC5C8\uC2B5\uB2C8\uB2E4 (\uD3C9\uC77C 9:30-10:30, 20\uBD84 \uAC04\uACA9)");
  }
};
var silverScraper = new SilverPriceScraper();

// server/news-scraper.ts
import * as cheerio2 from "cheerio";
var NewsScraper = class {
  KITCO_NEWS_URL = "https://www.kitco.com/news";
  DEEPL_API_KEY = process.env.DEEPL_API_KEY;
  constructor() {
    console.log("News scraper initialized for Kitco.com");
  }
  async scrapeNews() {
    try {
      console.log("Starting Kitco news scraping...");
      await storage.clearAllNews();
      console.log("Cleared old news data");
      const response = await fetch(this.KITCO_NEWS_URL, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9",
          "Cache-Control": "no-cache"
        }
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch Kitco news: ${response.status}`);
      }
      const html = await response.text();
      const $ = cheerio2.load(html);
      let articleCount = 0;
      const articles = [];
      console.log("Extracting main featured news from Kitco...");
      const contentContainer = $("main, .main-content, .content, .news-content, #content").first();
      if (contentContainer.length > 0) {
        console.log("Found main content container");
        contentContainer.find("h1, h2, h3").each((index, element) => {
          if (articles.length >= 4) return false;
          const $heading = $(element);
          const title = $heading.text().trim();
          let $link = $heading.find("a").first();
          if ($link.length === 0) {
            $link = $heading.closest("a");
          }
          if ($link.length === 0) {
            $link = $heading.parent().find("a").first();
          }
          if ($link.length === 0) {
            $link = $heading.siblings("a").first();
          }
          const href = $link.attr("href");
          if (title && href && title.length > 20) {
            const url = href.startsWith("http") ? href : `https://www.kitco.com${href}`;
            const $container = $heading.closest("div, article, section");
            let description = $container.find("p").first().text().trim();
            if (!description) {
              description = $heading.parent().next("p").text().trim();
            }
            if (!description) {
              description = $heading.siblings("p").first().text().trim();
            }
            if (!articles.find((a) => a.title === title || a.url === url)) {
              articles.push({
                title: title.substring(0, 255),
                description: description ? description.substring(0, 500) : void 0,
                url,
                source: "Kitco.com",
                publishedAt: /* @__PURE__ */ new Date(),
                category: "precious-metals"
              });
              console.log(`Found main story: ${title.substring(0, 50)}...`);
            }
          }
        });
      }
      if (articles.length < 4) {
        console.log("Searching for additional news articles...");
        const newsLinks = [];
        $("a").each((index, element) => {
          const $link = $(element);
          const href = $link.attr("href");
          const text2 = $link.text().trim();
          if (href && text2 && (href.includes("/news/") || href.includes("/commentary/") || href.includes("/analysis/")) && text2.length > 20 && text2.length < 400) {
            const url = href.startsWith("http") ? href : `https://www.kitco.com${href}`;
            const $linkContainer = $link.closest("div, article, section");
            const containerClasses = $linkContainer.attr("class") || "";
            const isMainContent = !containerClasses.includes("sidebar") && !containerClasses.includes("side") && !containerClasses.includes("widget");
            newsLinks.push({
              title: text2,
              url,
              isMainContent,
              element: $link
            });
          }
        });
        newsLinks.sort((a, b) => {
          if (a.isMainContent && !b.isMainContent) return -1;
          if (!a.isMainContent && b.isMainContent) return 1;
          return 0;
        });
        for (const newsLink of newsLinks) {
          if (articles.length >= 4) break;
          if (!articles.find((a) => a.title === newsLink.title || a.url === newsLink.url)) {
            const $container = newsLink.element.closest("div, article");
            const description = $container.find("p").first().text().trim() || $container.siblings("p").first().text().trim();
            articles.push({
              title: newsLink.title.substring(0, 255),
              description: description ? description.substring(0, 500) : void 0,
              url: newsLink.url,
              source: "Kitco.com",
              publishedAt: /* @__PURE__ */ new Date(),
              category: "precious-metals"
            });
            console.log(`Found news link: ${newsLink.title.substring(0, 50)}...`);
          }
        }
      }
      console.log(`Total articles found: ${articles.length}`);
      for (const article of articles) {
        try {
          const translatedTitle = await this.translateText(article.title);
          const translatedDescription = article.description ? await this.translateText(article.description) : void 0;
          const translatedArticle = {
            ...article,
            title: translatedTitle || article.title,
            description: translatedDescription || article.description
          };
          await storage.createNews(translatedArticle);
        } catch (error) {
          console.error("Error storing article:", error);
          try {
            await storage.createNews(article);
          } catch (fallbackError) {
            console.error("Error storing fallback article:", fallbackError);
          }
        }
      }
      console.log(`Kitco news scraping completed. Collected ${articles.length} articles`);
    } catch (error) {
      console.error("Error during Kitco news scraping:", error);
    }
  }
  async translateText(text2) {
    if (!this.DEEPL_API_KEY) {
      console.warn("DEEPL_API_KEY not found. Skipping translation.");
      return null;
    }
    try {
      const response = await fetch("https://api-free.deepl.com/v2/translate", {
        method: "POST",
        headers: {
          "Authorization": `DeepL-Auth-Key ${this.DEEPL_API_KEY}`,
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: new URLSearchParams({
          text: text2,
          source_lang: "EN",
          target_lang: "KO"
        })
      });
      if (!response.ok) {
        console.error(`DeepL API error: ${response.status}`);
        return null;
      }
      const data = await response.json();
      return data.translations?.[0]?.text || null;
    } catch (error) {
      console.error("Translation error:", error);
      return null;
    }
  }
  // Removed scheduled scraping - now only triggers on demand
  // The scrapeNews() method can still be called manually when needed
};
var newsScraper = new NewsScraper();

// server/chart-scraper.ts
var ChartScraper = class {
  KITCO_API_URL = "https://www.kitco.com/market/";
  constructor() {
    console.log("Chart scraper initialized");
  }
  async scrapeChart() {
    try {
      console.log("Starting silver chart scraping...");
      const chartSources = [
        {
          name: "Kitco",
          url: "https://www.kitco.com/chart-images/images/live/silver.gif",
          description: "Kitco Live Silver Chart"
        }
      ];
      for (const source of chartSources) {
        try {
          console.log(`Trying ${source.name} chart...`);
          const imageResponse = await fetch(source.url, {
            headers: {
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
              "Accept": "image/png,image/jpeg,image/*,*/*;q=0.8",
              "Accept-Language": "en-US,en;q=0.9",
              "Cache-Control": "no-cache"
            }
          });
          if (!imageResponse.ok) {
            console.log(`${source.name} failed with status: ${imageResponse.status}`);
            continue;
          }
          const contentType = imageResponse.headers.get("content-type");
          if (!contentType || !contentType.startsWith("image/")) {
            console.log(`${source.name} returned non-image content: ${contentType}`);
            continue;
          }
          const imageBuffer = await imageResponse.arrayBuffer();
          if (imageBuffer.byteLength < 1e3) {
            console.log(`${source.name} returned suspiciously small image: ${imageBuffer.byteLength} bytes`);
            continue;
          }
          const base64Image = Buffer.from(imageBuffer).toString("base64");
          await storage.updateSilverChart({
            imageUrl: source.url,
            imageData: base64Image,
            lastUpdated: /* @__PURE__ */ new Date()
          });
          console.log(`Silver chart updated successfully from ${source.name}`);
          return;
        } catch (sourceError) {
          console.log(`${source.name} failed:`, sourceError.message);
          continue;
        }
      }
      throw new Error("All chart sources failed");
    } catch (error) {
      console.error("Error scraping silver chart:", error);
    }
  }
  // Removed scheduled scraping - now only triggers on demand
  // The scrapeChart() method can still be called manually when needed
};
var chartScraper = new ChartScraper();

// server/routes.ts
var uploadDir = process.env.NODE_ENV === "production" ? "/home/dabaro-gallery-uploads" : path.join(process.cwd(), "public", "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log(`[Gallery] Created uploads directory: ${uploadDir}`);
}
var storage_multer = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
var upload = multer({
  storage: storage_multer,
  limits: {
    fileSize: 5 * 1024 * 1024
    // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  }
});
async function registerRoutes(app2) {
  app2.post("/api/contact", async (req, res) => {
    try {
      const validatedData = insertInquirySchema.parse(req.body);
      const inquiry = await storage.createInquiry(validatedData);
      const emailService2 = getEmailService();
      if (emailService2) {
        try {
          await emailService2.sendInquiryNotification(inquiry);
          console.log(`Email notification sent for inquiry ${inquiry.id}`);
        } catch (emailError) {
          console.error("Failed to send email notification:", emailError);
        }
      } else {
        console.log("Email service not configured - inquiry saved but no email sent");
      }
      res.json({
        success: true,
        message: "\uBB38\uC758\uAC00 \uC131\uACF5\uC801\uC73C\uB85C \uC811\uC218\uB418\uC5C8\uC2B5\uB2C8\uB2E4. \uBE60\uB978 \uC2DC\uC77C \uB0B4\uC5D0 \uC5F0\uB77D\uB4DC\uB9AC\uACA0\uC2B5\uB2C8\uB2E4.",
        id: inquiry.id
      });
    } catch (error) {
      if (error instanceof z2.ZodError) {
        res.status(400).json({
          success: false,
          message: "\uC785\uB825 \uC815\uBCF4\uB97C \uD655\uC778\uD574 \uC8FC\uC138\uC694.",
          errors: error.errors
        });
      } else {
        res.status(500).json({
          success: false,
          message: "\uC11C\uBC84 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4. \uC7A0\uC2DC \uD6C4 \uB2E4\uC2DC \uC2DC\uB3C4\uD574 \uC8FC\uC138\uC694."
        });
      }
    }
  });
  app2.get("/api/inquiries", async (req, res) => {
    try {
      const inquiries2 = await storage.getAllInquiries();
      res.json(inquiries2);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "\uBB38\uC758 \uBAA9\uB85D\uC744 \uBD88\uB7EC\uC624\uB294 \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4."
      });
    }
  });
  app2.get("/api/silver-prices", async (req, res) => {
    try {
      const prices = await storage.getAllSilverPrices();
      res.json(prices);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "\uC740 \uACF5\uC2DC\uAC00 \uB370\uC774\uD130\uB97C \uBD88\uB7EC\uC624\uB294 \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4."
      });
    }
  });
  app2.get("/api/silver-prices/latest", async (req, res) => {
    try {
      const latestPrice = await storage.getLatestSilverPrice();
      if (!latestPrice) {
        res.status(404).json({
          success: false,
          message: "\uCD5C\uC2E0 \uC740 \uACF5\uC2DC\uAC00 \uB370\uC774\uD130\uB97C \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4."
        });
        return;
      }
      res.json(latestPrice);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "\uCD5C\uC2E0 \uC740 \uACF5\uC2DC\uAC00 \uB370\uC774\uD130\uB97C \uBD88\uB7EC\uC624\uB294 \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4."
      });
    }
  });
  app2.post("/api/silver-prices/scrape", async (req, res) => {
    try {
      await silverScraper.scrapeSilverPrice();
      res.json({
        success: true,
        message: "\uC740 \uACF5\uC2DC\uAC00 \uB370\uC774\uD130\uAC00 \uC131\uACF5\uC801\uC73C\uB85C \uC5C5\uB370\uC774\uD2B8\uB418\uC5C8\uC2B5\uB2C8\uB2E4."
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "\uC740 \uACF5\uC2DC\uAC00 \uB370\uC774\uD130 \uC5C5\uB370\uC774\uD2B8 \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4."
      });
    }
  });
  app2.get("/api/news", async (req, res) => {
    try {
      const recentNews = await storage.getRecentNews(4);
      res.json(recentNews);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "\uB274\uC2A4 \uB370\uC774\uD130\uB97C \uBD88\uB7EC\uC624\uB294 \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4."
      });
    }
  });
  app2.get("/api/news/all", async (req, res) => {
    try {
      const news2 = await storage.getAllNews();
      res.json(news2);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "\uB274\uC2A4 \uB370\uC774\uD130\uB97C \uBD88\uB7EC\uC624\uB294 \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4."
      });
    }
  });
  let lastNewsRefreshTime = 0;
  const NEWS_REFRESH_COOLDOWN = 2 * 60 * 1e3;
  app2.post("/api/news/scrape", async (req, res) => {
    try {
      const now = Date.now();
      if (now - lastNewsRefreshTime < NEWS_REFRESH_COOLDOWN) {
        return res.json({
          success: true,
          message: "\uB274\uC2A4\uAC00 \uCD5C\uADFC\uC5D0 \uC5C5\uB370\uC774\uD2B8\uB418\uC5C8\uC2B5\uB2C8\uB2E4."
        });
      }
      lastNewsRefreshTime = now;
      console.log("Manual news scraping triggered...");
      await newsScraper.scrapeNews();
      res.json({
        success: true,
        message: "\uB274\uC2A4 \uB370\uC774\uD130\uAC00 \uC131\uACF5\uC801\uC73C\uB85C \uC5C5\uB370\uC774\uD2B8\uB418\uC5C8\uC2B5\uB2C8\uB2E4."
      });
    } catch (error) {
      console.error("News scraping error:", error);
      res.status(500).json({
        success: false,
        message: "\uB274\uC2A4 \uB370\uC774\uD130 \uC5C5\uB370\uC774\uD2B8 \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4."
      });
    }
  });
  app2.post("/api/news/test-translation", async (req, res) => {
    try {
      const { text: text2 } = req.body;
      if (!text2) {
        return res.status(400).json({ error: "Text is required" });
      }
      const testTranslation = await newsScraper.translateText(text2);
      res.json({
        original: text2,
        translated: testTranslation,
        hasDeeplKey: !!process.env.DEEPL_API_KEY
      });
    } catch (error) {
      console.error("Translation test error:", error);
      res.status(500).json({ error: error?.message || "Translation test failed" });
    }
  });
  app2.get("/api/silver-chart", async (req, res) => {
    try {
      const chart = await storage.getLatestSilverChart();
      if (!chart) {
        res.status(404).json({
          success: false,
          message: "\uCC28\uD2B8 \uB370\uC774\uD130\uB97C \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4."
        });
        return;
      }
      res.json(chart);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "\uCC28\uD2B8 \uB370\uC774\uD130\uB97C \uBD88\uB7EC\uC624\uB294 \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4."
      });
    }
  });
  app2.post("/api/silver-chart/scrape", async (req, res) => {
    try {
      await chartScraper.scrapeChart();
      res.json({
        success: true,
        message: "\uCC28\uD2B8 \uB370\uC774\uD130\uAC00 \uC131\uACF5\uC801\uC73C\uB85C \uC5C5\uB370\uC774\uD2B8\uB418\uC5C8\uC2B5\uB2C8\uB2E4."
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "\uCC28\uD2B8 \uB370\uC774\uD130 \uC5C5\uB370\uC774\uD2B8 \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4."
      });
    }
  });
  app2.get("/api/inventory", async (req, res) => {
    try {
      const items = await storage.getAllInventoryItems();
      res.json(items);
    } catch (error) {
      console.error("Inventory fetch error:", error);
      res.status(500).json({
        success: false,
        message: "\uC7AC\uACE0 \uB370\uC774\uD130\uB97C \uBD88\uB7EC\uC624\uB294 \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4.",
        error: error?.message || "Unknown error"
      });
    }
  });
  app2.post("/api/inventory", async (req, res) => {
    try {
      console.log("Received inventory data:", req.body);
      const validatedData = insertInventorySchema.parse(req.body);
      console.log("Validated data:", validatedData);
      const item = await storage.createInventoryItem(validatedData);
      res.json({
        success: true,
        message: "\uC7AC\uACE0 \uD56D\uBAA9\uC774 \uC131\uACF5\uC801\uC73C\uB85C \uB4F1\uB85D\uB418\uC5C8\uC2B5\uB2C8\uB2E4.",
        data: item
      });
    } catch (error) {
      console.error("Inventory creation error:", error);
      if (error instanceof z2.ZodError) {
        res.status(400).json({
          success: false,
          message: "\uC785\uB825 \uC815\uBCF4\uB97C \uD655\uC778\uD574 \uC8FC\uC138\uC694.",
          errors: error.errors
        });
      } else {
        res.status(500).json({
          success: false,
          message: "\uC7AC\uACE0 \uB4F1\uB85D \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4.",
          error: error?.message || "Unknown error"
        });
      }
    }
  });
  app2.put("/api/inventory/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertInventorySchema.partial().parse(req.body);
      const item = await storage.updateInventoryItem(id, validatedData);
      res.json({
        success: true,
        message: "\uC7AC\uACE0 \uD56D\uBAA9\uC774 \uC131\uACF5\uC801\uC73C\uB85C \uC218\uC815\uB418\uC5C8\uC2B5\uB2C8\uB2E4.",
        data: item
      });
    } catch (error) {
      if (error instanceof z2.ZodError) {
        res.status(400).json({
          success: false,
          message: "\uC785\uB825 \uC815\uBCF4\uB97C \uD655\uC778\uD574 \uC8FC\uC138\uC694.",
          errors: error.errors
        });
      } else {
        res.status(500).json({
          success: false,
          message: "\uC7AC\uACE0 \uC218\uC815 \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4."
        });
      }
    }
  });
  app2.delete("/api/inventory/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteInventoryItem(id);
      res.json({
        success: true,
        message: "\uC7AC\uACE0 \uD56D\uBAA9\uC774 \uC131\uACF5\uC801\uC73C\uB85C \uC0AD\uC81C\uB418\uC5C8\uC2B5\uB2C8\uB2E4."
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "\uC7AC\uACE0 \uC0AD\uC81C \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4."
      });
    }
  });
  app2.post("/api/upload", upload.single("image"), (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "\uC774\uBBF8\uC9C0 \uD30C\uC77C\uC774 \uC5C6\uC2B5\uB2C8\uB2E4."
        });
      }
      const imageUrl = `/uploads/${req.file.filename}`;
      res.json({
        success: true,
        imageUrl,
        message: "\uC774\uBBF8\uC9C0\uAC00 \uC131\uACF5\uC801\uC73C\uB85C \uC5C5\uB85C\uB4DC\uB418\uC5C8\uC2B5\uB2C8\uB2E4."
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "\uC774\uBBF8\uC9C0 \uC5C5\uB85C\uB4DC \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4.",
        error: error.message
      });
    }
  });
  app2.get("/api/gallery", async (req, res) => {
    try {
      const galleryItems2 = await storage.getAllGalleryItems();
      res.json(galleryItems2);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "\uAC24\uB7EC\uB9AC \uC870\uD68C \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4."
      });
    }
  });
  app2.get("/api/gallery/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const galleryItem = await storage.getGalleryItem(id);
      if (!galleryItem) {
        return res.status(404).json({
          success: false,
          message: "\uAC24\uB7EC\uB9AC \uD56D\uBAA9\uC744 \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4."
        });
      }
      res.json(galleryItem);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "\uAC24\uB7EC\uB9AC \uC870\uD68C \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4."
      });
    }
  });
  app2.post("/api/gallery", async (req, res) => {
    try {
      const validatedData = insertGalleryItemSchema.parse(req.body);
      const galleryItem = await storage.createGalleryItem(validatedData);
      res.status(201).json({
        success: true,
        message: "\uAC24\uB7EC\uB9AC \uD56D\uBAA9\uC774 \uC131\uACF5\uC801\uC73C\uB85C \uB4F1\uB85D\uB418\uC5C8\uC2B5\uB2C8\uB2E4.",
        data: galleryItem
      });
    } catch (error) {
      if (error instanceof z2.ZodError) {
        res.status(400).json({
          success: false,
          message: "\uC785\uB825 \uC815\uBCF4\uB97C \uD655\uC778\uD574 \uC8FC\uC138\uC694.",
          errors: error.errors
        });
      } else {
        res.status(500).json({
          success: false,
          message: "\uAC24\uB7EC\uB9AC \uB4F1\uB85D \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4."
        });
      }
    }
  });
  app2.put("/api/gallery/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertGalleryItemSchema.partial().parse(req.body);
      const galleryItem = await storage.updateGalleryItem(id, validatedData);
      res.json({
        success: true,
        message: "\uAC24\uB7EC\uB9AC \uD56D\uBAA9\uC774 \uC131\uACF5\uC801\uC73C\uB85C \uC218\uC815\uB418\uC5C8\uC2B5\uB2C8\uB2E4.",
        data: galleryItem
      });
    } catch (error) {
      if (error instanceof z2.ZodError) {
        res.status(400).json({
          success: false,
          message: "\uC785\uB825 \uC815\uBCF4\uB97C \uD655\uC778\uD574 \uC8FC\uC138\uC694.",
          errors: error.errors
        });
      } else {
        res.status(500).json({
          success: false,
          message: "\uAC24\uB7EC\uB9AC \uC218\uC815 \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4."
        });
      }
    }
  });
  app2.delete("/api/gallery/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteGalleryItem(id);
      res.json({
        success: true,
        message: "\uAC24\uB7EC\uB9AC \uD56D\uBAA9\uC774 \uC131\uACF5\uC801\uC73C\uB85C \uC0AD\uC81C\uB418\uC5C8\uC2B5\uB2C8\uB2E4."
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "\uAC24\uB7EC\uB9AC \uC0AD\uC81C \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4."
      });
    }
  });
  let lastRefreshTime = 0;
  const REFRESH_COOLDOWN = 5 * 60 * 1e3;
  app2.post("/api/refresh-data", async (req, res) => {
    try {
      const now = Date.now();
      if (now - lastRefreshTime < REFRESH_COOLDOWN) {
        const remainingTime = Math.ceil((REFRESH_COOLDOWN - (now - lastRefreshTime)) / 1e3 / 60);
        return res.json({
          success: true,
          message: `\uB370\uC774\uD130\uAC00 \uCD5C\uADFC\uC5D0 \uC5C5\uB370\uC774\uD2B8\uB418\uC5C8\uC2B5\uB2C8\uB2E4. ${remainingTime}\uBD84 \uD6C4\uC5D0 \uB2E4\uC2DC \uC2DC\uB3C4\uD574\uC8FC\uC138\uC694.`,
          cached: true,
          lastRefresh: new Date(lastRefreshTime).toISOString()
        });
      }
      console.log("Manual data refresh triggered");
      const refreshPromises = [
        silverScraper.scrapeSilverPrice().catch((e) => console.error("Silver price scraping failed:", e)),
        newsScraper.scrapeNews().catch((e) => console.error("News scraping failed:", e)),
        chartScraper.scrapeChart().catch((e) => console.error("Chart scraping failed:", e))
      ];
      await Promise.allSettled(refreshPromises);
      lastRefreshTime = now;
      res.json({
        success: true,
        message: "\uB370\uC774\uD130\uAC00 \uC131\uACF5\uC801\uC73C\uB85C \uC0C8\uB85C\uACE0\uCE68\uB418\uC5C8\uC2B5\uB2C8\uB2E4.",
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        cached: false
      });
    } catch (error) {
      console.error("Error during manual refresh:", error);
      res.status(500).json({
        success: false,
        message: "\uB370\uC774\uD130 \uC0C8\uB85C\uACE0\uCE68 \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4."
      });
    }
  });
  app2.post("/api/silver-sources/test", async (req, res) => {
    try {
      const sources = [
        { name: "YC Metal", url: "http://www.ycmetal.co.kr/price/price02.php" },
        { name: "LT Metal", url: "https://www.ltmetal.co.kr/kr/5_customer/sub_sg_list.html" },
        { name: "SY Metal", url: "http://www.symetal.net/bbs/board.php?w=u&bo_table=table49&sca=%EA%B3%A0%EC%8B%9C%EA%B0%80%EC%A0%95%EB%B3%B4" }
      ];
      const results = [];
      for (const source of sources) {
        try {
          console.log(`Testing ${source.name}...`);
          const startTime = Date.now();
          let success = false;
          if (source.name === "YC Metal") {
            success = await silverScraper.scrapeYCMetal(source.url);
          } else if (source.name === "LT Metal") {
            success = await silverScraper.scrapeLTMetal(source.url);
          } else if (source.name === "SY Metal") {
            success = await silverScraper.scrapeSYMetal(source.url);
          }
          const duration = Date.now() - startTime;
          results.push({
            source: source.name,
            url: source.url,
            status: success ? "success" : "failed",
            duration: `${duration}ms`,
            error: null
          });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          results.push({
            source: source.name,
            url: source.url,
            status: "error",
            duration: "0ms",
            error: errorMessage
          });
        }
      }
      res.json({
        success: true,
        message: "\uC740\uAC00\uACA9 \uC18C\uC2A4 \uD14C\uC2A4\uD2B8 \uC644\uB8CC",
        results
      });
    } catch (error) {
      console.error("Source testing error:", error);
      res.status(500).json({
        success: false,
        message: "\uC18C\uC2A4 \uD14C\uC2A4\uD2B8 \uC911 \uC624\uB958 \uBC1C\uC0DD"
      });
    }
  });
  app2.get("/sitemap.xml", (req, res) => {
    console.log(`[Sitemap] Request from: ${req.ip}, User-Agent: ${req.get("User-Agent")?.substring(0, 50)}`);
    console.log(`[Sitemap] Protocol: ${req.protocol}, Secure: ${req.secure}, X-Forwarded-Proto: ${req.get("x-forwarded-proto")}`);
    if (process.env.NODE_ENV === "production" && !req.secure && req.get("x-forwarded-proto") !== "https") {
      console.log(`[Sitemap] Redirecting to HTTPS: https://${req.get("host")}/sitemap.xml`);
      return res.redirect(301, `https://${req.get("host")}/sitemap.xml`);
    }
    console.log(`[Sitemap] Serving sitemap.xml with Content-Type: application/xml`);
    res.type("application/xml");
    res.header("Cache-Control", "public, max-age=3600");
    res.sendFile(path.join(process.cwd(), "public", "sitemap.xml"));
  });
  app2.get("/robots.txt", (req, res) => {
    console.log(`[Robots] Request from: ${req.ip}, User-Agent: ${req.get("User-Agent")?.substring(0, 50)}`);
    if (process.env.NODE_ENV === "production" && !req.secure && req.get("x-forwarded-proto") !== "https") {
      console.log(`[Robots] Redirecting to HTTPS: https://${req.get("host")}/robots.txt`);
      return res.redirect(301, `https://${req.get("host")}/robots.txt`);
    }
    console.log(`[Robots] Serving robots.txt with Content-Type: text/plain`);
    res.type("text/plain");
    res.header("Cache-Control", "public, max-age=3600");
    res.sendFile(path.join(process.cwd(), "public", "robots.txt"));
  });
  const httpServer = createServer(app2);
  return httpServer;
}

// server/data-cleanup.ts
init_db();
init_schema();
import { lt, count } from "drizzle-orm";
import cron2 from "node-cron";
var DataCleanupService = class {
  isCleanupRunning = false;
  constructor() {
    console.log("DataCleanupService initialized");
  }
  // 은납 가격 데이터 정리 (3년 이상 된 데이터)
  async cleanupOldSilverPrices() {
    try {
      const threeYearsAgo = /* @__PURE__ */ new Date();
      threeYearsAgo.setFullYear(threeYearsAgo.getFullYear() - 3);
      console.log(`Cleaning up silver price data older than: ${threeYearsAgo.toISOString()}`);
      const deletedRecords = await db.delete(silverPrices).where(lt(silverPrices.createdAt, threeYearsAgo)).returning({ id: silverPrices.id });
      const deletedCount = deletedRecords.length;
      console.log(`Cleaned up ${deletedCount} old silver price records`);
      return { deleted: deletedCount };
    } catch (error) {
      console.error("Error cleaning up silver price data:", error);
      throw error;
    }
  }
  // 뉴스 데이터 정리 (1개월 이상 된 데이터)
  async cleanupOldNews() {
    try {
      const oneMonthAgo = /* @__PURE__ */ new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
      console.log(`Cleaning up news data older than: ${oneMonthAgo.toISOString()}`);
      const deletedRecords = await db.delete(news).where(lt(news.createdAt, oneMonthAgo)).returning({ id: news.id });
      const deletedCount = deletedRecords.length;
      console.log(`Cleaned up ${deletedCount} old news records`);
      return { deleted: deletedCount };
    } catch (error) {
      console.error("Error cleaning up news data:", error);
      throw error;
    }
  }
  // 전체 데이터 정리 실행
  async runFullCleanup() {
    if (this.isCleanupRunning) {
      console.log("Data cleanup is already running, skipping...");
      return { silverPrices: 0, news: 0 };
    }
    this.isCleanupRunning = true;
    try {
      console.log("Starting scheduled data cleanup...");
      const [silverPricesResult, newsResult] = await Promise.all([
        this.cleanupOldSilverPrices(),
        this.cleanupOldNews()
      ]);
      console.log(`Data cleanup completed - Silver prices: ${silverPricesResult.deleted}, News: ${newsResult.deleted}`);
      return {
        silverPrices: silverPricesResult.deleted,
        news: newsResult.deleted
      };
    } catch (error) {
      console.error("Error during data cleanup:", error);
      throw error;
    } finally {
      this.isCleanupRunning = false;
    }
  }
  // 스케줄 작업 시작 (매일 새벽 2시에 실행)
  startScheduledCleanup() {
    cron2.schedule("0 2 * * *", async () => {
      try {
        console.log("Starting scheduled data cleanup at 2:00 AM...");
        await this.runFullCleanup();
      } catch (error) {
        console.error("Scheduled data cleanup failed:", error);
      }
    }, {
      timezone: "Asia/Seoul"
    });
    console.log("Scheduled data cleanup job started (daily at 2:00 AM KST)");
  }
  // 수동 정리 트리거 (개발/테스트용)
  async manualCleanup() {
    console.log("Manual data cleanup triggered...");
    return await this.runFullCleanup();
  }
  // 정리 예정 데이터 조회 (정리되지 않고 얼마나 남았는지 확인)
  async getCleanupStats() {
    try {
      const threeYearsAgo = /* @__PURE__ */ new Date();
      threeYearsAgo.setFullYear(threeYearsAgo.getFullYear() - 3);
      const oneMonthAgo = /* @__PURE__ */ new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
      const [oldSilverPricesResult] = await db.select({ count: count() }).from(silverPrices).where(lt(silverPrices.createdAt, threeYearsAgo));
      const [oldNewsResult] = await db.select({ count: count() }).from(news).where(lt(news.createdAt, oneMonthAgo));
      const nextCleanup = /* @__PURE__ */ new Date();
      nextCleanup.setDate(nextCleanup.getDate() + 1);
      nextCleanup.setHours(2, 0, 0, 0);
      return {
        oldSilverPrices: oldSilverPricesResult?.count || 0,
        oldNews: oldNewsResult?.count || 0,
        nextCleanupDate: nextCleanup.toISOString()
      };
    } catch (error) {
      console.error("Error getting cleanup stats:", error);
      return {
        oldSilverPrices: 0,
        oldNews: 0,
        nextCleanupDate: (/* @__PURE__ */ new Date()).toISOString()
      };
    }
  }
};
var dataCleanupService = new DataCleanupService();

// server/index.ts
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
var app = express();
app.set("trust proxy", 1);
app.use((req, res, next) => {
  next();
});
app.use(helmet({
  // Disable CSP temporarily for production deployment debugging
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
  crossOriginOpenerPolicy: false,
  crossOriginResourcePolicy: false
}));
app.use(cors({
  origin: process.env.NODE_ENV === "production" ? ["https://dabaro0432.cafe24.com", "http://dabaro0432.cafe24.com", "http://dabaro0432.cafe24.com:4000"] : ["http://localhost:5000", "http://127.0.0.1:5000", "http://localhost:4000"],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));
var limiter = rateLimit({
  windowMs: 15 * 60 * 1e3,
  // 15 minutes
  max: process.env.NODE_ENV === "development" ? 1e3 : 500,
  // increased for production
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    return !!req.url.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$/);
  }
});
var apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1e3,
  // 15 minutes
  max: process.env.NODE_ENV === "development" ? 500 : 200,
  // increased for production
  message: "Too many API requests from this IP, please try again later.",
  standardHeaders: true,
  legacyHeaders: false
});
app.use("/api/", apiLimiter);
app.use(limiter);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: false, limit: "10mb" }));
var uploadsPath = process.env.NODE_ENV === "production" ? "/home/dabaro-gallery-uploads" : path2.join(process.cwd(), "public", "uploads");
if (!fs2.existsSync(uploadsPath)) {
  fs2.mkdirSync(uploadsPath, { recursive: true });
  console.log("[Gallery] Created permanent uploads directory:", uploadsPath);
}
app.use("/uploads", express.static(uploadsPath));
app.use((req, res, next) => {
  const start = Date.now();
  const path3 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path3.startsWith("/api")) {
      let logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  try {
    initializeEmailService();
    dataCleanupService.startScheduledCleanup();
    silverScraper.startScheduledScraping();
    app.get("/googled89fa426649c79ad.html", (_req, res) => {
      res.type("text/plain");
      res.send("google-site-verification: googled89fa426649c79ad.html");
    });
    app.get("/health", (_req, res) => {
      res.status(200).json({
        status: "ok",
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        environment: process.env.NODE_ENV || "development"
      });
    });
    if (process.env.DATABASE_URL) {
      try {
        const { testConnection: testConnection2 } = await Promise.resolve().then(() => (init_db(), db_exports));
        const isConnected = await testConnection2();
        if (isConnected) {
          console.log("[Server] Database connection verified");
        } else {
          console.warn("[Server] Database connection failed, but continuing with fallback storage");
        }
      } catch (dbError) {
        console.warn("[Server] Database test failed:", dbError);
        console.log("[Server] Continuing with memory storage fallback");
      }
    }
    const server = await registerRoutes(app);
    app.use(express.static(path2.join(process.cwd(), "dist", "public")));
    app.get("*", (_req, res) => {
      res.sendFile(path2.join(process.cwd(), "dist", "public", "index.html"));
    });
    const port = process.env.PORT ? parseInt(process.env.PORT) : process.env.NODE_ENV === "production" ? 4e3 : 5e3;
    app.use((err, _req, res, _next) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      if (process.env.NODE_ENV === "production") {
        console.error("Error:", {
          status,
          message,
          stack: err.stack,
          url: _req.url,
          method: _req.method,
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        });
      }
      res.status(status).json({
        message: process.env.NODE_ENV === "production" ? "Internal Server Error" : message
      });
    });
    server.listen({
      port,
      host: "0.0.0.0",
      reusePort: true
    }, () => {
      const serverType = process.env.NODE_ENV === "production" ? "HTTP server (Cafe24 hosting)" : "HTTP server";
      log(`${serverType} running on port ${port}`);
    });
  } catch (startupError) {
    console.error("[Server] Critical startup error:", startupError);
    console.log("[Server] Attempting to start with minimal configuration...");
    try {
      const { createServer: createServer2 } = await import("http");
      const fallbackServer = createServer2(app);
      const port = process.env.PORT ? parseInt(process.env.PORT) : process.env.NODE_ENV === "production" ? 4e3 : 5e3;
      fallbackServer.listen(port, "0.0.0.0", () => {
        log(`fallback server running on port ${port}`);
      });
    } catch (fallbackError) {
      console.error("[Server] Fallback startup also failed:", fallbackError);
      process.exit(1);
    }
  }
})();
export {
  log
};
