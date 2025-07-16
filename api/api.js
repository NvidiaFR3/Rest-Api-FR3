const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'runtime.json');

function loadRuntimeData() {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify({ startTime: Date.now(), totalRequest: 0 }, null, 2));
  }

  try {
    const data = JSON.parse(fs.readFileSync(filePath));
    if (!data.startTime) data.startTime = Date.now();
    return data;
  } catch (err) {
    return { startTime: Date.now(), totalRequest: 0 };
  }
}

function saveRuntimeData(data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

module.exports = {
  name: "API Status",
  desc: "Menampilkan status API: runtime, total request, total endpoint & domain",
  category: "Tools",
  path: "/tools/statusapi",

  run(req, res) {
    const app = req.app;
    const endpoints = app._router.stack
      .filter(r => r.route && r.route.path)
      .map(r => r.route.path);

    const runtimeData = loadRuntimeData();

    // Update total request
    runtimeData.totalRequest++;
    saveRuntimeData(runtimeData);

    const uptimeMs = Date.now() - runtimeData.startTime;
    const uptime = convertUptime(uptimeMs);

    res.json({
      status: true,
      creator: "FR3HOSTING",
      result: {
        domain: req.headers.host,
        total_request: runtimeData.totalRequest,
        runtime: uptime,
        total_endpoint: endpoints.length,
        endpoint_list: endpoints
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
