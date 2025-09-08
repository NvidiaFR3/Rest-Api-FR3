// api/githubUploader.js
const axios = require("axios");
const AdmZip = require("adm-zip");
const fs = require("fs");
const path = require("path");
const os = require("os");

async function createRepo(username, repo, token) {
  const url = "https://api.github.com/user/repos";
  const response = await axios.post(
    url,
    { name: repo, private: false },
    { headers: { Authorization: `token ${token}`, "User-Agent": username } }
  );
  return response.data;
}

async function uploadFiles(username, repo, token, localDir) {
  const files = fs.readdirSync(localDir, { withFileTypes: true });

  for (const file of files) {
    const filePath = path.join(localDir, file.name);

    if (file.isDirectory()) {
      await uploadFiles(username, repo, token, filePath);
    } else {
      const content = fs.readFileSync(filePath, "base64");
      const relativePath = path.relative(localDir, filePath);

      const url = `https://api.github.com/repos/${username}/${repo}/contents/${relativePath}`;
      await axios.put(
        url,
        {
          message: `Upload ${relativePath}`,
          content: content,
        },
        { headers: { Authorization: `token ${token}`, "User-Agent": username } }
      );
    }
  }
}

module.exports = [
  {
    name: "Github Uploader",
    desc: "Create & upload repo from zip link",
    category: "Tools",
    path: "/tools/github?username=&repo=&token=&linkzip=&option=",
    async run(req, res) {
      const { username, repo, token, linkzip, option } = req.query;
      if (!username || !repo || !token || !linkzip || !option)
        return res.json({ status: false, error: "Missing parameters" });

      try {
        // Download zip
        const zipPath = path.join(os.tmpdir(), `${Date.now()}.zip`);
        const writer = fs.createWriteStream(zipPath);
        const response = await axios({ url: linkzip, method: "GET", responseType: "stream" });
        response.data.pipe(writer);
        await new Promise((resolve, reject) => {
          writer.on("finish", resolve);
          writer.on("error", reject);
        });

        // Extract zip
        const extractPath = path.join(os.tmpdir(), `extract_${Date.now()}`);
        const zip = new AdmZip(zipPath);
        zip.extractAllTo(extractPath, true);

        // Create repo
        await createRepo(username, repo, token);

        // Option pilihannya bisa dikembangin, contoh:
        if (option === "full") {
          await uploadFiles(username, repo, token, extractPath);
        } else if (option === "onlysrc") {
          await uploadFiles(username, repo, token, path.join(extractPath, "src"));
        }

        res.json({ status: true, message: "Repo created & files uploaded!" });
      } catch (err) {
        res.status(500).json({ status: false, error: err.message });
      }
    },
  },
];
