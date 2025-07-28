const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const { URLSearchParams } = require('url');
const crypto = require("crypto");
const QRCode = require('qrcode');
const { ImageUploadService } = require('node-upload-images');

// CLASS OrderKuota
class OrderKuota {
  static API_URL = 'https://app.orderkuota.com:443/api/v2';
  static HOST = 'app.orderkuota.com';
  static USER_AGENT = 'okhttp/4.10.0';
  static APP_VERSION_NAME = '25.03.14';
  static APP_VERSION_CODE = '250314';
  static APP_REG_ID = 'di309HvATsaiCppl5eDpoc:APA91bFUcTOH8h2XHdPRz2qQ5Bezn-3_TaycFcJ5pNLGWpmaxheQP9Ri0E56wLHz0_b1vcss55jbRQXZgc9loSfBdNa5nZJZVMlk7GS1JDMGyFUVvpcwXbMDg8tjKGZAurCGR4kDMDRJ';

  constructor(username = null, authToken = null) {
    this.username = username;
    this.authToken = authToken;
  }

  async loginRequest(username, password) {
    const payload = new URLSearchParams({
      username,
      password,
      app_reg_id: OrderKuota.APP_REG_ID,
      app_version_code: OrderKuota.APP_VERSION_CODE,
      app_version_name: OrderKuota.APP_VERSION_NAME,
    });
    return await this.request('POST', `${OrderKuota.API_URL}/login`, payload);
  }

  async getAuthToken(username, otp) {
    const payload = new URLSearchParams({
      username,
      password: otp,
      app_reg_id: OrderKuota.APP_REG_ID,
      app_version_code: OrderKuota.APP_VERSION_CODE,
      app_version_name: OrderKuota.APP_VERSION_NAME,
    });
    return await this.request('POST', `${OrderKuota.API_URL}/login`, payload);
  }

  async getTransactionQris(type = '') {
    const payload = new URLSearchParams({
      auth_token: this.authToken,
      auth_username: this.username,
      'requests[qris_history][jumlah]': '',
      'requests[qris_history][jenis]': type,
      'requests[qris_history][page]': '1',
      'requests[qris_history][dari_tanggal]': '',
      'requests[qris_history][ke_tanggal]': '',
      'requests[qris_history][keterangan]': '',
      'requests[0]': 'account',
      app_version_name: OrderKuota.APP_VERSION_NAME,
      app_version_code: OrderKuota.APP_VERSION_CODE,
      app_reg_id: OrderKuota.APP_REG_ID,
    });
    return await this.request('POST', `${OrderKuota.API_URL}/get`, payload);
  }

  async withdrawalQris(amount = '') {
    const payload = new URLSearchParams({
      app_reg_id: OrderKuota.APP_REG_ID,
      app_version_code: OrderKuota.APP_VERSION_CODE,
      app_version_name: OrderKuota.APP_VERSION_NAME,
      auth_username: this.username,
      auth_token: this.authToken,
      'requests[qris_withdraw][amount]': amount,
    });
    return await this.request('POST', `${OrderKuota.API_URL}/get`, payload);
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

      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        return await res.json();
      } else {
        return await res.text();
      }
    } catch (err) {
      return { error: err.message };
    }
  }
}

// FUNCTION QRIS TOOLS
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
  return `FR3DEV-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
}

function generateExpirationTime() {
  const expirationTime = new Date();
  expirationTime.setMinutes(expirationTime.getMinutes() + 30);
  return expirationTime;
}

async function elxyzFile(buffer) {
  try {
    const service = new ImageUploadService('pixhost.to');
    const { directLink } = await service.uploadFromBinary(buffer, 'skyzo.png');
    return directLink;
  } catch (err) {
    return null;
  }
}

async function createQRIS(amount, codeqr) {
  let qrisData = codeqr;
  qrisData = qrisData.slice(0, -4);
  const step1 = qrisData.replace("010211", "010212");
  const step2 = step1.split("5802ID");
  amount = amount.toString();
  let uang = "54" + ("0" + amount.length).slice(-2) + amount;
  uang += "5802ID";
  const final = step2[0] + uang + step2[1];
  const result = final + convertCRC16(final);
  const buffer = await QRCode.toBuffer(result);
  const uploadedFile = await elxyzFile(buffer);
  return {
    idtransaksi: generateTransactionId(),
    jumlah: amount,
    expired: generateExpirationTime(),
    imageqris: { url: uploadedFile }
  };
}

// ROUTE EXPORT
module.exports = [
  {
    name: "Get OTP",
    desc: "Get OTP Orderkuota",
    category: "Orderkuota",
    path: "/orderkuota/getotp?username=&password=",
    async run(req, res) {
      const { username, password } = req.query;
      if (!username) return res.json({ status: false, error: 'Missing username' });
      if (!password) return res.json({ status: false, error: 'Missing password' });
      try {
        const ok = new OrderKuota();
        const login = await ok.loginRequest(username, password);
        res.json({ status: true, result: login.results });
      } catch (err) {
        res.status(500).json({ status: false, error: err.message });
      }
    }
  },
  {
    name: "Get Token",
    desc: "Get Token Orderkuota",
    category: "Orderkuota",
    path: "/orderkuota/gettoken?username=&otp=",
    async run(req, res) {
      const { username, otp } = req.query;
      if (!username) return res.json({ status: false, error: 'Missing username' });
      if (!otp) return res.json({ status: false, error: 'Missing otp' });
      try {
        const ok = new OrderKuota();
        const login = await ok.getAuthToken(username, otp);
        res.json({ status: true, result: login.results });
      } catch (err) {
        res.status(500).json({ status: false, error: err.message });
      }
    }
  },
  {
    name: "Cek Mutasi QRIS",
    desc: "Cek Mutasi Qris Orderkuota",
    category: "Orderkuota",
    path: "/orderkuota/mutasiqr?username=&token=",
    async run(req, res) {
      const { username, token } = req.query;
      if (!username) return res.json({ status: false, error: 'Missing username' });
      if (!token) return res.json({ status: false, error: 'Missing token' });
      try {
        const ok = new OrderKuota(username, token);
        let login = await ok.getTransactionQris();
        login = login.qris_history.results.filter(e => e.status === "IN");
        res.json({ status: true, result: login });
      } catch (err) {
        res.status(500).json({ status: false, error: err.message });
      }
    }
  },
  {
    name: "Create QRIS Payment",
    desc: "Generate QR Code Payment",
    category: "Orderkuota",
    path: "/orderkuota/createpayment?amount=&codeqr=",
    async run(req, res) {
      const { amount, codeqr } = req.query;
      if (!amount) return res.json({ status: false, error: 'Amount is required' });
      if (!codeqr) return res.json({ status: false, error: 'QrCode is required' });
      try {
        const qrData = await createQRIS(amount, codeqr);
        res.status(200).json({ status: true, result: qrData });
      } catch (error) {
        res.status(500).json({ status: false, error: error.message });
      }
    }
  },
  {
  name: "Cek Saldo QRIS",
  desc: "Cek sisa saldo QRIS pada akun OrderKuota",
  category: "Orderkuota",
  path: "/orderkuota/ceksaldoqris?username=&token=",
  async run(req, res) {
    const { username, token } = req.query;
    if (!username) return res.json({ status: false, error: 'Missing username' });
    if (!token) return res.json({ status: false, error: 'Missing token' });

    try {
      const ok = new OrderKuota(username, token);
      const payload = new URLSearchParams({
        auth_token: token,
        auth_username: username,
        'requests[account]': '',
        app_version_name: OrderKuota.APP_VERSION_NAME,
        app_version_code: OrderKuota.APP_VERSION_CODE,
        app_reg_id: OrderKuota.APP_REG_ID,
      });

      const resp = await ok.request('POST', `${OrderKuota.API_URL}/get`, payload);

      if (!resp || resp.success !== true) {
        return res.json({ creator: "FR3HOSTING", status: false, error: 'Gagal mendapatkan data dari API', detail: resp });
      }

      const saldoQris = resp?.results?.account?.qris_balance 
                      ?? resp?.account?.qris_balance
                      ?? resp?.data?.account?.qris_balance
                      ?? null;

      if (saldoQris !== null) {
        res.json({ creator: "FR3HOSTING", status: true, saldoQris });
      } else {
        res.json({ creator: "FR3HOSTING", status: false, error: 'Saldo QRIS tidak ditemukan', detail: resp });
      }
    } catch (err) {
      res.status(500).json({ creator: "FR3HOSTING", status: false, error: err.message });
    }
  }
},
{
  name: "Cek Saldo Akun",
  desc: "Cek saldo utama / dompet pada akun OrderKuota",
  category: "Orderkuota",
  path: "/orderkuota/ceksaldoakun?username=&token=",
  async run(req, res) {
    const { username, token } = req.query;
    if (!username) return res.json({ status: false, error: 'Missing username' });
    if (!token) return res.json({ status: false, error: 'Missing token' });

    try {
      const ok = new OrderKuota(username, token);
      const payload = new URLSearchParams({
        auth_token: token,
        auth_username: username,
        'requests[account]': '',
        app_version_name: OrderKuota.APP_VERSION_NAME,
        app_version_code: OrderKuota.APP_VERSION_CODE,
        app_reg_id: OrderKuota.APP_REG_ID,
      });

      const resp = await ok.request('POST', `${OrderKuota.API_URL}/get`, payload);

      if (!resp || resp.success !== true) {
        return res.json({ creator: "FR3HOSTING", status: false, error: 'Gagal mendapatkan data dari API', detail: resp });
      }

      const saldoAkun = resp?.results?.account?.balance
                      ?? resp?.account?.balance
                      ?? resp?.data?.account?.balance
                      ?? null;

      if (saldoAkun !== null) {
        res.json({ creator: "FR3HOSTING", status: true, saldoAkun });
      } else {
        res.json({ creator: "FR3HOSTING", status: false, error: 'Saldo akun tidak ditemukan', detail: resp });
      }
    } catch (err) {
      res.status(500).json({ creator: "FR3HOSTING", status: false, error: err.message });
    }
  }
}
];
