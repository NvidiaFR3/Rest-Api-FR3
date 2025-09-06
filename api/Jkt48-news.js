const fetch = require("node-fetch");
const cheerio = require("cheerio");

module.exports = {
  name: "JKT48 News",
  desc: "Ambil 5 berita terbaru dari website resmi JKT48",
  category: "Berita",
  path: "/berita/jkt48news",

  async run(req, res) {
    try {
      const response = await fetch("https://jkt48.com/news/list?lang=id");
      const html = await response.text();
      const $ = cheerio.load(html);

      const berita = [];
      $(".news-list li").slice(0, 5).each((i, el) => {
        const title = $(el).find("a").text().trim();
        const link = "https://jkt48.com" + $(el).find("a").attr("href");
        const date = $(el).find(".date").text().trim();
        const icon = "https://jkt48.com" + $(el).find("img").attr("src");

        berita.push({ title, link, date, icon });
      });

      res.json({
        status: true,
        data: berita,
        timestamp: new Date().toISOString()
      });

    } catch (err) {
      res.status(500).json({
        status: false,
        error: "Gagal mengambil data berita JKT48",
        detail: err.message
      });
    }
  }
};
