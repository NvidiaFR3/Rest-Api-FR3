const axios = require("axios");

module.exports = {
  name: "Get Source Premium",
  desc: "Redirect user ke GitHub repo asli jika apikey valid",
  category: "Premium",
  path: "/premium/getsource?apikey=",

  async run(req, res) {
    const { apikey } = req.query;

    if (!apikey || !global.apikey.includes(apikey)) {
      return res.json({
        status: false,
        error: "Silahkan Beli Apikey Ke https://t.me/fr3newera Ya, Harga Terjangkau."
      });
    }

    const owner = "NvidiaFR3";
    const repo = "Rest-Api-FR3";
    const githubUrl = `https://github.com/${owner}/${repo}`;

    return res.redirect(githubUrl);
  }
};
