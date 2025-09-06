const fetch = require("node-fetch");
const cheerio = require("cheerio");

module.exports = {
  name: "JKT48 News",
  desc: "Ambil berita terbaru dari website resmi JKT48",
  category: "Berita",
  path: "/berita/jkt48news",

  async run(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 5;

      const response = await fetch("https://jkt48.com/news/list?lang=id");
      const html = await response.text();
      const $ = cheerio.load(html);

      const berita = [];

      $(".news-list-container li").slice(0, limit).each((i, el) => {
        const title = $(el).find(".desc a").text().trim();
        const link = "https://jkt48.com" + $(el).find(".desc a").attr("href");
        const date = $(el).find(".date").text().trim();
        const icon = "https://jkt48.com" + $(el).find("img").attr("src");

        if (title && link) {
          berita.push({ title, link, date, icon });
        }
      });

      res.json({
        creator: "FR3-NEWERA",
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
