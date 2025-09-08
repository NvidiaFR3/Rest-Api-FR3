const fetch = require("node-fetch");
const AdmZip = require("adm-zip");
const fs = require("fs");
const path = require("path");
const os = require("os");

module.exports = {
  name: "Github Create & Upload",
  desc: "Buat repository private dan upload isi ZIP",
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

      // STEP 1: Download zip
      const zipRes = await fetch(linkzip);
      if (!zipRes.ok) {
        return res.json({ status: false, step: "download", error: "Gagal download ZIP" });
      }
      const buffer = await zipRes.buffer();

      // STEP 2: Extract zip
      const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "gh-"));
      const zip = new AdmZip(buffer);
      zip.extractAllTo(tmpDir, true);

      // STEP 3: Create repo
      const createRepoRes = await fetch("https://api.github.com/user/repos", {
        method: "POST",
        headers: {
          Authorization: `token ${token}`,
          "Content-Type": "application/json",
          "User-Agent": "gh-bot"
        },
        body: JSON.stringify({
          name: repo,
          private: true
        })
      });
      const createRepoData = await createRepoRes.json();
      if (!createRepoRes.ok) {
        return res.json({
          status: false,
          step: "create_repo",
          error: createRepoData.message,
          detail: createRepoData
        });
      }

      const uploadBase = `https://api.github.com/repos/${username}/${repo}/contents`;

      // STEP 4: Upload files
      const uploaded = [];

      async function uploadFile(filePath, relativePath) {
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

        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) {
          return { file: relativePath, error: uploadData.message, detail: uploadData };
        }
        return { file: relativePath, status: "uploaded", sha: uploadData.content?.sha };
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

      res.json({
        status: true,
        repo: `https://github.com/${username}/${repo}`,
        files_uploaded: results
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
