import cron from 'node-cron';
import { storage } from './storage';
import { db } from './db';
import { news, type InsertNews } from '@shared/schema';
import * as cheerio from 'cheerio';

export class NewsScraper {
  private readonly KITCO_NEWS_URL = 'https://www.kitco.com/news';
  private readonly DEEPL_API_KEY = process.env.DEEPL_API_KEY;

  constructor() {
    console.log('News scraper initialized for Kitco.com');
  }

  async scrapeNews(): Promise<void> {
    try {
      console.log('Starting Kitco news scraping...');
      
      // Clear old news first
      await storage.clearAllNews();
      console.log('Cleared old news data');

      const response = await fetch(this.KITCO_NEWS_URL, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Cache-Control': 'no-cache'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch Kitco news: ${response.status}`);
      }

      const html = await response.text();
      const $ = cheerio.load(html);
      
      let articleCount = 0;
      const articles: InsertNews[] = [];
      
      // Target the main featured news section based on the website structure
      console.log('Extracting main featured news from Kitco...');
      
      // Look for the main content container and featured stories
      const contentContainer = $('main, .main-content, .content, .news-content, #content').first();
      
      if (contentContainer.length > 0) {
        console.log('Found main content container');
        
        // Find all significant headlines and links within the main content
        contentContainer.find('h1, h2, h3').each((index, element) => {
          if (articles.length >= 4) return false;
          
          const $heading = $(element);
          const title = $heading.text().trim();
          
          // Look for associated link
          let $link = $heading.find('a').first();
          if ($link.length === 0) {
            $link = $heading.closest('a');
          }
          if ($link.length === 0) {
            $link = $heading.parent().find('a').first();
          }
          if ($link.length === 0) {
            $link = $heading.siblings('a').first();
          }
          
          const href = $link.attr('href');
          
          if (title && href && title.length > 20) {
            const url = href.startsWith('http') ? href : `https://www.kitco.com${href}`;
            
            // Find description from surrounding content
            const $container = $heading.closest('div, article, section');
            let description = $container.find('p').first().text().trim();
            if (!description) {
              description = $heading.parent().next('p').text().trim();
            }
            if (!description) {
              description = $heading.siblings('p').first().text().trim();
            }
            
            // Only add if not duplicate and has meaningful content
            if (!articles.find(a => a.title === title || a.url === url)) {
              articles.push({
                title: title.substring(0, 255),
                description: description ? description.substring(0, 500) : undefined,
                url: url,
                source: 'Kitco.com',
                publishedAt: new Date(),
                category: 'precious-metals'
              });
              console.log(`Found main story: ${title.substring(0, 50)}...`);
            }
          }
        });
      }
      
      // Alternative approach: look for all news links and prioritize by content position
      if (articles.length < 4) {
        console.log('Searching for additional news articles...');
        
        const newsLinks: Array<{
          title: string;
          url: string;
          isMainContent: boolean;
          element: any;
        }> = [];
        $('a').each((index, element) => {
          const $link = $(element);
          const href = $link.attr('href');
          const text = $link.text().trim();
          
          if (href && text && 
              (href.includes('/news/') || href.includes('/commentary/') || href.includes('/analysis/')) &&
              text.length > 20 && text.length < 400) {
            
            const url = href.startsWith('http') ? href : `https://www.kitco.com${href}`;
            
            // Get position information to prioritize main content
            const $linkContainer = $link.closest('div, article, section');
            const containerClasses = $linkContainer.attr('class') || '';
            const isMainContent = !containerClasses.includes('sidebar') && 
                                 !containerClasses.includes('side') &&
                                 !containerClasses.includes('widget');
            
            newsLinks.push({
              title: text,
              url: url,
              isMainContent: isMainContent,
              element: $link
            });
          }
        });
        
        // Sort by main content first, then take up to 4 total
        newsLinks.sort((a, b) => {
          if (a.isMainContent && !b.isMainContent) return -1;
          if (!a.isMainContent && b.isMainContent) return 1;
          return 0;
        });
        
        for (const newsLink of newsLinks) {
          if (articles.length >= 4) break;
          
          if (!articles.find(a => a.title === newsLink.title || a.url === newsLink.url)) {
            // Find description
            const $container = newsLink.element.closest('div, article');
            const description = $container.find('p').first().text().trim() ||
                               $container.siblings('p').first().text().trim();
            
            articles.push({
              title: newsLink.title.substring(0, 255),
              description: description ? description.substring(0, 500) : undefined,
              url: newsLink.url,
              source: 'Kitco.com',
              publishedAt: new Date(),
              category: 'precious-metals'
            });
            console.log(`Found news link: ${newsLink.title.substring(0, 50)}...`);
          }
        }
      }
      
      console.log(`Total articles found: ${articles.length}`);
      

      
      // Translate and store all collected articles
      for (const article of articles) {
        try {
          // Translate title and description to Korean
          const translatedTitle = await this.translateText(article.title);
          const translatedDescription = article.description ? 
            await this.translateText(article.description) : undefined;

          const translatedArticle: InsertNews = {
            ...article,
            title: translatedTitle || article.title,
            description: translatedDescription || article.description
          };

          await storage.createNews(translatedArticle);
        } catch (error) {
          console.error('Error storing article:', error);
          // Store original article if translation fails
          try {
            await storage.createNews(article);
          } catch (fallbackError) {
            console.error('Error storing fallback article:', fallbackError);
          }
        }
      }

      console.log(`Kitco news scraping completed. Collected ${articles.length} articles`);
      
    } catch (error) {
      console.error('Error during Kitco news scraping:', error);
    }
  }

  async translateText(text: string): Promise<string | null> {
    if (!this.DEEPL_API_KEY) {
      console.warn('DEEPL_API_KEY not found. Skipping translation.');
      return null;
    }

    try {
      const response = await fetch('https://api-free.deepl.com/v2/translate', {
        method: 'POST',
        headers: {
          'Authorization': `DeepL-Auth-Key ${this.DEEPL_API_KEY}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          text: text,
          source_lang: 'EN',
          target_lang: 'KO'
        })
      });

      if (!response.ok) {
        console.error(`DeepL API error: ${response.status}`);
        return null;
      }

      const data = await response.json();
      return data.translations?.[0]?.text || null;
    } catch (error) {
      console.error('Translation error:', error);
      return null;
    }
  }

  // Removed scheduled scraping - now only triggers on demand
  // The scrapeNews() method can still be called manually when needed
}

export const newsScraper = new NewsScraper();