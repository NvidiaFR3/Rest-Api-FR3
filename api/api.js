const fs = require("fs");
const path = require("path");

module.exports = {
  name: "Status API",
  desc: "Menampilkan status API seperti total fitur dan total request",
  category: "Tools",
  path: "/tools/statusapi",

  async run(req, res) {
    try {
      const domain = req.query.domain || req.headers.host || "unknown.localhost";

      // Hitung jumlah plugin sebagai total fitur
      const pluginDir = path.join(__dirname, ".."); // asumsi semua plugin di folder atas
      const plugins = fs.readdirSync(pluginDir).filter(file => file.endsWith(".js"));

      // Simulasi log request (bisa diganti pakai DB)
      const logFile = path.join(pluginDir, "request-log.json");
      let totalrequest = 1;

      if (fs.existsSync(logFile)) {
        const logs = JSON.parse(fs.readFileSync(logFile));
        logs.totalrequest += 1;
        fs.writeFileSync(logFile, JSON.stringify(logs, null, 2));
        totalrequest = logs.totalrequest;
      } else {
        fs.writeFileSync(logFile, JSON.stringify({ totalrequest: 1 }, null, 2));
      }

      res.json({
        status: true,
        creator: "Unknown",
        result: {
          status: "Aktif",
          totalrequest: String(totalrequest),
          totalfitur: String(plugins.length),
          domain
        }
      });
    } catch (err) {
      res.status(500).json({
        status: false,
        creator: "FR3nvidia",
        error: err.message
      });
    }
  }
};
