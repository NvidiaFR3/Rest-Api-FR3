const fs = require('fs');
const path = require('path');

module.exports = {
  name: "API Status",
  desc: "Menampilkan status API: runtime, total request, total endpoint & domain",
  category: "Tools",
  path: "/tools/statusapi",

  run(req, res) {
    const app = req.app;
    const runtimeFile = path.join(__dirname, '..', 'runtime.json');

    // Fungsi bantu: konversi uptime
    const convertUptime = (ms) => {
      const s = Math.floor(ms / 1000) % 60;
      const m = Math.floor(ms / 60000) % 60;
      const h = Math.floor(ms / 3600000) % 24;
      const d = Math.floor(ms / 86400000);
      return `${d}d ${h}h ${m}m ${s}s`;
    };

    // Load data dari runtime.json atau inisialisasi baru
    let data = {
      startTime: Date.now(),
      totalRequest: 0
    };

    try {
      if (fs.existsSync(runtimeFile)) {
        data = JSON.parse(fs.readFileSync(runtimeFile));
        if (!data.startTime) data.startTime = Date.now();
        if (!data.totalRequest) data.totalRequest = 0;
      }
    } catch (err) {
      console.error("❌ Gagal membaca runtime.json:", err);
    }

    // Update total request
    data.totalRequest++;

    // Simpan kembali ke file
    try {
      fs.writeFileSync(runtimeFile, JSON.stringify(data, null, 2));
    } catch (err) {
      console.error("❌ Gagal menyimpan runtime.json:", err);
    }

    // Ambil semua endpoint
    const endpoints = app._router.stack
      .filter(r => r.route && r.route.path)
      .map(r => r.route.path);

    // Hitung uptime
    const uptimeMs = Date.now() - data.startTime;
    const uptime = convertUptime(uptimeMs);

    // Kirim response
    res.json({
      status: true,
      creator: "FR3HOSTING",
      result: {
        domain: req.headers.host,
        total_request: data.totalRequest,
        runtime: uptime,
        total_endpoint: endpoints.length,
        endpoint_list: endpoints // Boleh dihapus kalau mau lebih clean
      }
    });
  }
};
