const axios = require('axios');
const qs = require('qs');

async function cekEwallet(provider, nomor) {
  try {
    const timestamp = Date.now().toString();

    const data = qs.stringify({
      app_reg_id: 'cUx8YuXhS5yLKPOaY6_zv_:APA91bH7c1pEuuxtYnTgJAegkbDkj8cicnpkEEQkp0v2yr3bEfWKqIYCuNkwX_VdUjQuJ3UpP75mb72I3kowTpXGomHsspEfIaNnVabdrCEeHFG2IEWWLPU',
      phone_uuid: 'di309HvATsaiCppl5eDpoc',
      phone_model: 'SM-G960N',
      phoneNumber: nomor,
      request_time: timestamp,
      phone_android_version: '14',
      app_version_code: '250811',
      auth_username: 'sumarjono',
      customerId: '',
      id: provider,
      auth_token: '2604338:tMbsgZKq2JYxOG8BvTQnfm1oup0XaNPI',
      app_version_name: '25.08.11',
      ui_mode: 'dark'
    });

    const config = {
      method: 'POST',
      url: `https://checker.orderkuota.com/api/checkname/produk/d106f5ef32/28/2604338/${provider}`,
      headers: {
        'User-Agent': 'okhttp/4.12.0',
        'Accept-Encoding': 'gzip',
        'Content-Type': 'application/x-www-form-urlencoded',
        'signature': '9668c5f11a9703544d9350f840174ffacc090a8882e4c4099dc100f286e0d609398d28e6c9be96d0b985b068d1d2ea9d9bcf9ab9f8ad8115f91b29d7b97c80b1',
        'timestamp': timestamp
      },
      data
    };

    const response = await axios.request(config);
    return { status: true, result: response.data };
  } catch (err) {
    return { status: false, error: err.message };
  }
}

module.exports = [
  {
    name: "Cek Nama Dana",
    desc: "Cek nama akun Dana",
    category: "Tools",
    path: "/tools/cekewallet/dana?nomor=",
    async run(req, res) {
      const { nomor } = req.query;
      if (!nomor) return res.json({ status: false, error: 'Missing nomor' });
      const result = await cekEwallet("dana", nomor);
      res.json(result);
    }
  },
  {
    name: "Cek Nama OVO",
    desc: "Cek nama akun OVO",
    category: "Tools",
    path: "/tools/cekewallet/ovo?nomor=",
    async run(req, res) {
      const { nomor } = req.query;
      if (!nomor) return res.json({ status: false, error: 'Missing nomor' });
      const result = await cekEwallet("ovo", nomor);
      res.json(result);
    }
  },
  {
    name: "Cek Nama GoPay",
    desc: "Cek nama akun GoPay",
    category: "Tools",
    path: "/tools/cekewallet/gopay?nomor=",
    async run(req, res) {
      const { nomor } = req.query;
      if (!nomor) return res.json({ status: false, error: 'Missing nomor' });
      const result = await cekEwallet("gopay", nomor);
      res.json(result);
    }
  },
  {
    name: "Cek Nama Shopeepay",
    desc: "Cek nama akun Shopeepay",
    category: "Tools",
    path: "/tools/cekewallet/shopeepay?nomor=",
    async run(req, res) {
      const { nomor } = req.query;
      if (!nomor) return res.json({ status: false, error: 'Missing nomor' });
      const result = await cekEwallet("shopeepay", nomor);
      res.json(result);
    }
  },
  {
    name: "Cek Nama LinkAja",
    desc: "Cek nama akun LinkAja",
    category: "Tools",
    path: "/tools/cekewallet/linkaja?nomor=",
    async run(req, res) {
      const { nomor } = req.query;
      if (!nomor) return res.json({ status: false, error: 'Missing nomor' });
      const result = await cekEwallet("linkaja", nomor);
      res.json(result);
    }
  }
];
