const qrcode = require('qrcode');

module.exports = {
  name: "Text to QR",
  desc: "Mengubah teks menjadi QR Code",
  category: "Tools",
  path: "/tools/texttoqr?text=",
  async run(req, res) {
    const { text } = req.query;
    if (!text) {
      return res.status(400).json({
        creator: "FR3HOSTING",
        status: false,
        error: "Parameter 'text' wajib diisi"
      });
    }

    try {
      const qr = await qrcode.toDataURL(text, {
        type: 'image/png',
        errorCorrectionLevel: 'H',
      });

      res.status(200).json({
        creator: "FR3HOSTING",
        status: true,
        text,
        qr_base64: qr
      });
    } catch (err) {
      res.status(500).json({
        creator: "FR3HOSTING",
        status: false,
        error: err.message
      });
    }
  }
};
