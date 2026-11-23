module.exports = {
  apps: [
    {
      name: "synstrom-web",
      script: "npm.cmd",
      args: "run start",
      cwd: ".",
      watch: false,
      autorestart: true,
      env: {
        NODE_ENV: "production",
        PORT: "3000"
      }
    }
  ]
};