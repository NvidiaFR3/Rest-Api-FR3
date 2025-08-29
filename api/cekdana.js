const fetch = require("node-fetch");

module.exports = {
  name: "Cek Nama Akun Dana",
  desc: "Cek nama akun Dana Via Api FR3",
  category: "Random",
  path: "/random/cekdana?nomor=",

  async run(req, res) {
    const { nomor } = req.query;
    if (!nomor) {
      return res.json({
        status: false,
        error: "Masukkan nomor Dana. Contoh: ?nomor=081234567890"
      });
    }

    try {
      const url = `https://api.payday.my.id/trueid/ewallet/dana/?hp=${encodeURIComponent(
        nomor
      )}&key=eba959099a30f32`;

      const response = await fetch(url);
      const data = await response.json();

      if (!data.status) {
        return res.json({
          status: false,
          error: "Nomor tidak valid atau tidak ditemukan"
        });
      }

      res.json({
        status: true,
        nomor: data.nomorhp,
        nama: data.name
      });
    } catch (err) {
      res.status(500).json({
        status: false,
        error: "Gagal mengecek akun Dana",
        detail: err.message
      });
    }
  }
};
