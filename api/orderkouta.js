const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const { URLSearchParams } = require('url');

class OrderKuota {
  static API_URL = 'https://app.orderkuota.com/api/v2';
  static HOST   = 'app.orderkuota.com';
  static USER_AGENT = 'okhttp/4.10.0';
  static APP_VERSION_NAME = '25.03.14';
  static APP_VERSION_CODE = '250314';
  static APP_REG_ID =
    'di309HvATsaiCppl5eDpoc:APA91bFUcTOH8h2XHdPRz2qQ5Bezn-3_TaycFcJ5pNLGWpmaxheQP9Ri0E56wLHz0_b1vcss55jbRQXZgc9loSfBdNa5nZJZVMlk7GS1JDMGyFUVvpcwXbMDg8tjKGZAurCGR4kDMDRJ';

  constructor(username, authToken) {
    this.username = username;
    this.authToken = authToken;
  }

  headers() {
    return {
      Host: OrderKuota.HOST,
      'User-Agent': OrderKuota.USER_AGENT,
      'Content-Type': 'application/x-www-form-urlencoded',
    };
  }

  async _post(path, body) {
    try {
      const res = await fetch(`${OrderKuota.API_URL}${path}`, {
        method: 'POST',
        headers: this.headers(),
        body: body.toString(),
      });

      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const json = await res.json();
        if (json.status === false) throw new Error(json.message || 'API returned false');
        return json;
      }
      return await res.text();
    } catch (err) {
      throw err; // bubble up
    }
  }

  async getAccountData() {
    // 1) coba /get
    const payload = new URLSearchParams({
      auth_token: this.authToken,
      auth_username: this.username,
      'requests[account]': '',
      app_version_name: OrderKuota.APP_VERSION_NAME,
      app_version_code: OrderKuota.APP_VERSION_CODE,
      app_reg_id: OrderKuota.APP_REG_ID,
    });
    try {
      return await this._post('/get', payload);
    } catch {
      // 2) fallback /login
      const fallback = new URLSearchParams({
        username: this.username,
        password: this.authToken,
        app_reg_id: OrderKuota.APP_REG_ID,
        app_version_code: OrderKuota.APP_VERSION_CODE,
        app_version_name: OrderKuota.APP_VERSION_NAME,
      });
      return await this._post('/login', fallback);
    }
  }
}

module.exports = [
  {
    name: 'Cek Saldo Akun',
    desc: 'Cek saldo utama/dompet akun OrderKuota',
    category: 'Orderkuota',
    path: '/orderkuota/ceksaldoakun',
    async run(req, res) {
      const { username, token } = req.query;
      if (!username || !token)
        return res.json({ creator: 'FR3HOSTING', status: false, error: 'username & token required' });

      try {
        const ok = new OrderKuota(username, token);
        const data = await ok.getAccountData();

        // prioritas path
        const balance =
          data?.result?.balance ??
          data?.results?.balance ??
          data?.account?.balance;

        if (balance === undefined) throw new Error('Saldo akun tidak ditemukan');

        res.json({
          creator: 'FR3HOSTING',
          status: true,
          saldoAkun: balance,
          source: data.result ? '/get' : '/login',
        });
      } catch (err) {
        res.json({ creator: 'FR3HOSTING', status: false, error: err.message });
      }
    },
  },
  {
    name: 'Cek Saldo QRIS',
    desc: 'Cek saldo QRIS pada akun OrderKuota',
    category: 'Orderkuota',
    path: '/orderkuota/ceksaldoqris',
    async run(req, res) {
      const { username, token } = req.query;
      if (!username || !token)
        return res.json({ creator: 'FR3HOSTING', status: false, error: 'username & token required' });

      try {
        const ok = new OrderKuota(username, token);
        const data = await ok.getAccountData();

        const qrisBalance =
          data?.result?.qris_balance ??
          data?.results?.qris_balance ??
          data?.account?.qris_balance;

        if (qrisBalance === undefined) throw new Error('Saldo QRIS tidak ditemukan');

        res.json({
          creator: 'FR3HOSTING',
          status: true,
          saldoQris: qrisBalance,
          source: data.result ? '/get' : '/login',
        });
      } catch (err) {
        res.json({ creator: 'FR3HOSTING', status: false, error: err.message });
      }
    },
  },
];
