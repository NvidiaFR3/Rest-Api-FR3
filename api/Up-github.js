const axios = require("axios");
const AdmZip = require("adm-zip");
const fs = require("fs");
const path = require("path");
const os = require("os");

module.exports = {
  name: "GithubUploader",
  desc: "Create repo & upload project from ZIP",
  category: "Tools",
  path: "/tools/github-uploader?username=&repo=&token=&linkzip=",

  async run(req, res) {
    const { username, repo, token, linkzip } = req.query;
    if (!username || !repo || !token || !linkzip) {
      return res.json({ 
        status: false, 
        error: "Wajib isi username, repo, token, dan linkzip" 
      });
    }

    try {
      // 1. Download ZIP dari linkzip
      const zipPath = path.join(os.tmpdir(), "temp_repo.zip");
      const response = await axios.get(linkzip, { responseType: "arraybuffer" });
      fs.writeFileSync(zipPath, response.data);

      // 2. Ekstrak ZIP
      const extractPath = path.join(os.tmpdir(), "repo_extract_" + Date.now());
      fs.mkdirSync(extractPath);
      const zipFile = new AdmZip(zipPath);
      zipFile.extractAllTo(extractPath, true);

      // 3. Buat Repo Baru
      const createRepo = await axios.post(
        "https://api.github.com/user/repos",
        { name: repo, private: false },
        { headers: { Authorization: `token ${token}`, "User-Agent": "ZipUploader" } }
      );

      if (!createRepo.data) throw new Error("Gagal membuat repository!");

      // 4. Upload semua file hasil ekstrak
      async function uploadFile(filePath, relativePath) {
        const content = fs.readFileSync(filePath).toString("base64");
        await axios.put(
          `https://api.github.com/repos/${username}/${repo}/contents/${relativePath}`,
          {
            message: `Upload ${relativePath}`,
            content: content,
          },
          { headers: { Authorization: `token ${token}`, "User-Agent": "ZipUploader" } }
        );
      }

      function walk(dir) {
        fs.readdirSync(dir).forEach((file) => {
          const fullPath = path.join(dir, file);
          const relativePath = path.relative(extractPath, fullPath).replace(/\\/g, "/");
          if (fs.statSync(fullPath).isDirectory()) {
            walk(fullPath);
          } else {
            uploadFile(fullPath, relativePath);
          }
        });
      }

      walk(extractPath);

      res.json({
        status: true,
        message: "Repo berhasil dibuat & file berhasil diupload",
        repo_url: `https://github.com/${username}/${repo}`,
      });
    } catch (err) {
      res.status(500).json({ status: false, error: err.message });
    }
  },
};
