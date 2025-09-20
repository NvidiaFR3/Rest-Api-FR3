// api/saweria.js
// Requires: npm i saweria-createqr
const { SumshiiySawer } = require('saweria-createqr');

module.exports = [
  // CREATE PAYMENT
  {
    name: "Saweria Create Payment",
    desc: "Buat payment QR di Saweria (createPaymentQr)",
    category: "Payment",
    path: "/payment/saweria/create?username=&email=&password=&amount=",

    async run(req, res) {
      try {
        const q = req.query || {};
        let { username, email, password, amount } = q;

        // Basic validation & auto-correct
        username = (username || '').toString().trim();
        email = (email || '').toString().trim();
        password = (password || '').toString();
        amount = amount !== undefined ? parseInt(amount, 10) : NaN;

        if (!username) return res.json({ status: false, error: "Parameter 'username' wajib diisi" });
        if (!email) return res.json({ status: false, error: "Parameter 'email' wajib diisi" });
        if (!password) return res.json({ status: false, error: "Parameter 'password' wajib diisi" });
        if (!Number.isFinite(amount) || amount <= 0) return res.json({ status: false, error: "Parameter 'amount' wajib berupa angka > 0" });

        // instantiate and login
        const sawer = new SumshiiySawer({ username, email, password });
        await sawer.login();

        // default duration in minutes (you can change if needed)
        const DURATION_MINUTES = 30;

        // create payment
        const payment = await sawer.createPaymentQr(amount, DURATION_MINUTES);

        // normalize response: try to match example structure if possible
        const result = {
          status: true,
          data: payment || {},
          message: "Create payment berhasil",
        };

        return res.json(result);
      } catch (err) {
        // try to make error message friendly
        return res.status(500).json({
          status: false,
          error: "Gagal membuat payment Saweria",
          detail: err && err.message ? err.message : String(err)
        });
      }
    }
  },

  // CHECK STATUS
  {
    name: "Saweria Check Payment Status",
    desc: "Cek status transaksi Saweria (cekPaymentV1 / cekpayment)",
    category: "Payment",
    path: "/payment/saweria/status?username=&email=&password=&trxid=",

    async run(req, res) {
      try {
        const q = req.query || {};
        let { username, email, password, trxid } = q;

        username = (username || '').toString().trim();
        email = (email || '').toString().trim();
        password = (password || '').toString();
        trxid = (trxid || '').toString().trim();

        if (!username) return res.json({ status: false, error: "Parameter 'username' wajib diisi" });
        if (!email) return res.json({ status: false, error: "Parameter 'email' wajib diisi" });
        if (!password) return res.json({ status: false, error: "Parameter 'password' wajib diisi" });
        if (!trxid) return res.json({ status: false, error: "Parameter 'trxid' wajib diisi (trx id dari create)" });

        const sawer = new SumshiiySawer({ username, email, password });
        await sawer.login();

        // Try to call available check method(s)
        let statusResp = null;
        if (typeof sawer.cekPaymentV1 === 'function') {
          statusResp = await sawer.cekPaymentV1(trxid);
        } else if (typeof sawer.cekpayment === 'function') {
          // some libs use different casing
          statusResp = await sawer.cekpayment(trxid);
        } else if (typeof sawer.cekPayment === 'function') {
          statusResp = await sawer.cekPayment(trxid);
        } else {
          // fallback: try generic method name
          if (typeof sawer['cekPaymentV1'] === 'function') {
            statusResp = await sawer['cekPaymentV1'](trxid);
          } else {
            throw new Error("Library Saweria tidak menyediakan method cekPaymentV1 / cekpayment pada versi ini");
          }
        }

        return res.json({
          status: true,
          data: statusResp || {},
          message: "Cek status berhasil"
        });
      } catch (err) {
        return res.status(500).json({
          status: false,
          error: "Gagal cek status Saweria",
          detail: err && err.message ? err.message : String(err)
        });
      }
    }
  }
];
