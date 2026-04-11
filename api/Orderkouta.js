const fetch = require('node-fetch');
const { URLSearchParams } = require('url');
const crypto = require('crypto');
const QRCode = require('qrcode');
const { ImageUploadService } = require('node-upload-images');

class OrderKuota {
  static API_URL = 'https://app.orderkuota.com/api/v2';
  static HOST = 'app.orderkuota.com';
  static USER_AGENT = 'okhttp/4.12.0';
  static APP_VERSION_NAME = '25.10.29';
  static APP_VERSION_CODE = '251029';
  static APP_REG_ID = 'cUx8YuXhS5yLKPOaY6_zv_:APA91bH7c1pEuuxtYnTgJAegkbDkj8cicnpkEEQkp0v2yr3bEfWKqIYCuNkwX_VdUjQuJ3UpP75mb72I3kowTpXGomHsspEfIaNnVabdrCEeHFG2IEWWLPU';

  constructor(username = null, authToken = null) {
    this.username = username;
    this.authToken = authToken;
  }

  buildHeaders() {
    return {
      'Host': OrderKuota.HOST,
      'User-Agent': OrderKuota.USER_AGENT,
      'Content-Type': 'application/x-www-form-urlencoded',
    };
  }

  async request(method, url, body = null) {
    try {
      const res = await fetch(url, {
        method,
        headers: this.buildHeaders(),
        body: body ? body.toString() : null,
      });

      const text = await res.text();

      try {
        return JSON.parse(text);
      } catch {
        return { status: false, error: "Invalid JSON", raw: text };
      }

    } catch (err) {
      return { status: false, error: err.message };
    }
  }

  loginRequest(username, password) {
    return this.request('POST', `${OrderKuota.API_URL}/login`,
      new URLSearchParams({
        username,
        password,
        app_reg_id: OrderKuota.APP_REG_ID,
        app_version_code: OrderKuota.APP_VERSION_CODE,
        app_version_name: OrderKuota.APP_VERSION_NAME,
      })
    );
  }

  getAuthToken(username, otp) {
    return this.request('POST', `${OrderKuota.API_URL}/login`,
      new URLSearchParams({
        username,
        password: otp,
        app_reg_id: OrderKuota.APP_REG_ID,
        app_version_code: OrderKuota.APP_VERSION_CODE,
        app_version_name: OrderKuota.APP_VERSION_NAME,
      })
    );
  }

  getTransactionQris() {
    return this.request('POST', `${OrderKuota.API_URL}/get`,
      new URLSearchParams({
        auth_token: this.authToken,
        auth_username: this.username
      })
    );
  }

  withdrawalQris(amount) {
    return this.request('POST', `${OrderKuota.API_URL}/get`,
      new URLSearchParams({
        auth_username: this.username,
        auth_token: this.authToken,
        'requests[qris_withdraw][amount]': amount
      })
    );
  }
}

function convertCRC16(str) {
  let crc = 0xFFFF;
  for (let c = 0; c < str.length; c++) {
    crc ^= str.charCodeAt(c) << 8;
    for (let i = 0; i < 8; i++) {
      crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1;
    }
  }
  return ("000" + (crc & 0xFFFF).toString(16).toUpperCase()).slice(-4);
}

function generateTransactionId() {
  return `RESMING-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
}

async function createQRIS(amount, codeqr) {
  try {
    let qrisData = codeqr.slice(0, -4);
    const final = qrisData + convertCRC16(qrisData);

    const buffer = await QRCode.toBuffer(final);
    const service = new ImageUploadService('pixhost.to');
    const { directLink } = await service.uploadFromBinary(buffer, 'qr.png');

    return {
      idtransaksi: generateTransactionId(),
      jumlah: amount,
      image: directLink
    };
  } catch (err) {
    return { error: err.message };
  }
}

module.exports = [
  {
    name: "Get OTP",
    desc: "Request OTP untuk login Orderkuota",
    category: "Payment Gateway",
    path: "/orderkuota/getotp?username=&password=",
    async run(req, res) {
      const { username, password } = req.query;
      if (!username || !password) return res.json({ status: false, error: 'Missing username or password' });
      try {
        const ok = new OrderKuota();
        const login = await ok.loginRequest(username, password);
        res.json({ status: true, creator: "FR3 NEWERA", result: login.results || login });
      } catch (err) {
        res.json({ status: false, error: err.message });
      }
    }
  },
  {
    name: "Get Token",
    desc: "Verifikasi OTP untuk mendapatkan Auth Token",
    category: "Payment Gateway",
    path: "/orderkuota/gettoken?username=&otp=",
    async run(req, res) {
      const { username, otp } = req.query;
      if (!username || !otp) return res.json({ status: false, error: 'Missing username or otp' });
      try {
        const ok = new OrderKuota();
        const login = await ok.getAuthToken(username, otp);
        res.json({ status: true, creator: "FR3 NEWERA", result: login.results || login });
      } catch (err) {
        res.json({ status: false, error: err.message });
      }
    }
  },
  {
    name: "Cek Mutasi QRIS",
    desc: "Cek riwayat transaksi QRIS yang masuk (status IN)",
    category: "Payment Gateway",
    path: "/orderkuota/mutasiqr?username=&token=",
    async run(req, res) {
      const { username, token } = req.query;
      if (!username || !token) return res.json({ status: false, error: 'Missing username or token' });
      try {
        const ok = new OrderKuota(username, token);
        const data = await ok.getTransactionQris();
        const result = data?.qris_history?.results?.filter(e => e.status === "IN") || [];
        res.json({ status: true, creator: "FR3 NEWERA", result });
      } catch (err) {
        res.json({ status: false, error: err.message });
      }
    }
  },
  {
    name: "Withdraw QRIS",
    desc: "Penarikan saldo QRIS ke saldo utama",
    category: "Payment Gateway",
    path: "/orderkuota/wdqr?username=&token=&amount=",
    async run(req, res) {
      const { username, token, amount } = req.query;
      if (!username || !token || !amount) return res.json({ status: false, error: 'Missing parameters' });
      try {
        const ok = new OrderKuota(username, token);
        const wd = await ok.withdrawalQris(amount);
        res.json({ status: true, creator: "FR3 NEWERA", result: wd });
      } catch (err) {
        res.json({ status: false, error: err.message });
      }
    }
  },
  {
    name: "Create QRIS Payment",
    desc: "Generate QR Code Payment dengan CRC16 otomatis",
    category: "Payment Gateway",
    path: "/orderkuota/createpayment?amount=&codeqr=",
    async run(req, res) {
      const { amount, codeqr } = req.query;
      if (!amount || !codeqr) return res.json({ status: false, error: 'Amount and CodeQR are required' });
      try {
        const qrData = await createQRIS(amount, codeqr);
        res.json({ status: true, creator: "FR3 NEWERA", result: qrData });
      } catch (error) {
        res.json({ status: false, error: error.message });
      }
    }
  }
];
