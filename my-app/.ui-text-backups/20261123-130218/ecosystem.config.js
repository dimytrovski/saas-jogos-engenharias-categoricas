module.exports = {
apps: [
{
  name: "saas-nextjs",
  script: ".\\node_modules\\.bin\\next.cmd",
  args: ["/c", ".\\node_modules\\.bin\\next.cmd", "dev", "-p", "3000"],
  interpreter: "cmd.exe",
  cwd: "C:\\Users\\dimyt\\OneDrive\\Documentos\\meu-projeto-saas\\my-app",
  watch: false,
  env: {
    NODE_ENV: "development",
    PORT: 3000
  }
},
{
  name: "saas-ffmpeg-hls",
  script: "C:\\Users\\dimyt\\AppData\\Local\\Microsoft\\WinGet\\Packages\\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\\ffmpeg-9.1-full_build\\bin\\ffmpeg.exe",
  args: [
    "-re",
    "-stream_loop", "-1",
    "-i", "C:\\Users\\dimyt\\Videos\\Gravações de Tela\\Gravação de Tela 2026-11-20 172834.mp4",
    "-c:v", "libx264",
    "-pix_fmt", "yuv420p",
    "-profile:v", "main",
    "-preset", "veryfast",
    "-g", "90",
    "-keyint_min", "90",
    "-sc_threshold", "0",
    "-c:a", "aac",
    "-b:a", "128k",
    "-ar", "48000",
    "-ac", "2",
    "-f", "hls",
    "-hls_time", "3",
    "-hls_list_size", "6",
    "-hls_flags", "delete_segments",
    "C:\\tmp\\hls\\teste.m3u8"
  ],
  interpreter: "none",
  cwd: "C:\\tmp\\hls",
  watch: false,
  autorestart: true
}
]
};
