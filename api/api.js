module.exports = {
  name: "Status API",
  desc: "Menampilkan info status API dari sistem",
  category: "Tools",
  path: "/tools/statusapi",

  async run(req, res) {
    try {
      const protocol = req.headers["x-forwarded-proto"] || "https";
      const host = req.headers.host || "localhost";
      const domain = `${protocol}://${host}`;

      const totalfitur = require("../index")._totalRoutes || global.totalRoutes || 0;
      const totalrequest = global.totalreq || 0;

      res.json({
        status: true,
        creator: "FR3nvidia",
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
        creator: "FR3nvidia",
        error: err.message
      });
    }
  }
};
