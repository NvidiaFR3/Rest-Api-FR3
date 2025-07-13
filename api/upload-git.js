const fetch = require("node-fetch");
const AdmZip = require("adm-zip");
const fs = require("fs");
const path = require("path");
const { tmpdir } = require("os");

module.exports = {
  name: "Upload GitHub",
  desc: "Automatically uploads files from a ZIP URL to a GitHub repository",
  category: "Tools",
  path: "/tools/githubupload?username=&repository=&token=&zipUrl=",

  async run(req, res) {
    const { username, repository, token, zipUrl } = req.query;

    if (!username || !repository || !token || !zipUrl) {
      return res.status(400).json({
        status: false,
        error: "Semua parameter wajib diisi: username, repository, token, zipUrl",
      });
    }

    try {
      // 1. Download ZIP
      const response = await fetch(zipUrl);
      if (!response.ok) throw new Error("Gagal download ZIP");
      const buffer = await response.buffer();

      const zip = new AdmZip(buffer);
      const extractPath = path.join(tmpdir(), `gh-upload-${Date.now()}`);
      zip.extractAllTo(extractPath, true);

      // 2. Get repo default branch
      const repoInfo = await fetch(`https://api.github.com/repos/${username}/${repository}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github+json",
        },
      }).then(res => res.json());

      const branch = repoInfo.default_branch || "main";

      // 3. Upload each file
      const uploadFile = async (filePath, relativePath) => {
        const content = fs.readFileSync(filePath, { encoding: "base64" });

        const apiUrl = `https://api.github.com/repos/${username}/${repository}/contents/${relativePath}`;
        const resp = await fetch(apiUrl, {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/vnd.github+json",
          },
          body: JSON.stringify({
            message: `upload ${relativePath}`,
            content,
            branch,
          }),
        });

        if (!resp.ok) {
          const error = await resp.text();
          throw new Error(`Upload gagal di ${relativePath}: ${error}`);
        }
      };

      const walkAndUpload = async (dir, base = "") => {
        const entries = fs.readdirSync(dir);
        for (const entry of entries) {
          const fullPath = path.join(dir, entry);
          const relPath = path.join(base, entry).replace(/\\/g, "/");
          if (fs.statSync(fullPath).isDirectory()) {
            await walkAndUpload(fullPath, relPath);
          } else {
            await uploadFile(fullPath, relPath);
          }
        }
      };

      await walkAndUpload(extractPath);

      return res.json({
        status: true,
        message: "Berhasil upload semua file ke GitHub",
        repository: `https://github.com/${username}/${repository}`,
      });
    } catch (err) {
      return res.status(500).json({
        status: false,
        error: err.message,
      });
    }
  },
};
