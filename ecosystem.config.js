# PM2 进程管理配置
# 文档：https://pm2.keymetrics.io/

module.exports = {
  apps: [{
    name: 'nandu-ai',
    script: 'pnpm',
    args: 'start',
    cwd: '/var/www/nandu-ai',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env_production: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    // 日志配置
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    error_file: '/var/log/nandu-ai/error.log',
    out_file: '/var/log/nandu-ai/out.log',
    merge_logs: true,
  }]
};
