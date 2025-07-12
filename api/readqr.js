const multer = require('multer');
const Jimp = require('jimp');
const QrCode = require('qrcode-reader');
const path = require('path');
const fs = require('fs');

const upload = multer({ dest: 'tmp/' });

module.exports = {
  name: "Read QR",
  desc: "Membaca isi QR Code dari gambar",
  category: "Tools",
  path: "/tools/readqr",
  run: [
    upload.single('image'),
    async (req, res) => {
      if (!req.file) {
        return res.status(400).json({
          creator: "FR3HOSTING",
          status: false,
          error: "File gambar wajib diunggah menggunakan field 'image'"
        });
      }

      try {
        const image = await Jimp.read(fs.readFileSync(req.file.path));
        const qr = new QrCode();

        qr.callback = (err, value) => {
          fs.unlinkSync(req.file.path); // Hapus file setelah dibaca

          if (err || !value) { 
            return res.status(500).json({
              creator: "FR3HOSTING",
              status: false,
              error: "Gagal membaca QR Code"
            });
          }

          res.status(200).json({
            creator: "FR3HOSTING",
            status: true,
            text: value.result
          });
        };

        qr.decode(image.bitmap);
      } catch (err) {
        res.status(500).json({
          creator: "FR3HOSTING",
          status: false,
          error: err.message
        });
      }
    }
  ]
};
