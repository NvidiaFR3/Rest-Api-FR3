const fetch = require("node-fetch");

module.exports = {
  name: "Arti Nama",
  desc: "Cek arti nama",
  category: "Random",
  path: "/random/namameaning?nama=",

  async run(req, res) {
    const { nama } = req.query;
    if (!nama) return res.json({ status: false, error: "Masukkan nama. Contoh: ?nama=Rasya" });

    try {
      const response = await fetch(`https://api.nekoo.qzz.io/api/arti?nama=${encodeURIComponent(nama)}`);
      const result = await response.json();

      res.json({
        status: true,
        input: nama,
        arti: result?.result || result?.arti || "Tidak ditemukan arti nama."
      });

    } catch (err) {
      res.status(500).json({ status: false, error: "Gagal koneksi ke Neko API", detail: err.message });
    }
  }
};
