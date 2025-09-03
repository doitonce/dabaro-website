#!/bin/bash
# Cafe24 Ubuntu 22.04 서버 배포 스크립트
# 성공적인 배포를 위한 핵심 요소들:
# 1. 개발 의존성 포함 설치 (빌드용)
# 2. rollup 네이티브 바이너리 설치
# 3. PM2로 프로덕션 환경 실행
# 4. nginx HTTPS 프록시 설정 필요 (별도)
# 5. Cafe24 방화벽에서 포트 443 허용 필수

set -e

echo "🚀 다바로 웹사이트 Cafe24 배포 시작..."

# 환경변수 확인
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL 환경변수가 설정되지 않았습니다."
    echo "💡 .env 파일에 DATABASE_URL을 설정하거나 환경변수로 제공하세요."
    exit 1
fi

# Node.js 버전 확인
NODE_VERSION=$(node --version)
echo "📍 Node.js 버전: $NODE_VERSION"

# 의존성 설치 (개발 의존성 포함 - 빌드용)
echo "📦 의존성 설치 중..."
npm install --include=dev

# rollup 네이티브 바이너리 설치 (Ubuntu 환경 필수)
echo "🔧 rollup 네이티브 바이너리 설치 중..."
npm install @rollup/rollup-linux-x64-gnu

# 프로젝트 빌드
echo "🔨 프로젝트 빌드 중..."
npm run build

# 데이터베이스 스키마 적용
echo "🗃️ 데이터베이스 스키마 적용 중..."
npm run db:push

# PM2 설치 확인
if ! command -v pm2 &> /dev/null; then
    echo "📦 PM2 설치 중..."
    npm install -g pm2
fi

# PM2 ecosystem 파일 생성 (안정적인 환경변수 직접 설정)
echo "📝 PM2 설정 파일 생성 중..."
cat > ecosystem.config.cjs << 'EOF'
module.exports = {
  apps: [{
    name: 'dabaro-website',
    script: 'dist/index.js',
    cwd: '/home/dabaro-website',
    env: {
      NODE_ENV: 'production',
      PORT: 4000,
      DATABASE_URL: 'postgresql://neondb_owner:npg_biVDWuAO8fK3@ep-weathered-cell-af0a7nqr.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require',
      EMAIL_HOST: 'smtp.gmail.com',
      EMAIL_PORT: 587,
      EMAIL_SECURE: false,
      EMAIL_USER: 'webzoro73@gmail.com',
      EMAIL_PASS: 'rhgi sqdw lrya qvoa',
      COMPANY_EMAIL: 'webzoro73@gmail.com',
      DEEPL_API_KEY: '84b74155-dcd9-45ee-a666-64c267666ce8:fx'
    },
    instances: 1,
    exec_mode: 'fork',
    watch: false,
    max_memory_restart: '1G',
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s'
  }]
};
EOF

# PM2로 애플리케이션 시작/재시작
echo "🔄 애플리케이션 시작 중..."
if pm2 list | grep -q "dabaro-website"; then
    echo "🔄 기존 애플리케이션 재시작 중..."
    pm2 restart dabaro-website
else
    echo "🆕 새 애플리케이션 시작 중..."
    pm2 start ecosystem.config.cjs
fi

# PM2 상태 확인
echo "📊 PM2 상태 확인 중..."
pm2 list

# PM2 로그 확인 (선택사항)
echo "📋 최근 로그 확인:"
pm2 logs dabaro-website --lines 10

echo "✅ 배포 완료! 애플리케이션이 포트 4000에서 실행 중입니다."
echo ""
echo "🌐 다음 단계:"
echo "1. nginx HTTPS 프록시 설정 (CAFE24_NGINX_CONFIG.md 참고)"
echo "2. Cafe24 관리 패널에서 포트 443 허용 (필수!)"
echo "3. 웹사이트 접속: https://dabaro0432.cafe24.com"
echo ""
echo "📝 모니터링:"
echo "- PM2 상태: pm2 status"
echo "- PM2 로그: pm2 logs dabaro-website"
echo "- nginx 상태: systemctl status nginx"
echo "- 접속 테스트: curl -I https://dabaro0432.cafe24.com"