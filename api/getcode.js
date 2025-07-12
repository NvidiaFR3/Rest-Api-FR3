const fetch = require("node-fetch");
const cheerio = require("cheerio");

module.exports = {
  name: "Get Code HTML",
  desc: "Mengambil source code HTML lengkap dengan CSS & JS eksternal",
  category: "Tools",
  path: "/tools/getcodefull?url=",

  async run(req, res) {
    const { url } = req.query;
    if (!url || !/^https?:\/\//.test(url)) {
      return res.json({
        status: false,
        error: "Parameter url wajib dan harus pakai http/https"
      });
    }

    try {
      const main = await fetch(url, {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; FR3bot/1.0)" }
      });

      if (!main.ok) throw new Error(\`Gagal fetch HTML utama: \${main.statusText}\`);
      const html = await main.text();
      const $ = require("cheerio").load(html);

      const absolute = (src) => new URL(src, url).href;

      const cssLinks = $("link[rel='stylesheet']").map((i, el) => absolute($(el).attr("href"))).get();
      const jsLinks = $("script[src]").map((i, el) => absolute($(el).attr("src"))).get();

      const fetchAssets = async (links) => {
        return await Promise.all(links.map(async (src) => {
          try {
            const r = await fetch(src, {
              headers: { "User-Agent": "Mozilla/5.0" }
            });
            const code = await r.text();
            return { url: src, content: code };
          } catch {
            return { url: src, content: null };
          }
        }));
      };

      const css = await fetchAssets(cssLinks);
      const js = await fetchAssets(jsLinks);

      res.json({
        status: true,
        creator: "FR3HOSTING",
        result: {
          url,
          html,
          css,
          js
        }
      });

    } catch (err) {
      res.status(500).json({
        status: false,
        creator: "FR3HOSTING",
        error: err.message
      });
    }
  }
};
