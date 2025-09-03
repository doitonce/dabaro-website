#!/bin/bash

echo "🔧 의존성 설치 및 서버 시작 수정"

# 1. PM2 정리
echo "📋 1단계: PM2 정리 중..."
pm2 stop all 2>/dev/null || true
pm2 delete all 2>/dev/null || true

# 2. Node.js 의존성 완전 재설치
echo "📦 2단계: Node.js 의존성 완전 재설치 중..."
rm -rf node_modules package-lock.json 2>/dev/null || true
npm cache clean --force 2>/dev/null || true

echo "설치 중... (2-3분 소요)"
npm install

# 3. 설치 확인
echo "🔍 3단계: 주요 의존성 설치 확인 중..."
npm list drizzle-orm express @neondatabase/serverless || {
    echo "❌ 의존성 설치 실패 - 다시 설치 중..."
    npm install drizzle-orm express @neondatabase/serverless
}

# 4. 영구 갤러리 저장소 설정
echo "🖼️ 4단계: 영구 갤러리 저장소 설정 중..."
GALLERY_DIR="/home/dabaro-gallery-uploads"
mkdir -p "$GALLERY_DIR"
chmod 755 "$GALLERY_DIR"
echo "✅ 영구 갤러리 디렉토리 생성: $GALLERY_DIR"

# 기존 이미지 마이그레이션 (있는 경우)
OLD_UPLOADS="/home/dabaro-website/public/uploads"
if [ -d "$OLD_UPLOADS" ]; then
    echo "🔄 기존 갤러리 이미지 마이그레이션 중..."
    cp -n "$OLD_UPLOADS"/*.{jpg,jpeg,png,gif,webp} "$GALLERY_DIR/" 2>/dev/null || true
    MIGRATED_COUNT=$(find "$GALLERY_DIR" -type f 2>/dev/null | wc -l)
    echo "✅ 이미지 마이그레이션 완료: $MIGRATED_COUNT 개 파일"
fi

# 5. 필수 폴더 확인
echo "📁 5단계: 필수 폴더 확인 중..."
mkdir -p dist/public
mkdir -p public/uploads
ls -la dist/ || echo "❌ dist 폴더 없음"

# 6. 올바른 PM2 설정 생성
echo "⚙️ 6단계: PM2 설정 생성 중..."
cat > ecosystem.config.cjs << 'EOF'
module.exports = {
  apps: [{
    name: 'dabaro-website',
    script: 'node',
    args: 'dist/index.js',
    env: {
      NODE_ENV: 'production',
      PORT: 4000,
      DATABASE_URL: 'postgresql://neondb_owner:npg_biVDWuAO8fK3@ep-weathered-cell-af0a7nqr.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require',
      DEEPL_API_KEY: '84b74155-dcd9-45ee-a666-64c267666ce8:fx',
      EMAIL_HOST: 'smtp.gmail.com',
      EMAIL_PORT: 587,
      EMAIL_SECURE: false,
      EMAIL_USER: 'webzoro73@gmail.com',
      EMAIL_PASS: 'rhgi sqdw lrya qvoa'
    },
    instances: 1,
    exec_mode: 'fork',
    watch: false,
    autorestart: true,
    max_restarts: 3,
    min_uptime: '20s'
  }]
};
EOF

# 7. 의존성 설치 후 서버 테스트
echo "🧪 7단계: 서버 의존성 테스트 중..."
export NODE_ENV=production
export PORT=4000
export DATABASE_URL='postgresql://neondb_owner:npg_biVDWuAO8fK3@ep-weathered-cell-af0a7nqr.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require'

echo "=== 의존성 테스트 (20초) ==="
timeout 20s node dist/index.js 2>&1 | head -30 &
TEST_PID=$!
sleep 15

echo ""
echo "=== 포트 4000 상태 ==="
lsof -i:4000 2>/dev/null || echo "포트 4000: 사용하는 프로세스 없음"

kill $TEST_PID 2>/dev/null || true
sleep 5

# 8. PM2 시작
echo ""
echo "🚀 8단계: PM2 시작 중..."
pm2 start ecosystem.config.cjs

# 9. 안정화 대기
echo "⏳ 9단계: 서버 안정화 대기 중 (40초)..."
sleep 40

# 10. 최종 상태 확인
echo "✅ 10단계: 최종 상태 확인 중..."
echo "=== PM2 상태 ==="
pm2 status
echo ""
echo "=== 포트 4000 확인 ==="
lsof -i:4000 2>/dev/null || echo "포트 4000: 사용하는 프로세스 없음"
echo ""
echo "=== 최근 출력 로그 ==="
pm2 logs --lines 8 --out 2>/dev/null || echo "출력 로그 없음"
echo ""
echo "=== 최근 오류 로그 ==="
pm2 logs --lines 3 --err 2>/dev/null || echo "오류 로그 없음"

# 10. 최종 웹사이트 테스트
echo ""
echo "🌐 최종 연결 테스트:"
curl -I http://localhost:4000 --connect-timeout 10 2>/dev/null | head -3 || echo "로컬 연결 실패"

echo ""
echo "🎯 의존성 설치 및 서버 시작 완료!"
echo "🌐 웹사이트 확인: https://dabaro.kr"