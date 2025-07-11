const fetch = require("node-fetch");

module.exports = {
  name: "Tebak JKT48",
  desc: "Game tebak member JKT48",
  category: "Games",
  path: "/games/tebakjkt",

  async run(req, res) {
    try {
      const response = await fetch("https://api.siputzx.my.id/api/games/tebakjkt");
      const data = await response.json();

      if (!data || !data.result || !data.result.gambar || !data.result.jawaban) {
        return res.json({ status: false, error: "Data dari API tidak valid" });
      }

      res.json({
        status: true,
        data: {
          index: Math.floor(Math.random() * 999), // Acak aja karena API gak punya index
          gambar: data.result.gambar,
          jawaban: data.result.jawaban
        }
      });

    } catch (err) {
      res.status(500).json({ status: false, error: "Gagal mengambil data dari API", detail: err.message });
    }
  }
};
