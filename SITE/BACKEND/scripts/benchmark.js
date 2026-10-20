import http from "http";

function requestMetrics(urlPath, options = {}) {
  return new Promise((resolve, reject) => {
    const startTime = performance.now();
    const req = http.request(
      {
        hostname: "localhost",
        port: 4000,
        path: urlPath,
        method: "GET",
        headers: {
          "Accept": "application/json, text/plain, */*",
          "Accept-Encoding": "gzip, deflate, br",
          "User-Agent": "Thenith-Performance-Benchmarker/1.0",
          ...options.headers,
        },
      },
      (res) => {
        let size = 0;
        let data = "";
        res.on("data", (chunk) => {
          size += chunk.length;
          data += chunk;
        });
        res.on("end", () => {
          const duration = performance.now() - startTime;
          resolve({
            statusCode: res.statusCode,
            duration,
            size,
            headers: res.headers,
            data,
          });
        });
      }
    );

    req.on("error", reject);
    req.end();
  });
}

function calculatePercentiles(samples) {
  const sorted = [...samples].sort((a, b) => a - b);
  const p = (pct) => sorted[Math.floor(sorted.length * (pct / 100))];
  const sum = sorted.reduce((acc, v) => acc + v, 0);
  return {
    min: sorted[0]?.toFixed(2),
    max: sorted[sorted.length - 1]?.toFixed(2),
    avg: (sum / sorted.length).toFixed(2),
    p50: p(50)?.toFixed(2),
    p95: p(95)?.toFixed(2),
    p99: p(99)?.toFixed(2),
  };
}

async function benchmarkEndpoint(name, urlPath, runs = 20) {
  console.log(`\nBenchmarking ${name} (${urlPath}) over ${runs} runs...`);
  // Warm up request
  const warmup = await requestMetrics(urlPath);
  console.log(`  Initial warmup: ${warmup.duration.toFixed(2)}ms (status: ${warmup.statusCode}, size: ${warmup.size} bytes)`);

  const durations = [];
  let lastResult = null;
  for (let i = 0; i < runs; i++) {
    const res = await requestMetrics(urlPath);
    durations.push(res.duration);
    lastResult = res;
    await new Promise((r) => setTimeout(r, 25));
  }

  const stats = calculatePercentiles(durations);
  console.log(`  Results for ${name}:`);
  console.log(`    Status: ${lastResult.statusCode}`);
  console.log(`    Payload Size: ${lastResult.size} bytes`);
  console.log(`    Encoding: ${lastResult.headers["content-encoding"] || "none (uncompressed)"}`);
  console.log(`    Cache-Control: ${lastResult.headers["cache-control"] || "none"}`);
  console.log(`    Min: ${stats.min}ms | Avg: ${stats.avg}ms | p50: ${stats.p50}ms | p95: ${stats.p95}ms | p99: ${stats.p99}ms | Max: ${stats.max}ms`);

  return {
    name,
    path: urlPath,
    stats,
    size: lastResult.size,
    encoding: lastResult.headers["content-encoding"] || "none",
    status: lastResult.statusCode,
  };
}

async function runAll() {
  console.log("===============================================================================");
  console.log("                     THENITH BASELINE PERFORMANCE SUITE                        ");
  console.log("===============================================================================");

  const results = [];
  results.push(await benchmarkEndpoint("Health Check", "/api/health", 25));
  results.push(await benchmarkEndpoint("Public Plans", "/api/plans", 25));
  results.push(await benchmarkEndpoint("Store Products (List)", "/api/products", 25));
  results.push(await benchmarkEndpoint("Store Product (Single)", "/api/products/6abac8e12c2b115f62f4a6c0", 25));
  results.push(await benchmarkEndpoint("Public Profile (User ID)", "/p/2lfby3", 25));
  results.push(await benchmarkEndpoint("Public Profile (Card ID)", "/p/b6cq69", 25));
  results.push(await benchmarkEndpoint("Profile 404 Lookup", "/p/nonexistent_profile_404", 15));

  console.log("\n============================ BASELINE SUMMARY TABLE ============================");
  console.table(
    results.map((r) => ({
      Endpoint: r.name,
      Path: r.path,
      Status: r.status,
      Size: `${r.size} B`,
      Encoding: r.encoding,
      "p50 (ms)": r.stats.p50,
      "p95 (ms)": r.stats.p95,
      "Avg (ms)": r.stats.avg,
      "Max (ms)": r.stats.max,
    }))
  );
}

runAll().catch(console.error);
