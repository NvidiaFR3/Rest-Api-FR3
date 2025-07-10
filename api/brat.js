module.exports = {
  name: "Brat",
  desc: "Brat Image generator",
  category: "Imagecreator",
  path: "/imagecreator/brat?text=",
  async run(req, res) {
    const { text } = req.query;
    if (!text) return res.json({ status: false, error: 'Missing text' });

    const buffer = await getBuffer(`https://fastrestapis.fasturl.cloud/maker/brat/animated?text=${encodeURIComponent(text)}&mode=animated`);
    res.writeHead(200, {
      'Content-Type': 'image/gif',
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }
}
