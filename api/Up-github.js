const fetch = require("node-fetch");
const AdmZip = require("adm-zip");
const fs = require("fs");
const path = require("path");
const os = require("os");
const simpleGit = require("simple-git");

module.exports = {
  name: "Github Create & Upload",
  desc: "Buat repo private lalu upload isi zip via git",
  category: "Github",
  path: "/github/create-upload?username=&repo=&token=&linkzip=",

  async run(req, res) {
    try {
      const { username, repo, token, linkzip } = req.query;
      if (!username || !repo || !token || !linkzip) {
        return res.json({ status: false, error: "Missing parameter" });
      }

      // 1. Download zip
      const zipRes = await fetch(linkzip);
      if (!zipRes.ok) return res.json({ status: false, error: "Gagal download zip" });
      const buffer = await zipRes.buffer();

      // 2. Extract zip
      const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "gh-"));
      const zip = new AdmZip(buffer);
      zip.extractAllTo(tmpDir, true);

      // 3. Create repo di GitHub
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
          auto_init: false
        })
      });
      const repoData = await createRepoRes.json();
      if (!createRepoRes.ok) {
        return res.json({ status: false, error: repoData.message, detail: repoData });
      }

      // 4. Init git + push
      const git = simpleGit(tmpDir);
      await git.init();
      await git.add(".");
      await git.commit("Initial commit from zip upload");
      await git.addRemote("origin", `https://${username}:${token}@github.com/${username}/${repo}.git`);
      await git.push("origin", "master");

      res.json({
        status: true,
        repo_url: `https://github.com/${username}/${repo}`
      });

    } catch (err) {
      res.status(500).json({ status: false, error: err.message });
    }
  }
};
