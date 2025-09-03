import * as cheerio from 'cheerio';
import * as cron from 'node-cron';
import { storage } from './storage';

export class SilverPriceScraper {
  private readonly SOURCES = [
    {
      name: 'YC Metal',
      url: 'http://www.ycmetal.co.kr/price/price02.php',
      scraper: this.scrapeYCMetal.bind(this)
    },
    {
      name: 'LT Metal',
      url: 'https://www.ltmetal.co.kr/kr/5_customer/sub_sg_list.html',
      scraper: this.scrapeLTMetal.bind(this)
    },
    {
      name: 'SY Metal',
      url: 'http://www.symetal.net/bbs/board.php?w=u&bo_table=table49&sca=%EA%B3%A0%EC%8B%9C%EA%B0%80%EC%A0%95%EB%B3%B4',
      scraper: this.scrapeSYMetal.bind(this)
    }
  ];

  async scrapeSilverPrice(): Promise<void> {
    console.log('Starting silver price scraping with fallback system...');
    
    for (const source of this.SOURCES) {
      try {
        console.log(`시도 중: ${source.name} (${source.url})`);
        const result = await source.scraper(source.url);
        
        if (result) {
          console.log(`✅ ${source.name}에서 은가격 데이터 수집 성공`);
          return; // 성공 시 여기서 종료
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.log(`❌ ${source.name} 스크래핑 실패:`, errorMessage);
        continue; // 다음 소스로 이동
      }
    }
    
    console.error('⚠️ 모든 은가격 소스에서 데이터 수집 실패');
  }

  // 기존 YC Metal 스크래퍼 (테스트용 public 메서드)
  async scrapeYCMetal(url: string): Promise<boolean> {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
        'Cache-Control': 'no-cache'
      }
    });
    
    if (!response.ok) {
      if (response.status === 429) {
        console.log('Rate limited by YC Metal, trying next source');
        return false;
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const html = await response.text();
    const $ = cheerio.load(html);
    
    // Find the table with silver price data
    const table = $('table.tb-style3');
    if (table.length === 0) {
      throw new Error('YC Metal: Price table not found');
    }
    
    // Get the first data row (most recent date)
    const firstRow = table.find('tr').eq(1); // Skip header row
    if (firstRow.length === 0) {
      throw new Error('YC Metal: No price data found');
    }
    
    const cells = firstRow.find('td');
    if (cells.length < 4) {
      throw new Error('YC Metal: Incomplete price data');
    }
    
    const date = $(cells[0]).text().trim();
    const priceKrw = parseInt($(cells[1]).text().trim().replace(/,/g, ''), 10);
    const priceUsd = parseInt($(cells[2]).text().trim().replace(/,/g, ''), 10);
    const priceOunce = parseInt($(cells[3]).text().trim().replace(/,/g, ''), 10);
    
    if (isNaN(priceKrw) || isNaN(priceUsd) || isNaN(priceOunce)) {
      throw new Error('YC Metal: Invalid price data format');
    }
    
    return await this.savePriceData(date, priceKrw, priceUsd, priceOunce, 'YC Metal');
  }

  // LT Metal 스크래퍼 (테스트용 public 메서드)
  async scrapeLTMetal(baseUrl: string): Promise<boolean> {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const url = `${baseUrl}?m_year=${year}&m_month=${month}&type=111`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
        'Cache-Control': 'no-cache'
      }
    });
    
    if (!response.ok) {
      throw new Error(`LT Metal HTTP error! status: ${response.status}`);
    }
    
    const html = await response.text();
    const $ = cheerio.load(html);
    
    // LT Metal 테이블 구조: 날짜 | 국제가(USD/oz) | 국내가(KRW/gr) | 환율
    const rows = $('table tr').filter((i, row) => {
      const text = $(row).text();
      return text.includes('2025.') && !text.includes('AVG');
    });
    
    if (rows.length === 0) {
      throw new Error('LT Metal: No valid price data found');
    }
    
    // 가장 최근 데이터 찾기 (0.000이 아닌 값)
    for (let i = 0; i < rows.length; i++) {
      const cells = $(rows[i]).find('td');
      if (cells.length >= 4) {
        const date = $(cells[0]).text().trim().replace(/\./g, '/');
        const priceOunceText = $(cells[1]).text().trim();
        const priceKrwText = $(cells[2]).text().trim();
        const exchangeRateText = $(cells[3]).text().trim();
        
        const priceOunce = parseFloat(priceOunceText.replace(/,/g, ''));
        const priceKrw = parseInt(priceKrwText.replace(/,/g, ''), 10);
        const exchangeRate = parseFloat(exchangeRateText.replace(/,/g, ''));
        
        // 유효한 데이터인지 확인 (0이 아닌 값)
        if (priceOunce > 0 && priceKrw > 0 && exchangeRate > 0) {
          // USD 가격 계산 (대략적 계산)
          const priceUsd = Math.round(priceKrw / exchangeRate * 1000);
          
          return await this.savePriceData(date, priceKrw, priceUsd, Math.round(priceOunce * 1000), 'LT Metal');
        }
      }
    }
    
    throw new Error('LT Metal: No valid non-zero price data found');
  }

  // SY Metal 스크래퍼 (테스트용 public 메서드)
  async scrapeSYMetal(url: string): Promise<boolean> {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
        'Cache-Control': 'no-cache',
        'Referer': 'http://www.symetal.net/'
      }
    });
    
    if (!response.ok) {
      throw new Error(`SY Metal HTTP error! status: ${response.status}`);
    }
    
    const html = await response.text();
    const $ = cheerio.load(html);
    
    // SY Metal의 테이블 구조 탐색 (구체적인 구조는 실제 응답에 따라 조정 필요)
    const tables = $('table');
    
    for (let i = 0; i < tables.length; i++) {
      const table = $(tables[i]);
      const rows = table.find('tr');
      
      for (let j = 0; j < rows.length; j++) {
        const row = $(rows[j]);
        const text = row.text();
        
        // 은가격 관련 데이터가 포함된 행 찾기
        if (text.includes('은') || text.includes('Ag') || text.includes('silver')) {
          const cells = row.find('td');
          if (cells.length >= 3) {
            // SY Metal의 구체적인 데이터 파싱 로직 (사이트 구조에 따라 조정)
            const dateText = $(cells[0]).text().trim();
            const priceText = $(cells[1]).text().trim();
            
            // 날짜 형식 확인 및 가격 추출
            if (dateText.match(/202[4-9]/) && priceText.match(/\d+/)) {
              const priceKrw = parseInt(priceText.replace(/[^0-9]/g, ''), 10);
              
              if (priceKrw > 0) {
                // 대략적인 USD 및 온스 가격 계산
                const priceUsd = Math.round(priceKrw / 1400); // 환율 추정
                const priceOunce = Math.round(priceKrw * 31.1); // 그램 → 온스 변환
                
                return await this.savePriceData(dateText, priceKrw, priceUsd, priceOunce, 'SY Metal');
              }
            }
          }
        }
      }
    }
    
    throw new Error('SY Metal: No silver price data found');
  }

  // 공통 데이터 저장 함수
  private async savePriceData(date: string, priceKrw: number, priceUsd: number, priceOunce: number, source: string): Promise<boolean> {
    // 거래일만 저장 (월-금만, 주말 제외)
    const dateObj = new Date(date.replace(/\//g, '-'));
    const dayOfWeek = dateObj.getDay(); // 0=일요일, 6=토요일
    
    if (dayOfWeek >= 1 && dayOfWeek <= 5) { // 평일만 저장
      await storage.createOrUpdateSilverPrice({
        date,
        priceKrw,
        priceUsd,
        priceOunce,
      });
      
      console.log(`은가격 업데이트 완료 (${source}): ${date} - KRW: ${priceKrw}, USD: ${priceUsd}, Ounce: ${priceOunce}`);
      return true;
    } else {
      console.log(`주말 데이터 스킵 (${source}): ${date} (거래일이 아님)`);
      return true; // 주말이어도 성공으로 처리
    }
  }

  // 평일 오전 9:30-10:30 20분 단위 자동 갱신 스케줄
  startScheduledScraping(): void {
    // 평일 오전 9:30 (월-금)
    cron.schedule('30 9 * * 1-5', () => {
      console.log('은가격 자동 갱신 시작 (09:30)');
      this.scrapeSilverPrice().catch(console.error);
    }, {
      timezone: 'Asia/Seoul'
    });

    // 평일 오전 9:50 (월-금)
    cron.schedule('50 9 * * 1-5', () => {
      console.log('은가격 자동 갱신 시작 (09:50)');
      this.scrapeSilverPrice().catch(console.error);
    }, {
      timezone: 'Asia/Seoul'
    });

    // 평일 오전 10:10 (월-금)
    cron.schedule('10 10 * * 1-5', () => {
      console.log('은가격 자동 갱신 시작 (10:10)');
      this.scrapeSilverPrice().catch(console.error);
    }, {
      timezone: 'Asia/Seoul'
    });

    // 평일 오전 10:30 (월-금)
    cron.schedule('30 10 * * 1-5', () => {
      console.log('은가격 자동 갱신 시작 (10:30)');
      this.scrapeSilverPrice().catch(console.error);
    }, {
      timezone: 'Asia/Seoul'
    });

    console.log('은가격 자동 갱신 스케줄이 시작되었습니다 (평일 9:30-10:30, 20분 간격)');
  }
}

export const silverScraper = new SilverPriceScraper();