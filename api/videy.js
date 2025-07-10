async function videy(url) {
  try {
    const id = url.split("id=")[1];
    if (!id) throw new Error("Invalid Videy URL");

    let type = id.length === 9 && id[8] === '2' ? '.mov' : '.mp4';
    const videoUrl = `https://cdn.videy.co/${id}${type}`;
    return {
      id,
      mimetype: type === '.mov' ? 'video/quicktime' : 'video/mp4',
      url: videoUrl
    };
  } catch (error) {
    throw new Error(`Invalid Videy URL: ${error.message}`);
  }
}

module.exports = {
  name: "Videy",
  desc: "Videy downloader",
  category: "Downloader",
  path: "/download/videy?url=",
  async run(req, res) {
    const { url } = req.query;

    if (!url) {
      return res.json({ status: false, error: "Url is required" });
    }

    try {
      const result = await videy(url);
      res.status(200).json({
        status: true,
        result
      });
    } catch (error) {
      res.status(500).json({
        status: false,
        error: error.message
      });
    }
  }
};