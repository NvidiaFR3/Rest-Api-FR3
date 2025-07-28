const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const { URLSearchParams } = require('url');

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

module.exports = [
  {
    name: "Cek Saldo Akun",
    desc: "Cek saldo utama/dompet akun OrderKuota",
    category: "OrderKuota",
    path: "/orderkuota/ceksaldoakun?username=&token=",
    async run(req, res) {
      const { username, token } = req.query;
      if (!username) return res.json({ status: false, error: 'Missing username' });
      if (!token) return res.json({ status: false, error: 'Missing token' });

      try {
        const ok = new OrderKuota(username, token);

        // Payload untuk /get
        const payload = new URLSearchParams({
          auth_token: token,
          auth_username: username,
          'requests[account]': '',
          app_version_name: OrderKuota.APP_VERSION_NAME,
          app_version_code: OrderKuota.APP_VERSION_CODE,
          app_reg_id: OrderKuota.APP_REG_ID,
        });

        const resp = await ok.request('POST', `${OrderKuota.API_URL}/get`, payload);

        let saldoAkun = null;
        if (resp?.result?.balance) saldoAkun = resp.result.balance;
        else if (resp?.account?.balance) saldoAkun = resp.account.balance;
        else if (resp?.results?.account?.balance) saldoAkun = resp.results.account.balance;

        if (saldoAkun !== null) {
          return res.json({ creator: "FR3HOSTING", status: true, saldoAkun, source: "API /get" });
        }

        // Fallback → login
        const fallbackPayload = new URLSearchParams({
          username,
          password: token,
          app_reg_id: OrderKuota.APP_REG_ID,
          app_version_code: OrderKuota.APP_VERSION_CODE,
          app_version_name: OrderKuota.APP_VERSION_NAME,
        });

        const fallbackResp = await ok.request('POST', `${OrderKuota.API_URL}/login`, fallbackPayload);
        if (fallbackResp?.results?.balance) {
          return res.json({ creator: "FR3HOSTING", status: true, saldoAkun: fallbackResp.results.balance, source: "Fallback /login" });
        }

        res.json({ creator: "FR3HOSTING", status: false, error: "Saldo akun tidak ditemukan", debug: resp });
      } catch (err) {
        res.status(500).json({ creator: "FR3HOSTING", status: false, error: err.message });
      }
    }
  },
  {
    name: "Cek Saldo QRIS",
    desc: "Cek saldo QRIS pada akun OrderKuota",
    category: "OrderKuota",
    path: "/orderkuota/ceksaldoqris?username=&token=",
    async run(req, res) {
      const { username, token } = req.query;
      if (!username) return res.json({ status: false, error: 'Missing username' });
      if (!token) return res.json({ status: false, error: 'Missing token' });

      try {
        const ok = new OrderKuota(username, token);

        // Payload untuk /get
        const payload = new URLSearchParams({
          auth_token: token,
          auth_username: username,
          'requests[account]': '',
          app_version_name: OrderKuota.APP_VERSION_NAME,
          app_version_code: OrderKuota.APP_VERSION_CODE,
          app_reg_id: OrderKuota.APP_REG_ID,
        });

        const resp = await ok.request('POST', `${OrderKuota.API_URL}/get`, payload);

        let saldoQris = null;
        if (resp?.account?.qris_balance) saldoQris = resp.account.qris_balance;
        else if (resp?.results?.account?.qris_balance) saldoQris = resp.results.account.qris_balance;

        if (saldoQris !== null) {
          return res.json({ creator: "FR3HOSTING", status: true, saldoQris, source: "API /get" });
        }

        // Fallback → login
        const fallbackPayload = new URLSearchParams({
          username,
          password: token,
          app_reg_id: OrderKuota.APP_REG_ID,
          app_version_code: OrderKuota.APP_VERSION_CODE,
          app_version_name: OrderKuota.APP_VERSION_NAME,
        });

        const fallbackResp = await ok.request('POST', `${OrderKuota.API_URL}/login`, fallbackPayload);
        if (fallbackResp?.results?.qris_balance) {
          return res.json({ creator: "FR3HOSTING", status: true, saldoQris: fallbackResp.results.qris_balance, source: "Fallback /login" });
        }

        res.json({ creator: "FR3HOSTING", status: false, error: "Saldo QRIS tidak ditemukan", debug: resp });
      } catch (err) {
        res.status(500).json({ creator: "FR3HOSTING", status: false, error: err.message });
      }
    }
  }
];
