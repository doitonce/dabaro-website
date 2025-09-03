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
