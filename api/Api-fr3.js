const axios = require("axios");

module.exports = {
  name: "Get Source Premium",
  desc: "Ambil isi source code dari GitHub Private Repo",
  category: "Premium",
  path: "/premium/getsource?apikey=",

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
      const path = "";
      const token = process.env.GITHUB_TOKEN;

      const response = await axios.get(
        `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
        {
          headers: {
            Authorization: `token ${token}`,
            Accept: "application/vnd.github.v3+json"
          }
        }
      );

      return res.json({
        status: true,
        repo: `${owner}/${repo}`,
        files: response.data
      });
    } catch (err) {
      return res.status(500).json({
        status: false,
        error: "Gagal mengambil data dari GitHub",
        detail: err.message
      });
    }
  }
};
