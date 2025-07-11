const fs = require("fs");
const path = require("path");

module.exports = {
  name: "Status API",
  desc: "Menampilkan status API dengan menghitung jumlah plugin",
  category: "Tools",
  path: "/tools/statusapi",

  async run(req, res) {
    try {
      const folderPath = path.join(__dirname); // Ini folder /api/
      let totalFitur = 0;

      fs.readdirSync(folderPath).forEach(file => {
        if (!file.endsWith(".js")) return;

        const plugin = require(path.join(folderPath, file));
        const isArray = Array.isArray(plugin);
        totalFitur += isArray ? plugin.length : 1;
      });

      const domain = `${req.headers["x-forwarded-proto"] || "https"}://${req.headers.host}`;
      
      res.json({
        status: true,
        creator: "FR3nvidia",
        result: {
          status: "Aktif",
          totalrequest: "N/A (statik/manual)",
          totalfitur: String(totalFitur),
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
