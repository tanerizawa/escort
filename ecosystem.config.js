module.exports = {
  apps: [
    // NestJS API Server
    {
      name: 'areton-api',
      cwd: './apps/api',
      script: 'dist/main.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 4000,
      },
      max_memory_restart: '512M',
      error_file: './logs/api-error.log',
      out_file: './logs/api-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      restart_delay: 3000,
      max_restarts: 10,
    },

    // Next.js Web App (Client)
    {
      name: 'areton-web',
      cwd: './apps/web',
      script: 'node_modules/.bin/next',
      args: 'start --port 3003',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3003,
      },
      max_memory_restart: '512M',
      error_file: './logs/web-error.log',
      out_file: './logs/web-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      restart_delay: 3000,
      max_restarts: 10,
    },

    // Next.js Admin Dashboard
    {
      name: 'areton-admin',
      cwd: './apps/admin',
      script: 'node_modules/.bin/next',
      args: 'start --port 3005',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3005,
      },
      max_memory_restart: '256M',
      error_file: './logs/admin-error.log',
      out_file: './logs/admin-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      restart_delay: 3000,
      max_restarts: 10,
    },
  ],
};
