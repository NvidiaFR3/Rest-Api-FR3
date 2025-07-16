const path = require('path');

// Simpan data runtime di memory
let runtimeData = {
  startTime: Date.now(),
  totalRequest: 0
};

module.exports = {
  name: "API Status",
  desc: "Menampilkan status API: runtime, total request, total endpoint & domain",
  category: "Tools",
  path: "/tools/statusapi",

  run(req, res) {
    const app = req.app;

    // Fungsi bantu: konversi uptime
    const convertUptime = (ms) => {
      const s = Math.floor(ms / 1000) % 60;
      const m = Math.floor(ms / 60000) % 60;
      const h = Math.floor(ms / 3600000) % 24;
      const d = Math.floor(ms / 86400000);
      return `${d}d ${h}h ${m}m ${s}s`;
    };

    // Update total request
    runtimeData.totalRequest++;

    // Ambil semua endpoint
    const endpoints = app._router.stack
      .filter(r => r.route && r.route.path)
      .map(r => r.route.path);

    // Hitung uptime
    const uptimeMs = Date.now() - runtimeData.startTime;
    const uptime = convertUptime(uptimeMs);

    // Kirim response
    res.json({
      status: true,
      creator: "FR3HOSTING",
      result: {
        domain: req.headers.host,
        total_request: runtimeData.totalRequest,
        runtime: uptime,
        total_endpoint: endpoints.length,
        endpoint_list: endpoints // Boleh dihapus kalau mau lebih clean
      }
    });
  }
};
