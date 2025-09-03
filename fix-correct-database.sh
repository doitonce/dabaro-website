#!/bin/bash

echo "🔧 올바른 데이터베이스 연결 정보로 수정 중..."

# 1. PM2 정리
echo "📋 1단계: PM2 정리 중..."
pm2 stop all 2>/dev/null || true
pm2 delete all 2>/dev/null || true

# 2. Replit의 실제 DATABASE_URL 사용
echo "🗄️ 2단계: Replit 데이터베이스 연결 정보 적용 중..."
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
    max_restarts: 2,
    min_uptime: '15s'
  }]
};
EOF

# 3. 데이터베이스 연결 테스트
echo "🧪 3단계: 올바른 데이터베이스 연결 테스트 중..."
export NODE_ENV=production
export PORT=4000
export DATABASE_URL='postgresql://neondb_owner:npg_biVDWuAO8fK3@ep-weathered-cell-af0a7nqr.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require'

echo "=== 데이터베이스 연결 테스트 (15초) ==="
timeout 15s node dist/index.js 2>&1 | head -25 &
TEST_PID=$!
sleep 12

# 4. 포트 확인
echo ""
echo "=== 포트 4000 상태 ==="
lsof -i:4000 2>/dev/null || echo "포트 4000: 사용하는 프로세스 없음"

kill $TEST_PID 2>/dev/null || true
sleep 3

# 5. PM2 시작
echo ""
echo "🚀 5단계: PM2 시작 중..."
pm2 start ecosystem.config.cjs

# 6. 안정화 대기
echo "⏳ 6단계: 서버 안정화 대기 중 (30초)..."
sleep 30

# 7. 최종 상태 확인
echo "✅ 7단계: 최종 상태 확인 중..."
echo "=== PM2 상태 ==="
pm2 status
echo ""
echo "=== 포트 4000 확인 ==="
lsof -i:4000 2>/dev/null || echo "포트 4000: 사용하는 프로세스 없음"
echo ""
echo "=== 최근 출력 로그 ==="
pm2 logs --lines 5 --out 2>/dev/null || echo "출력 로그 없음"
echo ""
echo "=== 최근 오류 로그 ==="
pm2 logs --lines 3 --err 2>/dev/null || echo "오류 로그 없음"

# 8. 최종 연결 테스트
echo ""
echo "🌐 최종 연결 테스트:"
curl -I http://localhost:4000 --connect-timeout 5 2>/dev/null | head -3 || echo "로컬 연결 실패"

echo ""
echo "🎯 올바른 데이터베이스 연결 설정 완료!"
echo "🌐 웹사이트 확인: https://dabaro.kr"