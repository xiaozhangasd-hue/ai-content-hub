module.exports = {
  apps: [{
    name: 'nandu-ai',
    script: 'node',
    args: 'server.js',
    cwd: '/opt/ai-content-hub',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 5000,
      HOSTNAME: '0.0.0.0',
    },
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    error_file: '/var/log/nandu-ai/error.log',
    out_file: '/var/log/nandu-ai/out.log',
    merge_logs: true,
  }]
};
