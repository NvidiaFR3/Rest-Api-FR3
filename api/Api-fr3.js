const axios = require("axios");

module.exports = {
  name: "Download Premium Repo",
  desc: "Generate link download repo private GitHub dalam format ZIP",
  category: "Premium",
  path: "/premium/github-download?apikey=",

  async run(req, res) {
    const { apikey } = req.query;

    // Validasi APIKEY
    if (!apikey || !global.apikey.includes(apikey)) {
      return res.json({
        status: false,
        error:
          "Silahkan Beli Apikey Ke https://t.me/fr3newera Ya, Harga Terjangkau."
      });
    }

    try {
      const owner = "NvidiaFR3";
      const repo = "Rest-Api-FR3";
      const branch = "main"; // bisa diganti kalau mau
      const token = process.env.GITHUB_TOKEN;

      // Coba cek dulu apakah repo bisa diakses
      await axios.get(`https://api.github.com/repos/${owner}/${repo}`, {
        headers: {
          Authorization: `token ${token}`,
          Accept: "application/vnd.github.v3+json"
        }
      });

      // Generate link download ZIP
      const downloadUrl = `https://api.github.com/repos/${owner}/${repo}/zipball/${branch}?token=${token}`;

      res.json({
        status: true,
        message: "Gunakan link berikut untuk download repo",
        download: downloadUrl
      });
    } catch (err) {
      console.error("❌ GitHub Error:", err.message);
      return res.status(500).json({
        status: false,
        error: "Gagal generate link download repo",
        detail: err.message
      });
    }
  }
};
