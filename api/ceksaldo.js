const fetch = require('node-fetch');

module.exports = {
  name: "Cek Saldo QRIS",
  desc: "Cek saldo QRIS menggunakan API NvidiaBotz",
  category: "Orderkouta",
  path: "/payment/orderkouta?username=&token=",

  async run(req, res) {
    const { username, token } = req.query;

    if (!username || !token) {
      return res.json({
        status: false,
        error: 'Missing username or token'
      });
    }

    try {
      const response = await fetch(`https://api.nvidiabotz.xyz/orderkuota/mutasiqr?username=${encodeURIComponent(username)}&token=${encodeURIComponent(token)}`);
      const data = await response.json();

      res.json({
        status: true,
        message: "Saldo QRIS berhasil diambil",
        result: data
      });
    } catch (err) {
      res.json({
        status: false,
        error: 'Gagal mengambil data API',
        details: err.message
      });
    }
  }
};
