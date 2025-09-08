const fetch = require("node-fetch");

module.exports = {
  name: "Github Create Repo",
  desc: "Buat repository private kosong",
  category: "Github",
  path: "/github/create-repo?username=&repo=&token=",

  async run(req, res) {
    try {
      let { username, repo, token } = req.query;
      if (!username || !repo || !token) {
        return res.json({
          status: false,
          error: "Wajib isi 'username', 'repo', dan 'token'"
        });
      }

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

      const data = await createRepoRes.json();

      if (!createRepoRes.ok) {
        return res.json({ status: false, error: data.message, detail: data });
      }

      res.json({
        status: true,
        repo_url: `https://github.com/${username}/${repo}`,
        detail: data
      });

    } catch (err) {
      res.status(500).json({ status: false, error: err.message });
    }
  }
};
