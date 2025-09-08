// github-create-upload-git.js
const axios = require("axios");
const AdmZip = require("adm-zip");
const fs = require("fs");
const path = require("path");
const os = require("os");
const { execSync } = require("child_process");

module.exports = {
  name: "Github Create & Upload (git)",
  desc: "Download ZIP from link, extract, create private repo and push via git",
  category: "Tools",
  path: "/github/create-upload-git?username=&repo=&token=&linkzip=",

  async run(req, res) {
    try {
      const { username, repo, token, linkzip } = req.query;

      if (!username || !repo || !token || !linkzip) {
        return res.json({ status: false, error: "Missing parameter: username, repo, token, linkzip are required" });
      }

      // Basic validations
      if (!/^https?:\/\//i.test(linkzip)) {
        return res.json({ status: false, error: "linkzip must be a valid http/https URL" });
      }

      // Create temp working dir
      const workDir = fs.mkdtempSync(path.join(os.tmpdir(), `gh-upload-${Date.now()}-`));
      const zipPath = path.join(workDir, "project.zip");
      const extractDir = path.join(workDir, "extract");

      fs.mkdirSync(extractDir);

      // STEP 1: Download ZIP
      const downloadRes = await axios.get(linkzip, { responseType: "arraybuffer", timeout: 60000 });
      fs.writeFileSync(zipPath, Buffer.from(downloadRes.data));

      // STEP 2: Extract ZIP
      try {
        const zip = new AdmZip(zipPath);
        zip.extractAllTo(extractDir, true);
      } catch (e) {
        // try fallback: if the zip contains top-level folder, extraction still ok; else return error
        return res.status(500).json({ status: false, step: "extract", error: "Failed to extract zip", detail: e.message });
      }

      // STEP 3: Create repo on GitHub (private) using API
      // Using GitHub API to create repo under authenticated user
      const createResp = await axios.post(
        "https://api.github.com/user/repos",
        { name: repo, private: true, auto_init: false }, // no auto init: we will push files
        { headers: { Authorization: `token ${token}`, "User-Agent": username, Accept: "application/vnd.github.v3+json" }, timeout: 15000 }
      ).catch(err => err.response ? err.response.data : { message: err.message });

      if (createResp && createResp.message && createResp.message !== "null" && createResp.message !== "Created") {
        // createResp may be an object with message on error
        // If it's an error structure, return
        if (createResp.message) {
          // If repository already exists, return specific message but continue optionally
          if (createResp.message.toLowerCase().includes("already exists")) {
            return res.status(400).json({ status: false, step: "create_repo", error: `Repository '${repo}' already exists in ${username}` });
          }
          return res.status(500).json({ status: false, step: "create_repo", error: createResp.message, detail: createResp });
        }
      }

      // STEP 4: Prepare local repo folder to commit.
      // Note: extracted zip often contains a single top-level folder. We want to push its contents (not the wrapper dir).
      // If extractDir has exactly one folder and no files, use that folder as root.
      const children = fs.readdirSync(extractDir);
      let repoRoot = extractDir;
      if (children.length === 1) {
        const single = path.join(extractDir, children[0]);
        if (fs.statSync(single).isDirectory()) {
          repoRoot = single;
        }
      }

      // Ensure .gitignore or such doesn't interfere; we will init git here
      // STEP 5: Init git, add files, commit, push using token auth in remote URL
      try {
        // init with main branch (git >= 2.28 supports --initial-branch)
        try {
          execSync(`git init --initial-branch=main`, { cwd: repoRoot, stdio: "ignore" });
        } catch (e) {
          // fallback for older git
          execSync(`git init`, { cwd: repoRoot, stdio: "ignore" });
          execSync(`git checkout -b main`, { cwd: repoRoot, stdio: "ignore" });
        }

        // configure local git user to avoid errors
        execSync(`git config user.email "auto@local"`, { cwd: repoRoot });
        execSync(`git config user.name "auto-upload"`, { cwd: repoRoot });

        // Add all files
        execSync(`git add .`, { cwd: repoRoot });

        // commit (if there are files to commit)
        // check status for any changes
        const statusOut = execSync(`git status --porcelain`, { cwd: repoRoot }).toString().trim();
        if (statusOut.length === 0) {
          // nothing to commit
          // still proceed to create an empty commit to guarantee branch exists
          execSync(`git commit --allow-empty -m "Initial commit (empty)"`, { cwd: repoRoot });
        } else {
          execSync(`git commit -m "Initial commit from zip upload"`, { cwd: repoRoot });
        }

        // set remote using token (make sure to encode token)
        const safeToken = encodeURIComponent(token);
        const remoteUrl = `https://${username}:${safeToken}@github.com/${username}/${repo}.git`;

        execSync(`git remote add origin ${remoteUrl}`, { cwd: repoRoot });
        // push to GitHub (set upstream)
        execSync(`git push -u origin main --force`, { cwd: repoRoot, stdio: "inherit", timeout: 10 * 60 * 1000 });
      } catch (gitErr) {
        // capture stderr if available
        return res.status(500).json({ status: false, step: "git_push", error: gitErr.message, detail: gitErr.stderr ? gitErr.stderr.toString() : undefined });
      }

      // Success: cleanup optional (you can remove temp dir)
      // fs.rmSync(workDir, { recursive: true, force: true });

      return res.json({
        status: true,
        message: "Repo created and pushed successfully",
        repo_url: `https://github.com/${username}/${repo}`
      });
    } catch (err) {
      return res.status(500).json({ status: false, step: "catch", error: err.message, stack: err.stack });
    }
  }
};
