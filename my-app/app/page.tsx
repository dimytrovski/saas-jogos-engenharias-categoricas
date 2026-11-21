import HlsPlayer from "@/components/HlsPlayer";

export default function HomePage() {
  return (
    <main style={{ padding: "2rem" }}>
      <h1>Live Stream HLS</h1>
      <HlsPlayer src="http://127.0.0.1/hls/teste.m3u8" />
    </main>
  );
}