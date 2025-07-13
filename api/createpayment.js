const midtransClient = require('midtrans-client');

module.exports = {
  name: "Create Payment With Midtrans",
  desc: "Buat transaksi pembayaran via Midtrans (tanpa server, email, dan phone)",
  category: "Payment Gateway",
  path: "/payment/createpayment?username=&nominal=&serverKey=&clientKey=",

  async run(req, res) {
    const { username, nominal, serverKey, clientKey } = req.query;

    if (!username || !nominal || !serverKey || !clientKey) {
      return res.status(400).json({
        status: false,
        error: "Wajib isi: username, nominal, serverKey, dan clientKey",
      });
    }

    try {
      const snap = new midtransClient.Snap({
        isProduction: false,
        serverKey: serverKey,
        clientKey: clientKey,
      });

      const transaction = await snap.createTransaction({
        transaction_details: {
          order_id: 'FR3-' + Date.now(),
          gross_amount: parseInt(nominal),
        },
        customer_details: {
          first_name: username,
        },
        item_details: [
          {
            id: "DEPOSIT",
            price: parseInt(nominal),
            quantity: 1,
            name: "FR3 Balance",
          },
        ],
      });

      return res.status(200).json({
        status: true,
        message: "Silakan lanjutkan pembayaran",
        snapToken: transaction.token,
        redirect_url: transaction.redirect_url,
      });

    } catch (err) {
      return res.status(500).json({
        status: false,
        error: err.message || "Gagal membuat transaksi",
      });
    }
  },
};
