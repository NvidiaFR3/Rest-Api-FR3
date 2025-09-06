const fetch = require("node-fetch");
const API_KEY = "fr3newera";

async function cekEwallet(provider, hp) {
  const url = `https://api.payday.my.id/trueid/ewallet/${provider}/?hp=${encodeURIComponent(hp)}&key=${API_KEY}`;
  const response = await fetch(url);
  const data = await response.json().catch(async () => {
    return { raw: await response.text() };
  });
  return data;
}

module.exports = [
  {
    name: "Cek Dana",
    desc: "Cek akun Dana",
    category: "Tools",
    path: "/tools/dana?hp=",
    async run(req, res) {
      const { hp } = req.query;
      if (!hp) return res.json({ status: false, error: "Masukkan parameter hp" });
      const result = await cekEwallet("dana", hp);
      res.json({ creator: "FR3-NEWERA", status: true, provider: "dana", hp, result });
    }
  },
  {
    name: "Cek OVO",
    desc: "Cek akun OVO",
    category: "Tools",
    path: "/tools/ovo?hp=",
    async run(req, res) {
      const { hp } = req.query;
      if (!hp) return res.json({ status: false, error: "Masukkan parameter hp" });
      const result = await cekEwallet("ovo", hp);
      res.json({ creator: "FR3-NEWERA", status: true, provider: "ovo", hp, result });
    }
  },
  {
    name: "Cek GoPay",
    desc: "Cek akun GoPay",
    category: "Tools",
    path: "/tools/gopay?hp=",
    async run(req, res) {
      const { hp } = req.query;
      if (!hp) return res.json({ status: false, error: "Masukkan parameter hp" });
      const result = await cekEwallet("gopay", hp);
      res.json({ creator: "FR3-NEWERA", status: true, provider: "gopay", hp, result });
    }
  },
  {
    name: "Cek Shopeepay",
    desc: "Cek akun Shopeepay",
    category: "Tools",
    path: "/tools/shopeepay?hp=",
    async run(req, res) {
      const { hp } = req.query;
      if (!hp) return res.json({ status: false, error: "Masukkan parameter hp" });
      const result = await cekEwallet("shopeepay", hp);
      res.json({ creator: "FR3-NEWERA", status: true, provider: "shopeepay", hp, result });
    }
  },
  {
    name: "Cek LinkAja",
    desc: "Cek akun LinkAja",
    category: "Tools",
    path: "/tools/linkaja?hp=",
    async run(req, res) {
      const { hp } = req.query;
      if (!hp) return res.json({ status: false, error: "Masukkan parameter hp" });
      const result = await cekEwallet("linkaja", hp);
      res.json({ creator: "FR3-NEWERA", status: true, provider: "linkaja", hp, result });
    }
  }
];
