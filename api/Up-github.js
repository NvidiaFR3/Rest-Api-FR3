const fetch = require("node-fetch");
const AdmZip = require("adm-zip");
const fs = require("fs");
const path = require("path");
const os = require("os");

module.exports = {
  name: "Github Create & Upload",
  desc: "Buat repo private dari ZIP URL",
  category: "Github",
  path: "/github/create-upload?username=&repo=&token=&linkzip=",

  async run(req, res) {
    try {
      let { username, repo, token, linkzip } = req.query;
      if (!username || !repo || !token || !linkzip) {
        return res.json({
          status: false,
          error: "Wajib isi 'username', 'repo', 'token', dan 'linkzip'"
        });
      }

      // === STEP 1: Download ZIP ===
      const zipRes = await fetch(linkzip);
      if (!zipRes.ok) {
        return res.json({ status: false, step: "download", error: "Gagal download zip" });
      }
      const buffer = await zipRes.buffer();

      // === STEP 2: Extract ZIP ke tmpDir ===
      const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "gh-"));
      const zip = new AdmZip(buffer);
      zip.extractAllTo(tmpDir, true);

      // === STEP 3: Create Repo Private dengan README biar ada commit awal ===
      const createRepoRes = await fetch("https://api.github.com/user/repos", {
        method: "POST",
        headers: {
          Authorization: `token ${token}`,
          "Content-Type": "application/json",
          "User-Agent": "gh-bot"
        },
        body: JSON.stringify({
          name: repo,
          private: true,
          auto_init: true // ← bikin README.md otomatis
        })
      });

      const repoData = await createRepoRes.json();
      if (!createRepoRes.ok) {
        return res.json({
          status: false,
          step: "create_repo",
          error: repoData.message,
          detail: repoData
        });
      }

      const uploadBase = `https://api.github.com/repos/${username}/${repo}/contents`;

      // === STEP 4: Upload files dari zip ke repo ===
      const uploaded = [];

      async function uploadFile(filePath, relativePath) {
        try {
          const content = fs.readFileSync(filePath);
          const b64 = Buffer.from(content).toString("base64");

          const url = `${uploadBase}/${relativePath.replace(/\\/g, "/")}`;
          const uploadRes = await fetch(url, {
            method: "PUT",
            headers: {
              Authorization: `token ${token}`,
              "Content-Type": "application/json",
              "User-Agent": "gh-bot"
            },
            body: JSON.stringify({
              message: `Add ${relativePath}`,
              content: b64
            })
          });

          const data = await uploadRes.json();
          if (!uploadRes.ok) {
            return { file: relativePath, error: data.message };
          }
          return { file: relativePath, status: "uploaded", sha: data.content?.sha };
        } catch (err) {
          return { file: relativePath, error: err.message };
        }
      }

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

      // === RESPONSE ===
      res.json({
        status: true,
        repo: `https://github.com/${username}/${repo}`,
        files: results
      });

    } catch (err) {
      res.status(500).json({
        status: false,
        step: "catch",
        error: err.message,
        stack: err.stack
      });
    }
  }
};
