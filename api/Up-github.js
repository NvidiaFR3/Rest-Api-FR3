const fetch = require("node-fetch");
const AdmZip = require("adm-zip");
const fs = require("fs");
const path = require("path");
const os = require("os");

module.exports = {
  name: "Github Create & Upload",
  desc: "Buat repository private lalu upload file dari zip link",
  category: "Github",
  path: "/github/create-upload?username=&repo=&token=&linkzip=",

  async run(req, res) {
    try {
      let { username, repo, token, linkzip } = req.query;
      if (!username || !repo || !token || !linkzip) {
        return res.json({
          status: false,
          error: "Parameter 'username', 'repo', 'token', dan 'linkzip' wajib diisi"
        });
      }

      // 1. Download ZIP
      const zipRes = await fetch(linkzip);
      if (!zipRes.ok) {
        return res.json({ status: false, error: "Gagal download zip" });
      }
      const buffer = await zipRes.buffer();

      // 2. Ekstrak ZIP
      const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "upload-"));
      const zip = new AdmZip(buffer);
      zip.extractAllTo(tmpDir, true);

      // 3. Create repo di GitHub (auto private)
      const createRepoRes = await fetch("https://api.github.com/user/repos", {
        method: "POST",
        headers: {
          "Authorization": `token ${token}`,
          "Content-Type": "application/json",
          "User-Agent": "my-bot"
        },
        body: JSON.stringify({
          name: repo,
          private: true
        })
      });

      const createRepoData = await createRepoRes.json();
      if (!createRepoRes.ok) {
        return res.json({ status: false, error: createRepoData.message });
      }

      const uploadUrl = `https://api.github.com/repos/${username}/${repo}/contents`;

      // 4. Upload file satu per satu
      async function uploadFile(filePath, relativePath) {
        const content = fs.readFileSync(filePath);
        const b64 = content.toString("base64");

        const url = `${uploadUrl}/${relativePath}`;
        const uploadRes = await fetch(url, {
          method: "PUT",
          headers: {
            "Authorization": `token ${token}`,
            "Content-Type": "application/json",
            "User-Agent": "my-bot"
          },
          body: JSON.stringify({
            message: `Add ${relativePath}`,
            content: b64
          })
        });
        return uploadRes.json();
      }

      const uploaded = [];

      function walkDir(dir, base = "") {
        const files = fs.readdirSync(dir);
        for (const file of files) {
          const fullPath = path.join(dir, file);
          const relPath = path.join(base, file);
          if (fs.statSync(fullPath).isDirectory()) {
            walkDir(fullPath, relPath);
          } else {
            uploaded.push(uploadFile(fullPath, relPath));
          }
        }
      }

      walkDir(tmpDir);
      const results = await Promise.all(uploaded);

      res.json({
        status: true,
        repo: `https://github.com/${username}/${repo}`,
        uploaded: results.map(r => ({ path: r.content?.path, sha: r.content?.sha }))
      });

    } catch (err) {
      res.status(500).json({
        status: false,
        error: "Gagal create & upload repo",
        detail: err.message
      });
    }
  }
};
