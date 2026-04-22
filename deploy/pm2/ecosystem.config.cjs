module.exports = {
  apps: [
    {
      name: "deadlock-banpick-server",
      cwd: "/var/www/deadlock-banpick",
      script: "server/dist/index.js",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      max_memory_restart: "512M",
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
