const midtransClient = require('midtrans-client');

module.exports = {
  name: "Create Payment Midtrans",
  desc: "Membuat pembayaran Midtrans menggunakan serverKey (tanpa email & phone)",
  category: "Tools",
  path: "/payment/createpayment?username=&nominal=&serverKey=",

  async run(req, res) {
    const { username, nominal, serverKey } = req.query;

    if (!username || !nominal || !serverKey) {
      return res.status(400).json({
        status: false,
        error: "Wajib isi: username, nominal, dan serverKey",
      });
    }

    try {
      const snap = new midtransClient.Snap({
        isProduction: false,
        serverKey: serverKey,
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
            name: "Deposit Saldo",
          }
        ],
      });

      return res.json({
        status: true,
        message: "Transaksi berhasil dibuat",
        snapToken: transaction.token,
        redirect_url: transaction.redirect_url
      });

    } catch (err) {
      return res.status(500).json({
        status: false,
        error: err.message,
      });
    }
  }
};
