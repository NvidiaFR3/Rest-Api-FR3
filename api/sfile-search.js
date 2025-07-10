const axios = require("axios")
const cheerio = require("cheerio")
const fetch = require("node-fetch")
 
const sfile = {
    search: async (query, page = 1) => {
        let res = await fetch(`https://sfile.mobi/search.php?q=${query}&page=${page}`)
        let $ = cheerio.load(await res.text()), arr = []
        $('div.list').each((idx, el) => {
            let title = $(el).find('a').text(),
                size = $(el).text().trim().split(' (')[1],
                link = $(el).find('a').attr('href')
            if (link) arr.push({ title, size: size.replace(')', ''), link })
        })
        return arr
    }
}

module.exports = {
  name: "Sfile Search",
  desc: "Search sfile links",
  category: "Search",
  path: "/search/sfile?q=",
  async run(req, res) {
    const { q } = req.query;
    if (!q) return res.json({ status: false, error: "Query is required" });

    try {
      const results = await sfile.search(q);
      res.status(200).json({
        status: true,
        result: results
      });
    } catch (error) {
      res.status(500).json({ status: false, error: error.message });
    }
  }
};