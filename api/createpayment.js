const midtransClient = require('midtrans-client');

module.exports = {
  name: "Create Payment With Midtrand",
  desc: "Deposit feature with Midtrans integration",
  category: "Tools",
  path: "/tools/cpayment?server=&username=&email=&phone=&serverKey=&clientKey=nominal=",
  async run(req, res) {
    const { server, nominal, username, serverKey, clientKey, email, phone } = req.query;

    if (!server || !nominal || !username || !serverKey || !clientKey || !email || !phone) {
      return res.status(400).json({
        status: false,
        error: "Parameter server, nominal, username, serverKey, clientKey, email, dan phone wajib diisi.",
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
          email,
          phone,
        },
        item_details: [
          {
            id: "DEPOSIT",
            price: parseInt(nominal),
            quantity: 1,
            name: `${server} Balance`,
          },
        ],
        callbacks: {
          finish: "https://api.nvidiabotz.xyz/thanks", // opsional redirect
        },
      });

      return res.status(200).json({
        status: true,
        message: `Silakan lanjutkan pembayaran`,
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
