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

module.exports = {
  name: "Order Kuota",
  desc: "API Integrasi OrderKuota (OTP, Token, Mutasi, WD)",
  category: "Payment Gateway",
  path: "/pg/orderkuota?action=&username=&password=",
  async run(req, res) {
    try {
      // Menarik semua query yang dibutuhkan
      const { action, username, password, otp, token, amount, codeqr } = req.query;

      if (!action) {
        return res.json({ 
          status: false, 
          error: "Parameter 'action' diperlukan!", 
          available_actions: ["getotp", "gettoken", "mutasiqr", "profile", "wdqr", "createpayment"] 
        });
      }

      // --- ROUTING BERDASARKAN ACTION ---

      if (action === "getotp") {
        if (!username || !password) return res.json({ status: false, error: "Parameter 'username' dan 'password' diperlukan" });
        const ok = new OrderKuota();
        const login = await ok.loginRequest(username, password);
        if (!login?.results) return res.json({ status: false, error: login?.error || "Login gagal", raw: login });
        return res.json({ status: true, result: login.results });
      }

      if (action === "gettoken") {
        if (!username || !otp) return res.json({ status: false, error: "Parameter 'username' dan 'otp' diperlukan" });
        const ok = new OrderKuota();
        const login = await ok.getAuthToken(username, otp);
        if (!login?.results) return res.json({ status: false, error: login?.error || "OTP gagal", raw: login });
        return res.json({ status: true, result: login.results });
      }

      if (action === "mutasiqr") {
        if (!username || !token) return res.json({ status: false, error: "Parameter 'username' dan 'token' diperlukan" });
        const ok = new OrderKuota(username, token);
        const data = await ok.getTransactionQris();
        if (!data?.qris_history?.results) return res.json({ status: false, error: "Mutasi tidak ada", raw: data });
        const result = data.qris_history.results.filter(e => e.status === "IN");
        return res.json({ status: true, result });
      }

      if (action === "profile") {
        if (!username || !token) return res.json({ status: false, error: "Parameter 'username' dan 'token' diperlukan" });
        const ok = new OrderKuota(username, token);
        const data = await ok.getTransactionQris();
        return res.json({ status: true, result: data });
      }

      if (action === "wdqr") {
        if (!username || !token || !amount) return res.json({ status: false, error: "Parameter 'username', 'token', dan 'amount' diperlukan" });
        const ok = new OrderKuota(username, token);
        const wd = await ok.withdrawalQris(amount);
        const profile = await ok.getTransactionQris();
        return res.json({ status: true, result: { withdraw: wd || {}, profile: profile || {} } });
      }

      if (action === "createpayment") {
        if (!amount || !codeqr) return res.json({ status: false, error: "Parameter 'amount' dan 'codeqr' diperlukan" });
        const qr = await createQRIS(amount, codeqr);
        if (qr.error) return res.json({ status: false, error: qr.error });
        return res.json({ status: true, result: qr });
      }

      // Jika action tidak dikenali
      return res.json({ status: false, error: `Action '${action}' tidak valid.` });

    } catch (err) {
      console.error("Error OrderKuota:", err.message);
      res.json({ 
        status: false, 
        error: "Terjadi kesalahan pada server." 
      });
    }
  },
};
