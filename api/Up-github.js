const fetch = require("node-fetch");
const AdmZip = require("adm-zip");
const fs = require("fs");
const path = require("path");
const os = require("os");

module.exports = {
  name: "Github Create & Upload",
  desc: "Buat repo private dari ZIP URL (upload jalan di background)",
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

      // === STEP 1: Create Repo dengan README (commit awal) ===
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
          auto_init: true
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

      // === STEP 2: Kirim respon cepat ke client ===
      res.json({
        status: true,
        message: "Repo berhasil dibuat, upload file sedang diproses di background",
        repo_url: `https://github.com/${username}/${repo}`
      });

      // === STEP 3: Lanjut proses upload file zip di background ===
      const zipRes = await fetch(linkzip);
      if (!zipRes.ok) return console.error("Gagal download zip");

      const buffer = await zipRes.buffer();
      const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "gh-"));
      const zip = new AdmZip(buffer);
      zip.extractAllTo(tmpDir, true);

      const uploadBase = `https://api.github.com/repos/${username}/${repo}/contents`;

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
            console.error("Upload gagal:", relativePath, data.message);
          } else {
            console.log("Uploaded:", relativePath);
          }
        } catch (err) {
          console.error("Upload error:", relativePath, err.message);
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
            uploadFile(fullPath, relPath);
          }
        }
      }

      walkDir(tmpDir);

    } catch (err) {
      res.status(500).json({
        status: false,
        step: "catch",
        error: err.message
      });
    }
  }
};
