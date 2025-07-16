const axios = require('axios');
const AdmZip = require('adm-zip');
const path = require('path');

module.exports = {
  name: "Uploader GitHub",
  desc: "Membuat repo dan upload file ZIP ke GitHub",
  category: "Tools",
  path: "/tools/uploadergithub?username=&repository=&token=&zip_url=",

  async run(req, res) {
    const { username, repository, token, zip_url } = req.query;

    if (!username || !repository || !token || !zip_url) {
      return res.status(400).json({ status: false, message: "Missing required query parameters." });
    }

    const repoApi = `https://api.github.com/user/repos`;

    try {
      // Step 1: Buat repository baru
      const createRes = await axios.post(repoApi, {
        name: repository,
        auto_init: false,
        private: false
      }, {
        headers: {
          Authorization: `token ${token}`,
          Accept: "application/vnd.github+json"
        }
      });

      const repoUrl = createRes.data.html_url;

      // Step 2: Download ZIP
      const zipBuffer = await axios.get(zip_url, { responseType: 'arraybuffer' }).then(res => res.data);
      const zip = new AdmZip(zipBuffer);
      const zipEntries = zip.getEntries();

      let uploaded = [];

      // Step 3: Upload file satu per satu
      for (const entry of zipEntries) {
        if (entry.isDirectory) continue;

        const fileContent = entry.getData().toString('base64');
        const filePath = entry.entryName;

        await axios.put(`https://api.github.com/repos/${username}/${repository}/contents/${filePath}`, {
          message: `Upload ${filePath}`,
          content: fileContent
        }, {
          headers: {
            Authorization: `token ${token}`,
            Accept: "application/vnd.github+json"
          }
        });

        uploaded.push(filePath);
      }

      res.json({
        status: true,
        message: "Repository created & ZIP uploaded successfully!",
        repo_url: repoUrl,
        files_uploaded: uploaded
      });

    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message;
      return res.status(500).json({ status: false, error: errorMsg });
    }
  }
};
