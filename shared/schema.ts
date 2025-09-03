import { pgTable, text, serial, integer, boolean, timestamp, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const inquiries = pgTable("inquiries", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  company: text("company"),
  phone: text("phone").notNull(),
  email: text("email").notNull(),
  inquiryType: text("inquiry_type").notNull(),
  message: text("message").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  status: text("status").notNull().default('pending'), // pending, processed, resolved
});

export const silverPrices = pgTable("silver_prices", {
  id: serial("id").primaryKey(),
  date: text("date").notNull().unique(),
  priceKrw: integer("price_krw").notNull(),
  priceUsd: integer("price_usd").notNull(),
  priceOunce: integer("price_ounce").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const news = pgTable("news", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  url: text("url").notNull(),
  source: text("source").notNull(),
  publishedAt: timestamp("published_at").notNull(),
  category: text("category").notNull().default("precious-metals"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const silverCharts = pgTable("silver_charts", {
  id: serial("id").primaryKey(),
  imageUrl: text("image_url").notNull(),
  imageData: text("image_data").notNull(),
  lastUpdated: timestamp("last_updated").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const inventory = pgTable("inventory", {
  id: serial("id").primaryKey(),
  itemName: text("item_name").notNull(),
  silverContent: integer("silver_content").notNull(), // 은함량 %
  specification: text("specification").notNull(),
  isRolled: boolean("is_rolled").notNull().default(false), // 압연재 여부
  quantityKg: numeric("quantity_kg", { precision: 10, scale: 2 }).notNull(), // Kg units
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const galleryItems = pgTable("gallery_items", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  imageUrl: text("image_url").notNull(),
  displayOrder: integer("display_order").default(0).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertInquirySchema = createInsertSchema(inquiries).pick({
  name: true,
  company: true,
  phone: true,
  email: true,
  inquiryType: true,
  message: true,
});

export const insertSilverPriceSchema = createInsertSchema(silverPrices).pick({
  date: true,
  priceKrw: true,
  priceUsd: true,
  priceOunce: true,
});

export const insertNewsSchema = createInsertSchema(news).pick({
  title: true,
  description: true,
  url: true,
  source: true,
  publishedAt: true,
  category: true,
}).extend({
  description: z.string().optional(),
  category: z.string().optional(),
});

export const insertSilverChartSchema = createInsertSchema(silverCharts).pick({
  imageUrl: true,
  imageData: true,
}).extend({
  lastUpdated: z.date().optional(),
});

export const insertInventorySchema = z.object({
  itemName: z.string().min(1),
  silverContent: z.number().int().min(1).max(100),
  specification: z.string().min(1),
  isRolled: z.boolean().default(false),
  quantityKg: z.number().positive(),
});

export const insertGalleryItemSchema = createInsertSchema(galleryItems).pick({
  title: true,
  description: true,
  imageUrl: true,
  displayOrder: true,
  isActive: true,
}).extend({
  description: z.string().optional(),
  displayOrder: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertInquiry = z.infer<typeof insertInquirySchema>;
export type Inquiry = typeof inquiries.$inferSelect;
export type InsertSilverPrice = z.infer<typeof insertSilverPriceSchema>;
export type SilverPrice = typeof silverPrices.$inferSelect;
export type InsertNews = z.infer<typeof insertNewsSchema>;
export type News = typeof news.$inferSelect;
export type InsertSilverChart = z.infer<typeof insertSilverChartSchema>;
export type SilverChart = typeof silverCharts.$inferSelect;
export type InsertInventory = z.infer<typeof insertInventorySchema>;
export type Inventory = typeof inventory.$inferSelect;
export type InsertGalleryItem = z.infer<typeof insertGalleryItemSchema>;
export type GalleryItem = typeof galleryItems.$inferSelect;
