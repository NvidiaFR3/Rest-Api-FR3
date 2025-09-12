const axios = require("axios");

module.exports = {
  name: "Get Source Premium",
  desc: "Ambil source code API Premium dari repo private",
  category: "Premium",
  path: "/premium/getsource?apikey=",

  async run(req, res) {
    const { apikey } = req.query;

    // cek apakah apikey valid
    if (!apikey || !global.apikey.includes(apikey)) {
      return res.json({
        status: false,
        error: "Silahkan Beli Apikey Ke https://t.me/fr3newera Ya, Harga Terjangkau."
      });
    }

    try {
      const owner = "NvidiaFR3";
      const repo = "Rest-Api-FR3";
      const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

      if (!GITHUB_TOKEN) {
        return res.status(500).json({
          status: false,
          error: "GITHUB_TOKEN belum di set di .env"
        });
      }

      const response = await axios.get(
        `https://api.github.com/repos/${owner}/${repo}/contents`,
        {
          headers: {
            Authorization: `token ${GITHUB_TOKEN}`,
            "User-Agent": owner
          }
        }
      );

      res.json({
        status: true,
        repo: `${owner}/${repo}`,
        files: response.data.map(f => ({
          name: f.name,
          path: f.path,
          type: f.type,
          download_url: f.download_url
        }))
      });
    } catch (err) {
      res.status(500).json({
        status: false,
        error: "Gagal mengakses repo private",
        detail: err.message
      });
    }
  }
};
