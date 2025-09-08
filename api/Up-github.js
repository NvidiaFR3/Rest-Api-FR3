const axios = require("axios");
const AdmZip = require("adm-zip");
const fs = require("fs");
const path = require("path");
const os = require("os");

// Buat repo baru
async function createRepo(username, repo, token, isPrivate = false) {
  const url = "https://api.github.com/user/repos";
  const response = await axios.post(
    url,
    { name: repo, private: isPrivate },
    { headers: { Authorization: `token ${token}`, "User-Agent": username } }
  );
  return response.data;
}

// Upload satu file
async function uploadFile(username, repo, token, filePath, rootPath) {
  const content = fs.readFileSync(filePath).toString("base64");
  const relativePath = path.relative(rootPath, filePath).replace(/\\/g, "/");
  const url = `https://api.github.com/repos/${username}/${repo}/contents/${relativePath}`;

  await axios.put(
    url,
    {
      message: `Upload ${relativePath}`,
      content,
    },
    { headers: { Authorization: `token ${token}`, "User-Agent": username } }
  );
}

// Upload semua file dalam folder
async function uploadAll(username, repo, token, rootPath, option) {
  const walk = async (dir) => {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const fullPath = path.join(dir, file);
      if (fs.statSync(fullPath).isDirectory()) {
        await walk(fullPath);
      } else {
        await uploadFile(username, repo, token, fullPath, rootPath);
      }
    }
  };

  if (option === "onlysrc") {
    const srcPath = path.join(rootPath, "src");
    if (fs.existsSync(srcPath)) {
      await walk(srcPath);
    } else {
      throw new Error("Folder src tidak ditemukan di zip");
    }
  } else {
    await walk(rootPath);
  }
}

module.exports = [
  {
    name: "Github Uploader",
    desc: "Create repo & upload project from ZIP",
    category: "Tools",
    path: "/tools/github-uploader?username=&repo=&token=&linkzip=&option=&private=",

    async run(req, res) {
      const { username, repo, token, linkzip, option = "full", private = "false" } = req.query;
      if (!username || !repo || !token || !linkzip) {
        return res.json({ status: false, error: "Wajib isi username, repo, token, linkzip" });
      }

      try {
        // Download ZIP
        const zipPath = path.join(os.tmpdir(), `repo_${Date.now()}.zip`);
        const writer = fs.createWriteStream(zipPath);
        const response = await axios({ url: linkzip, method: "GET", responseType: "stream" });
        response.data.pipe(writer);
        await new Promise((resolve, reject) => {
          writer.on("finish", resolve);
          writer.on("error", reject);
        });

        // Ekstrak ZIP
        const extractPath = path.join(os.tmpdir(), `extract_${Date.now()}`);
        fs.mkdirSync(extractPath);
        const zip = new AdmZip(zipPath);
        zip.extractAllTo(extractPath, true);

        // Buat Repo
        await createRepo(username, repo, token, private === "true");

        // Upload File
        await uploadAll(username, repo, token, extractPath, option);

        res.json({
          status: true,
          message: "Repo berhasil dibuat & file berhasil diupload",
          repo_url: `https://github.com/${username}/${repo}`,
          uploaded_option: option,
          private: private === "true",
        });
      } catch (err) {
        res.status(500).json({ status: false, error: err.message });
      }
    },
  },
];
