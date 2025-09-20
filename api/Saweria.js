const { SumshiiySawer } = require('saweria-createqr');

module.exports = [
  {
    name: "Create Saweria Payment",
    desc: "Buat pembayaran Saweria QR (Expired 10 menit) + Auto Cek Status",
    category: "Premium",
    path: "/saweria/create?username=&email=&password=&amount=",
    async run(req, res) {
      const { username, email, password, amount } = req.query;
      if (!username || !email || !password || !amount) {
        return res.json({ status: false, error: "Parameter kurang lengkap" });
      }

      try {
        const sawer = new SumshiiySawer({ username, email, password });
        await sawer.login();

        // Buat QR expired 10 menit
        const payment = await sawer.createPaymentQr(Number(amount), 10);
        
        // Polling otomatis setiap 7 detik
        const trxId = payment.trx_id;
        let counter = 0;
        const interval = setInterval(async () => {
          counter++;
          try {
            const status = await sawer.cekpayment(trxId);
            console.log(`[Polling ${counter}]`, status.status);

            if (status.status === "Paid" || status.status === "Expired") {
              console.log(`❌ Stop Polling - Status: ${status.status}`);
              clearInterval(interval);
            }
          } catch (err) {
            console.error("Error polling:", err.message);
            clearInterval(interval);
          }
        }, 7000);

        res.json({
          status: true,
          message: "QR Saweria berhasil dibuat. Status dipantau otomatis tiap 7 detik.",
          result: payment
        });

      } catch (err) {
        res.status(500).json({ status: false, error: err.message });
      }
    }
  },

  {
    name: "Cek Status Saweria Payment",
    desc: "Cek status transaksi Saweria berdasarkan trx_id",
    category: "Premium",
    path: "/saweria/status?username=&email=&password=&trxid=",
    async run(req, res) {
      const { username, email, password, trxid } = req.query;
      if (!username || !email || !password || !trxid) {
        return res.json({ status: false, error: "Parameter kurang lengkap" });
      }

      try {
        const sawer = new SumshiiySawer({ username, email, password });
        await sawer.login();
        const status = await sawer.cekpayment(trxid);
        res.json({ status: true, result: status });
      } catch (err) {
        res.status(500).json({ status: false, error: err.message });
      }
    }
  }
];
