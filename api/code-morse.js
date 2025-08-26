const fetch = require("node-fetch");

module.exports = [
  {
    name: "TextToMorse",
    desc: "Ubah teks jadi Morse (via Neko API)",
    category: "Tools",
    path: "/tools/texttomorse?text=",

    async run(req, res) {
      const { text } = req.query;
      if (!text) return res.json({ status: false, error: "Masukkan teks. Contoh: ?text=halo" });

      try {
        const response = await fetch(`https://api.nekoo.qzz.io/api/tools/morse?text=${encodeURIComponent(text)}`);
        const result = await response.json();

        res.json({
          status: true,
          input: text,
          output: result?.result || result?.morse || "Tidak ada output"
        });

      } catch (err) {
        res.status(500).json({ status: false, error: "Gagal koneksi ke Neko API", detail: err.message });
      }
    }
  },
  {
    name: "MorseToText",
    desc: "Ubah kode Morse jadi teks (via Neko API)",
    category: "Tools",
    path: "/tools/morsetotext?kode=",

    async run(req, res) {
      const { kode } = req.query;
      if (!kode) return res.json({ status: false, error: "Masukkan kode Morse. Contoh: ?kode=.... .- .-.. ---" });

      try {
        const response = await fetch(`https://api.nekoo.qzz.io/api/tools/morse/decode?morse=${encodeURIComponent(kode)}`);
        const result = await response.json();

        res.json({
          status: true,
          input: kode,
          output: result?.result || result?.text || "Tidak ada output"
        });

      } catch (err) {
        res.status(500).json({ status: false, error: "Gagal koneksi ke Neko API", detail: err.message });
      }
    }
  }
];
