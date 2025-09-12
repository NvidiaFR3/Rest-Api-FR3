const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");
const archiver = require("archiver");

module.exports = {
  name: "Download Repo SSH",
  desc: "Download private repo via SSH clone",
  category: "Premium",
  path: "/premium/github-ssh-download?apikey=",

  async run(req, res) {
    const { apikey } = req.query;
    if (!apikey || !global.apikey.includes(apikey)) {
      return res.json({
        status: false,
        error:
          "Silahkan Beli Apikey Ke https://t.me/fr3newera Ya, Harga Terjangkau."
      });
    }

    const repo = "git@github.com:NvidiaFR3/Rest-Api-FR3.git";
    const repoName = "Rest-Api-FR3";
    const cloneDir = path.join(__dirname, repoName);
    const zipPath = path.join(__dirname, `${repoName}.zip`);

    try {
      // Hapus dulu kalau ada sisa folder lama
      if (fs.existsSync(cloneDir)) fs.rmSync(cloneDir, { recursive: true });
      if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);

      // Clone via SSH
      exec(`git clone ${repo} ${cloneDir}`, (err) => {
        if (err) {
          return res
            .status(500)
            .json({ status: false, error: "Gagal clone repo", detail: err.message });
        }

        // Zip hasil clone
        const output = fs.createWriteStream(zipPath);
        const archive = archiver("zip", { zlib: { level: 9 } });
        archive.pipe(output);
        archive.directory(cloneDir, false);
        archive.finalize();

        output.on("close", () => {
          res.json({
            status: true,
            message: "Silakan download repo",
            download: `/downloads/${repoName}.zip`
          });
        });
      });
    } catch (err) {
      res.status(500).json({
        status: false,
        error: "Gagal proses SSH repo",
        detail: err.message
      });
    }
  }
};
