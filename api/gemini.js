module.exports = {
  name: "Ai With Image",
  desc: "Ai gemini models",
  category: "Openai",
  path: "/ai/gemini?apikey=&prompt=&imageUrl=",
  async run(req, res) {
    const { prompt, imageUrl, apikey } = req.query;
    if (!text) return res.json({ status: false, error: "Prompt is required" });   
      if (!imageUrl) return res.json({ status: false, error: "Prompt is required" });
    if (!apikey || !global.apikey?.includes(apikey)) return res.json({ status: false, error: "Invalid API key" });
    try {
      const data = await fetchJson(`https://api.platform.web.id/gemini?prompt=${prompt}&imageUrl=${imageUrl}`)
      res.json({ status: true, result: data.result });
    } catch (err) {
      res.status(500).json({ status: false, error: err.message });
    }
  }
};