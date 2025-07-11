const fetch = require("node-fetch");

module.exports = {
  name: "Tebak Hero ML",
  desc: "Game tebak hero Mobile Legends",
  category: "Games",
  path: "/games/tebakheroml",

  async run(req, res) {
    try {
      const response = await fetch("https://api.siputzx.my.id/api/games/tebakheroml");
      const body = await response.json();

      if (!body || body.status !== true || !body.data) {
        return res.status(502).json({
          status: false,
          error: "Data dari API tidak valid",
          detail: body
        });
      }

      res.json({
        status: true,
        data: {
          index: body.data.index ?? Math.floor(Math.random() * 999),
          gambar: body.data.gambar,
          jawaban: body.data.jawaban
        }
      });

    } catch (err) {
      res.status(500).json({
        status: false,
        error: "Gagal mengambil data dari API",
        detail: err.message
      });
    }
  }
};
