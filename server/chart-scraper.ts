import cron from 'node-cron';
import { storage } from './storage';

export class ChartScraper {
  private readonly KITCO_API_URL = 'https://www.kitco.com/market/';

  constructor() {
    console.log('Chart scraper initialized');
  }

  async scrapeChart(): Promise<void> {
    try {
      console.log('Starting silver chart scraping...');
      
      // Use Kitco's live silver chart as primary source
      const chartSources = [
        {
          name: 'Kitco',
          url: 'https://www.kitco.com/chart-images/images/live/silver.gif',
          description: 'Kitco Live Silver Chart'
        }
      ];

      for (const source of chartSources) {
        try {
          console.log(`Trying ${source.name} chart...`);
          
          const imageResponse = await fetch(source.url, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              'Accept': 'image/png,image/jpeg,image/*,*/*;q=0.8',
              'Accept-Language': 'en-US,en;q=0.9',
              'Cache-Control': 'no-cache'
            },

          });

          if (!imageResponse.ok) {
            console.log(`${source.name} failed with status: ${imageResponse.status}`);
            continue;
          }

          const contentType = imageResponse.headers.get('content-type');
          if (!contentType || !contentType.startsWith('image/')) {
            console.log(`${source.name} returned non-image content: ${contentType}`);
            continue;
          }

          const imageBuffer = await imageResponse.arrayBuffer();
          if (imageBuffer.byteLength < 1000) {
            console.log(`${source.name} returned suspiciously small image: ${imageBuffer.byteLength} bytes`);
            continue;
          }

          const base64Image = Buffer.from(imageBuffer).toString('base64');
          
          // Store chart data
          await storage.updateSilverChart({
            imageUrl: source.url,
            imageData: base64Image,
            lastUpdated: new Date()
          });

          console.log(`Silver chart updated successfully from ${source.name}`);
          return;
        } catch (sourceError) {
          console.log(`${source.name} failed:`, sourceError.message);
          continue;
        }
      }
      
      throw new Error('All chart sources failed');
    } catch (error) {
      console.error('Error scraping silver chart:', error);
    }
  }

  // Removed scheduled scraping - now only triggers on demand
  // The scrapeChart() method can still be called manually when needed
}

export const chartScraper = new ChartScraper();