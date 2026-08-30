module.exports = {
  apps: [
    {
      name: 'clubaridane-api',
      script: './dist/app.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '300M',
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
    },
  ],
};
