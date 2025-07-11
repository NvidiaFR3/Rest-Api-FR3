module.exports = {
  name: "Status API",
  desc: "Menampilkan info status API",
  category: "Tools",
  path: "/tools/statusapi",

  async run(req, res) {
    try {
      const protocol = req.headers["x-forwarded-proto"] || "https";
      const host = req.headers.host || "localhost";
      const domain = `${protocol}://${host}`;

      const indexData = require("../index");
      const totalfitur = indexData._totalRoutes || global.totalRoutes || 0;
      const totalrequest = indexData._totalreq || global.totalreq || 0;

      res.json({
        status: true,
        creator: "Unknown",
        result: {
          status: "Aktif",
          totalrequest: String(totalrequest),
          totalfitur: String(totalfitur),
          domain
        }
      });
    } catch (err) {
      res.status(500).json({
        status: false,
        creator: "Unknown",
        error: err.message
      });
    }
  }
};
