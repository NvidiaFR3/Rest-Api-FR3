const fetch = require('node-fetch');

module.exports = {
  name: "Cek Saldo QRIS",
  desc: "Cek saldo QRIS menggunakan OrderKouta",
  category: "OrderKouta",
  path: "/orderkouta/ceksaldoqris?username=&token=",

  async run(req, res) {
    const { username, token } = req.query;

    if (!username || !token) {
      return res.json({
        status: false,
        error: 'Missing username or token'
      });
    }

    try {
      const apiUrl = `https://api.nvidiabotz.xyz/orderkuota/mutasiqr?username=${encodeURIComponent(username)}&token=${encodeURIComponent(token)}`;
      const response = await fetch(apiUrl);
      const data = await response.json();

      if (!data || !data.saldo) {
        return res.json({
          status: false,
          error: 'Tidak dapat mengambil saldo. Pastikan username/token benar.'
        });
      }

      res.json({
        status: true,
        message: "Saldo QRIS berhasil diambil",
        saldo: data.saldo
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
