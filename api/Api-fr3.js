const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports = {
  name: "Download Premium Repo",
  desc: "Generate link download repo private GitHub (ZIP)",
  category: "Premium",
  path: "/premium/github-download?apikey=",

  async run(req, res) {
    const { apikey } = req.query;

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
      const branch = "main";
      const token = process.env.GITHUB_TOKEN;

      const url = `https://api.github.com/repos/${owner}/${repo}/zipball/${branch}`;
      const zipPath = path.join(__dirname, `${repo}.zip`);

      // Download repo ke file lokal
      const response = await axios({
        url,
        method: "GET",
        responseType: "stream",
        headers: {
          Authorization: `token ${token}`,
          Accept: "application/vnd.github.v3+json"
        }
      });

      const writer = fs.createWriteStream(zipPath);
      response.data.pipe(writer);

      writer.on("finish", () => {
        const downloadLink = `/downloads/${repo}.zip`;
        res.json({
          status: true,
          message: "Silakan download repo",
          download: downloadLink
        });
      });

      writer.on("error", (err) => {
        res.status(500).json({
          status: false,
          error: "Gagal menyimpan file ZIP",
          detail: err.message
        });
      });
    } catch (err) {
      return res.status(500).json({
        status: false,
        error: "Gagal fetch repo dari GitHub",
        detail: err.message
      });
    }
  }
};
