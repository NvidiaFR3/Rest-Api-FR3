const axios = require("axios");

module.exports = {
  name: "Download Source Premium",
  desc: "Download repo private GitHub dalam format ZIP",
  category: "Premium",
  path: "/premium/download?apikey=",

  async run(req, res) {
    const { apikey } = req.query;

    if (!apikey || !global.apikey.includes(apikey)) {
      return res.json({
        status: false,
        error: "Silahkan Beli Apikey Ke https://t.me/fr3newera Ya, Harga Terjangkau."
      });
    }

    try {
      const owner = "NvidiaFR3";
      const repo = "Rest-Api-FR3";
      const branch = "main"; // bisa ubah kalau mau branch lain
      const token = process.env.GITHUB_TOKEN;

      const response = await axios.get(
        `https://api.github.com/repos/${owner}/${repo}/zipball/${branch}`,
        {
          headers: {
            Authorization: `token ${token}`,
            Accept: "application/vnd.github.v3+json"
          },
          responseType: "arraybuffer" // supaya hasilnya file binary ZIP
        }
      );

      res.setHeader("Content-Type", "application/zip");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=${repo}-${branch}.zip`
      );

      return res.send(response.data);
    } catch (err) {
      return res.status(500).json({
        status: false,
        error: "Gagal download ZIP dari GitHub",
        detail: err.message
      });
    }
  }
};
