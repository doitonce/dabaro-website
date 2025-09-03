import { db } from './db';
import { silverPrices, news } from '@shared/schema';
import { lt, count } from 'drizzle-orm';
import cron from 'node-cron';

export class DataCleanupService {
  private isCleanupRunning = false;

  constructor() {
    console.log('DataCleanupService initialized');
  }

  // 은납 가격 데이터 정리 (3년 이상 된 데이터)
  async cleanupOldSilverPrices(): Promise<{ deleted: number }> {
    try {
      const threeYearsAgo = new Date();
      threeYearsAgo.setFullYear(threeYearsAgo.getFullYear() - 3);
      
      console.log(`Cleaning up silver price data older than: ${threeYearsAgo.toISOString()}`);
      
      const deletedRecords = await db
        .delete(silverPrices)
        .where(lt(silverPrices.createdAt, threeYearsAgo))
        .returning({ id: silverPrices.id });

      const deletedCount = deletedRecords.length;
      console.log(`Cleaned up ${deletedCount} old silver price records`);
      
      return { deleted: deletedCount };
    } catch (error) {
      console.error('Error cleaning up silver price data:', error);
      throw error;
    }
  }

  // 뉴스 데이터 정리 (1개월 이상 된 데이터)
  async cleanupOldNews(): Promise<{ deleted: number }> {
    try {
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
      
      console.log(`Cleaning up news data older than: ${oneMonthAgo.toISOString()}`);
      
      const deletedRecords = await db
        .delete(news)
        .where(lt(news.createdAt, oneMonthAgo))
        .returning({ id: news.id });

      const deletedCount = deletedRecords.length;
      console.log(`Cleaned up ${deletedCount} old news records`);
      
      return { deleted: deletedCount };
    } catch (error) {
      console.error('Error cleaning up news data:', error);
      throw error;
    }
  }

  // 전체 데이터 정리 실행
  async runFullCleanup(): Promise<{ silverPrices: number; news: number }> {
    if (this.isCleanupRunning) {
      console.log('Data cleanup is already running, skipping...');
      return { silverPrices: 0, news: 0 };
    }

    this.isCleanupRunning = true;
    
    try {
      console.log('Starting scheduled data cleanup...');
      
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
      console.error('Error during data cleanup:', error);
      throw error;
    } finally {
      this.isCleanupRunning = false;
    }
  }

  // 스케줄 작업 시작 (매일 새벽 2시에 실행)
  startScheduledCleanup(): void {
    // 매일 새벽 2시에 데이터 정리 실행
    cron.schedule('0 2 * * *', async () => {
      try {
        console.log('Starting scheduled data cleanup at 2:00 AM...');
        await this.runFullCleanup();
      } catch (error) {
        console.error('Scheduled data cleanup failed:', error);
      }
    }, {
      timezone: 'Asia/Seoul'
    });

    console.log('Scheduled data cleanup job started (daily at 2:00 AM KST)');
  }

  // 수동 정리 트리거 (개발/테스트용)
  async manualCleanup(): Promise<{ silverPrices: number; news: number }> {
    console.log('Manual data cleanup triggered...');
    return await this.runFullCleanup();
  }

  // 정리 예정 데이터 조회 (정리되지 않고 얼마나 남았는지 확인)
  async getCleanupStats(): Promise<{
    oldSilverPrices: number;
    oldNews: number;
    nextCleanupDate: string;
  }> {
    try {
      const threeYearsAgo = new Date();
      threeYearsAgo.setFullYear(threeYearsAgo.getFullYear() - 3);
      
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

      const [oldSilverPricesResult] = await db
        .select({ count: count() })
        .from(silverPrices)
        .where(lt(silverPrices.createdAt, threeYearsAgo));

      const [oldNewsResult] = await db
        .select({ count: count() })
        .from(news)
        .where(lt(news.createdAt, oneMonthAgo));

      // 다음 정리 예정일 (다음날 새벽 2시)
      const nextCleanup = new Date();
      nextCleanup.setDate(nextCleanup.getDate() + 1);
      nextCleanup.setHours(2, 0, 0, 0);

      return {
        oldSilverPrices: oldSilverPricesResult?.count || 0,
        oldNews: oldNewsResult?.count || 0,
        nextCleanupDate: nextCleanup.toISOString()
      };
    } catch (error) {
      console.error('Error getting cleanup stats:', error);
      return {
        oldSilverPrices: 0,
        oldNews: 0,
        nextCleanupDate: new Date().toISOString()
      };
    }
  }
}

// 싱글톤 인스턴스 생성
export const dataCleanupService = new DataCleanupService();