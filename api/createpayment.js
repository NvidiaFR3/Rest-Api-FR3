const midtransClient = require('midtrans-client');
const validator = require('validator');

module.exports = {
  name: "Create Payment With Midtrans",
  desc: "Secure deposit feature with Midtrans payment gateway integration",
  category: "Payment Gateway",
  path: "/payment/create",
  method: "POST",

  async run(req, res) {
    try {
      const { server, nominal, username, serverKey, email, phone } = req.body;

      // Cek parameter wajib
      const missing = [];
      if (!server) missing.push('server');
      if (!nominal) missing.push('nominal');
      if (!username) missing.push('username');
      if (!serverKey) missing.push('serverKey');
      if (!email) missing.push('email');
      if (!phone) missing.push('phone');

      if (missing.length > 0) {
        return res.status(400).json({
          status: false,
          error: `Missing required parameters: ${missing.join(', ')}`,
          code: "MISSING_PARAMS"
        });
      }

      // Validasi nominal
      const amount = parseInt(nominal);
      if (!validator.isNumeric(amount.toString()) || amount < 10000) {
        return res.status(400).json({
          status: false,
          error: "Nominal must be a number and at least 10,000",
          code: "INVALID_NOMINAL"
        });
      }

      // Validasi email & nomor
      if (!validator.isEmail(email)) {
        return res.status(400).json({ status: false, error: "Invalid email", code: "INVALID_EMAIL" });
      }

      if (!validator.isMobilePhone(phone, 'any')) {
        return res.status(400).json({ status: false, error: "Invalid phone", code: "INVALID_PHONE" });
      }

      const snap = new midtransClient.Snap({
        isProduction: false,
        serverKey: serverKey
      });

      const orderId = `FR3-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      const transaction = await snap.createTransaction({
        transaction_details: {
          order_id: orderId,
          gross_amount: amount
        },
        customer_details: {
          first_name: validator.escape(username),
          email: validator.normalizeEmail(email),
          phone: phone.replace(/\D/g, ''),
        },
        item_details: [
          {
            id: "DEPOSIT",
            price: amount,
            quantity: 1,
            name: `${validator.escape(server)} Balance`,
            category: "Deposit"
          }
        ],
        callbacks: {
          finish: `${process.env.PAYMENT_RETURN_URL || 'https://api.nvidiabotz.xyz'}/thanks`
        }
      });

      return res.status(200).json({
        status: true,
        message: "Silakan lanjutkan pembayaran",
        snapToken: transaction.token,
        redirect_url: transaction.redirect_url,
        orderId
      });

    } catch (err) {
      console.error("Midtrans error:", err);

      return res.status(500).json({
        status: false,
        error: "Gagal membuat transaksi",
        code: "MIDTRANS_ERROR",
        detail: err.message
      });
    }
  }
};
