const fetch = require("node-fetch");

module.exports = [
  {
    name: "TextToMorse",
    desc: "Ubah teks menjadi Morse",
    category: "Tools",
    path: "/tools/texttomorse?text=",

    async run(req, res) {
      const { text } = req.query;
      if (!text) return res.json({ status: false, error: "Masukkan teks. Contoh: ?text=halo" });

      try {
        const payload = new URLSearchParams({ text });
        const response = await fetch(`https://api.funtranslations.com/translate/morse.json?${payload}`, {
          method: "POST"
        });
        const result = await response.json();

        if (result.contents?.translated) {
          res.json({ status: true, input: text, output: result.contents.translated.trim() });
        } else {
          res.json({ status: false, error: "Gagal mengonversi teks ke Morse.", detail: result });
        }

      } catch (err) {
        res.status(500).json({ status: false, error: "Terjadi kesalahan saat koneksi API", detail: err.message });
      }
    }
  },
  {
    name: "MorseToText",
    desc: "Ubah kode Morse menjadi teks",
    category: "Tools",
    path: "/tools/morsetotext?kode=",

    async run(req, res) {
      const { kode } = req.query;
      if (!kode) return res.json({ status: false, error: "Masukkan kode Morse. Contoh: ?kode=.... .- .-.. ---" });

      try {
        const payload = new URLSearchParams({ text: kode });
        const response = await fetch(`http://api.funtranslations.com/translate/morse2english.json?${payload}`, {
          method: "POST"
        });
        const result = await response.json();

        if (result.contents?.translated) {
          res.json({ status: true, input: kode, output: result.contents.translated.trim().toUpperCase() });
        } else {
          res.json({ status: false, error: "Gagal mengonversi Morse ke teks.", detail: result });
        }

      } catch (err) {
        res.status(500).json({ status: false, error: "Terjadi kesalahan saat koneksi API", detail: err.message });
      }
    }
  }
];
