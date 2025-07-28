/* Upload-ZIP-to-GitHub.js */
const fetch = require("node-fetch");
const AdmZip = require("adm-zip");
const fs = require("fs");
const path = require("path");
const { tmpdir } = require("os");

module.exports = {
  name: "Upload ZIP to GitHub",
  desc: "Automatically uploads files from a ZIP URL to a GitHub repository",
  category: "Tools",
  path: "/tools/githubupload?username=&repository=&token=&zipUrl=",

  async run(req, res) {
    const { username, repository, token, zipUrl } = req.query;

    // --- Basic validation ----------------------------------------------------
    if (!username || !repository || !token || !zipUrl) {
      return res.status(400).json({
        status: false,
        error: "Missing required parameters: username, repository, token, zipUrl",
      });
    }
    if (!token.startsWith("ghp_") && !token.startsWith("github_pat_")) {
      return res.status(400).json({
        status: false,
        error: "Token does not look like a valid GitHub PAT",
      });
    }

    // --- Helper: GitHub API ---------------------------------------------------
    const api = (endpoint) => `https://api.github.com/repos/${username}/${repository}${endpoint}`;
    const ghHeaders = {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "User-Agent": "upload-zip-script",
    };

    let extractPath;
    try {
      // 1. Download & unzip ----------------------------------------------------
      const zipResp = await fetch(zipUrl);
      if (!zipResp.ok) throw new Error(`Failed to fetch ZIP: ${zipResp.status} ${zipResp.statusText}`);
      const buffer = await zipResp.buffer();

      const zip = new AdmZip(buffer);
      extractPath = path.join(tmpdir(), `gh-upload-${Date.now()}`);
      zip.extractAllTo(extractPath, /* overwrite = */ true);

      // 2. Repo info (default branch) -----------------------------------------
      const repoInfo = await fetch(api(""), { headers: ghHeaders }).then(r => r.json());
      if (repoInfo.message) throw new Error(`GitHub: ${repoInfo.message}`);
      const branch = repoInfo.default_branch || "main";

      // 3. Read every extracted file ------------------------------------------
      const files = [];
      const walk = (dir, base = "") => {
        for (const entry of fs.readdirSync(dir)) {
          const fullPath = path.join(dir, entry);
          const relPath = path.posix.join(base, entry);
          if (fs.statSync(fullPath).isDirectory()) {
            walk(fullPath, relPath);
          } else {
            files.push({ fullPath, relPath });
          }
        }
      };
      walk(extractPath);

      // 4. Build one commit with all files -------------------------------------
      const treeItems = [];
      for (const { fullPath, relPath } of files) {
        // Get current SHA if file exists
        const getResp = await fetch(api(`/contents/${relPath}?ref=${branch}`), {
          headers: ghHeaders,
        });
        let sha = null;
        if (getResp.ok) {
          sha = (await getResp.json()).sha;
        } else if (getResp.status !== 404) {
          // Unexpected error
          throw new Error(`Failed to check ${relPath}: ${getResp.statusText}`);
        }

        // Create blob
        const content = fs.readFileSync(fullPath, "utf8");
        const blobResp = await fetch(api("/git/blobs"), {
          method: "POST",
          headers: ghHeaders,
          body: JSON.stringify({ content, encoding: "utf-8" }),
        });
        if (!blobResp.ok) throw new Error(`Failed to create blob for ${relPath}`);
        const { sha: blobSha } = await blobResp.json();

        treeItems.push({
          path: relPath,
          mode: "100644",
          type: "blob",
          sha: blobSha,
        });
      }

      // Latest commit SHA
      const refResp = await fetch(api(`/git/refs/heads/${branch}`), { headers: ghHeaders });
      if (!refResp.ok) throw new Error(`Failed to fetch ref ${branch}`);
      const { object: { sha: parentSha } } = await refResp.json();

      // Create tree
      const treeResp = await fetch(api("/git/trees"), {
        method: "POST",
        headers: ghHeaders,
        body: JSON.stringify({ base_tree: parentSha, tree: treeItems }),
      });
      if (!treeResp.ok) throw new Error("Failed to create tree");
      const { sha: treeSha } = await treeResp.json();

      // Create commit
      const commitResp = await fetch(api("/git/commits"), {
        method: "POST",
        headers: ghHeaders,
        body: JSON.stringify({
          message: "chore: bulk upload from ZIP",
          tree: treeSha,
          parents: [parentSha],
        }),
      });
      if (!commitResp.ok) throw new Error("Failed to create commit");
      const { sha: commitSha } = await commitResp.json();

      // Update branch ref
      const updateResp = await fetch(api(`/git/refs/heads/${branch}`), {
        method: "PATCH",
        headers: ghHeaders,
        body: JSON.stringify({ sha: commitSha }),
      });
      if (!updateResp.ok) throw new Error("Failed to update branch");

      return res.json({
        status: true,
        message: "Successfully uploaded all files to GitHub",
        repository: `https://github.com/${username}/${repository}`,
        commit: commitSha,
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ status: false, error: err.message });
    } finally {
      // Clean up temp folder
      if (extractPath && fs.existsSync(extractPath)) {
        fs.rmSync(extractPath, { recursive: true, force: true });
      }
    }
  },
};
      
