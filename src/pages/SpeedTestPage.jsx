import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Activity, Gauge, MonitorPlay, RotateCcw, Wifi } from "lucide-react";

/**
 * @typedef {{
 *   effectiveType?: string;
 *   downlink?: number;
 * }} BrowserConnection
 */

const getConnectionDetails = () => {
  if (typeof navigator === "undefined") {
    return null;
  }

  const browserNavigator = /** @type {Navigator & { connection?: BrowserConnection; mozConnection?: BrowserConnection; webkitConnection?: BrowserConnection }} */ (navigator);
  return browserNavigator.connection || browserNavigator.mozConnection || browserNavigator.webkitConnection || null;
};

const getBestResourceUrl = () => {
  if (typeof window === "undefined" || typeof performance === "undefined") {
    return "/";
  }

  const entries = /** @type {PerformanceResourceTiming[]} */ (performance
    .getEntriesByType("resource"))
    .filter((entry) => {
      if (!entry?.name || typeof entry.name !== "string") {
        return false;
      }

      return entry.name.startsWith(window.location.origin) &&
        !entry.name.includes("/@vite") &&
        !entry.name.includes("hot-update") &&
        !entry.name.includes("sockjs") &&
        !entry.name.includes("__vite_ping");
    })
    .sort((a, b) => {
      const aSize = a.transferSize || a.decodedBodySize || 0;
      const bSize = b.transferSize || b.decodedBodySize || 0;
      return bSize - aSize;
    });

  if (entries.length > 0) {
    return entries[0].name;
  }

  return "/";
};

const withCacheBust = (url, label) => {
  const nextUrl = new URL(url, window.location.origin);
  nextUrl.searchParams.set("_subflix_speed", `${label}-${Date.now()}-${Math.random()}`);
  return nextUrl.toString();
};

const measureLatency = async () => {
  const attempts = [];

  for (let index = 0; index < 4; index += 1) {
    const startedAt = performance.now();
    await fetch(withCacheBust("/", `ping-${index}`), {
      cache: "no-store",
      method: "GET",
    });
    attempts.push(performance.now() - startedAt);
  }

  return Math.round(attempts.reduce((sum, value) => sum + value, 0) / attempts.length);
};

const measureDownloadMbps = async () => {
  const target = getBestResourceUrl();
  let totalBytes = 0;
  let totalMs = 0;

  for (let index = 0; index < 3; index += 1) {
    const startedAt = performance.now();
    const response = await fetch(withCacheBust(target, `download-${index}`), {
      cache: "no-store",
    });
    const blob = await response.blob();
    totalBytes += blob.size;
    totalMs += performance.now() - startedAt;
  }

  const seconds = totalMs / 1000;
  const megabits = (totalBytes * 8) / 1_000_000;
  return Number((megabits / Math.max(seconds, 0.001)).toFixed(1));
};

const getStreamingRecommendation = (speedMbps, latencyMs) => {
  if (!speedMbps && !latencyMs) {
    return "Run the test to get a streaming recommendation.";
  }

  if (speedMbps >= 25 && latencyMs <= 60) {
    return "Great for HD streaming, fast artwork loads, and responsive browsing.";
  }

  if (speedMbps >= 10 && latencyMs <= 120) {
    return "Good for everyday streaming, though heavy background traffic may still cause buffering.";
  }

  if (speedMbps >= 5) {
    return "Usable, but playback may buffer sometimes. Try reducing background downloads for smoother watching.";
  }

  return "This connection looks slow for streaming right now. Try moving closer to your router or pausing other downloads.";
};

export default function SpeedTestPage({ standalone = false }) {
  const [status, setStatus] = useState("idle");
  const [results, setResults] = useState({
    latencyMs: null,
    speedMbps: null,
    testedAt: null,
  });
  const [error, setError] = useState("");

  const connection = useMemo(() => getConnectionDetails(), []);
  const recommendation = getStreamingRecommendation(results.speedMbps, results.latencyMs);

  const runTest = async () => {
    setStatus("running");
    setError("");

    try {
      const latencyMs = await measureLatency();
      const speedMbps = await measureDownloadMbps();

      setResults({
        latencyMs,
        speedMbps,
        testedAt: new Date(),
      });
      setStatus("done");
    } catch (nextError) {
      setStatus("error");
      setError("The speed test could not finish. Try again in a moment.");
    }
  };

  return (
    <div className={`min-h-screen bg-[#0a0a0a] text-white ${standalone ? "" : "pt-24"}`}>
      {standalone && (
        <div className="px-4 md:px-12 py-6 border-b border-white/10">
          <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
            <Link to="/" className="text-[#E50914] font-black text-3xl tracking-tight select-none">
              SUBFLIX
            </Link>
            <Link to="/" className="text-sm text-gray-300 hover:text-white transition-colors">
              Back
            </Link>
          </div>
        </div>
      )}

      <div className="px-4 md:px-12 py-12">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs uppercase tracking-[0.35em] text-[#E50914] mb-4">Support</p>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4">Speed Test</h1>
          <p className="text-gray-400 max-w-3xl text-base md:text-lg leading-relaxed mb-10">
            Test your current connection directly from Subflix to estimate how it should handle browsing and streaming.
          </p>

          <div className="grid gap-4 md:grid-cols-3 mb-8">
            <StatCard
              icon={Gauge}
              label="Download Estimate"
              value={results.speedMbps ? `${results.speedMbps} Mbps` : "--"}
              note="Measured from app assets with a fresh download"
            />
            <StatCard
              icon={Activity}
              label="Ping"
              value={results.latencyMs ? `${results.latencyMs} ms` : "--"}
              note="Lower latency usually feels more responsive"
            />
            <StatCard
              icon={Wifi}
              label="Browser Network"
              value={connection?.effectiveType?.toUpperCase?.() || "Unknown"}
              note={connection?.downlink ? `${connection.downlink} Mbps reported by browser` : "Browser estimate not available"}
            />
          </div>

          <div className="rounded-3xl border border-white/10 bg-[linear-gradient(180deg,#141414_0%,#0f0f0f_100%)] p-6 md:p-8 mb-6">
            <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-gray-500 mb-2">Live Test</p>
                <h2 className="text-2xl font-bold mb-2">Run a fresh connection check</h2>
                <p className="text-gray-400 max-w-2xl">
                  The test checks latency and download speed against the current app origin, then turns that into a streaming recommendation.
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={runTest}
                  disabled={status === "running"}
                  className="bg-[#E50914] hover:bg-[#c40812] disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 py-3 rounded-xl font-semibold transition-colors"
                >
                  {status === "running" ? "Testing..." : "Run Speed Test"}
                </button>
                {status !== "idle" && (
                  <button
                    onClick={() => {
                      setStatus("idle");
                      setError("");
                      setResults({ latencyMs: null, speedMbps: null, testedAt: null });
                    }}
                    className="border border-white/15 hover:border-white/35 text-white px-5 py-3 rounded-xl font-semibold transition-colors"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
            {status === "running" && (
              <div className="mt-6">
                <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                  <div className="h-full w-1/2 bg-[#E50914] animate-pulse" />
                </div>
              </div>
            )}
            {error && <p className="mt-4 text-sm text-red-400">{error}</p>}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <section className="rounded-3xl border border-white/10 bg-[linear-gradient(180deg,#141414_0%,#0f0f0f_100%)] p-6">
              <div className="flex items-center gap-3 mb-4">
                <MonitorPlay className="w-5 h-5 text-[#E50914]" />
                <h2 className="text-xl font-bold">Streaming Recommendation</h2>
              </div>
              <p className="text-gray-300 leading-relaxed">{recommendation}</p>
              {results.testedAt && (
                <p className="text-xs text-gray-500 mt-4">
                  Last tested at {results.testedAt.toLocaleTimeString()}.
                </p>
              )}
            </section>

            <section className="rounded-3xl border border-white/10 bg-[linear-gradient(180deg,#141414_0%,#0f0f0f_100%)] p-6">
              <h2 className="text-xl font-bold mb-4">Tips</h2>
              <div className="space-y-3 text-gray-300">
                <p>Pause large downloads or cloud sync jobs before streaming.</p>
                <p>If you are on Wi-Fi, moving closer to the router can improve stability.</p>
                <p>Running the test more than once can give a more realistic picture of your connection.</p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, note }) {
  return (
    <section className="rounded-3xl border border-white/10 bg-[linear-gradient(180deg,#141414_0%,#0f0f0f_100%)] p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-11 h-11 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
          <Icon className="w-5 h-5 text-[#E50914]" />
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-gray-500">{label}</p>
          <p className="text-2xl font-black mt-1">{value}</p>
        </div>
      </div>
      <p className="text-gray-400 text-sm leading-relaxed">{note}</p>
    </section>
  );
}
