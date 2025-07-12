let totalRequest = 0;
const startTime = Date.now();

module.exports = {
  name: "API Status",
  desc: "Menampilkan status API: runtime, total request, total endpoint & domain",
  category: "Api",
  path: "/tools/statusapi",

  run(req, res) {
    totalRequest++;

    // Ambil jumlah endpoint dari Express router stack
    const app = req.app;
    const endpoints = app._router.stack
      .filter(r => r.route && r.route.path)
      .map(r => r.route.path);

    const uptimeMs = Date.now() - startTime;
    const uptime = convertUptime(uptimeMs);

    res.json({
      status: true,
      creator: "FR3HOSTING",
      result: {
        domain: req.headers.host,
        total_request: totalRequest,
        runtime: uptime,
        total_endpoint: endpoints.length,
        endpoint_list: endpoints // bisa dihapus jika terlalu panjang
      }
    });
  }
};

function convertUptime(ms) {
  const s = Math.floor(ms / 1000) % 60;
  const m = Math.floor(ms / 60000) % 60;
  const h = Math.floor(ms / 3600000) % 24;
  const d = Math.floor(ms / 86400000);
  return `${d}d ${h}h ${m}m ${s}s`;
}
