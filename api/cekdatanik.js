const axios = require('axios');

module.exports = {
  name: "Cek Data Nik Online",
  desc: "Cek data pemilih berdasarkan NIK di sistem KPU",
  category: "Tools",
  path: "/tools/cekdpt?nik=",
  async run(req, res) {
    const { nik } = req.query;
    if (!nik) return res.json({ status: false, error: "Parameter 'nik' diperlukan" });

    const token = "5iFp0UX0cAFcWəACaY7z3aPPVp0ɴKJSsNEOkPLxɢ4bt2n4Yy0Kʌ0TrʍsUluM6JSQnmHkzNe0aUyXYeS308HUm-0Xz64hzpyK-VoJ-74d_O38dQLvOEVxftxVZydHfKyObrbtxiyJiE-33NHOSbKHXyCTPbFbUmX8zD64oQ4UwcQCI8bkL7fvxbvRNrjBUxYzQGBroV0amOscizkpt5kibsFX5ZCYjZJzzf_J66KZ3M2k7G7tD7NPe5YAsntkj0gHCzM9A1yr4_enBfdeXtyqf3XpITLN-R16znPlyTFwL2dEKCCcGpCy2qUiFcN3JMq19yRrPS7_EL05136ojJ0seW0sBQC-Xt5m7WucNKIfwkYUB7GPXArGYyiGBdz0p97dm9YEuffCHZDnGAyZ7u2x2-qIHZvOWlL6H4W65lcawOtOiath72UTQTFRUuDAr5fx3CAHyUd3d4gW3I6-eXlgYl0cVQw-I_h9G1HLtSM6MIWXIOM2fgdsYa1litf434lH_2Jf6XghjzU6X0eUwaufvV26Z8CBN1qm0BJhG_zwvjqWr3U9oHAPxGqqU-g8ARgsDxmIBb1xI83B7jJjua5FRPEGGqvFWyLVeLnFhuG5q9pyiJhQm-g9m8Nw6UHud4OS-QNPexKHMec2DXttOdR8hHEe8oUBQgqv6B3nrkxof_X5sVXQKQqTRfBdoOX0yHX5NIV-oXzXUPZPDiyKpZaGYYVbhHSsWFMdP7aqbFAa9ijThc7c-LJERh4GMuyDWn9-N0aPme_X8eiLRtxnpqROtqn09uzDW9FI9mgI6-WT2i8yY8eFysxOXjn5W7RrzxAlE8qdYxDZrpAO5z9g6XLZAVFnrHHF5G51Rnd4ZFU8QY-m9iDAibKNX29yC9oRpY5bcKrkE8kJoyLVQaJFR50AF0vztIAq1Zb-8djCkblV8cK1i0N2el0ghXfcZT0mnSAzlYD_-MBk-mfatUf6HEVwv93MkhJ2pAT8AyecmaC739cDWn8Z934OBHIBBTVkgoSJpzhw9R_Z39To9fjZOCR1WjwRuEORHjbeyrZAovMbbWQX1PySh0-WZmo1d-PYLtGVknvP5pJkmYYnHuOlK";

    const payload = {
      query: `{ findNikSidalih(nik: "${nik}", wilayah_id: 0, token: "${token}") { nama kabupaten kelurahan lhp { nama kelurahan } } }`
    };

    try {
      const response = await axios.post("https://cekdptonline.kpu.go.id/v2", payload, {
        headers: {
          "Content-Type": "application/json;charset=UTF-8",
          "Accept": "application/json, text/plain, */*",
          "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Mobile Safari/537.36",
          "Origin": "https://cekdptonline.kpu.go.id",
          "Referer": "https://cekdptonline.kpu.go.id/"
        }
      });

      const datana = response.data?.data?.findNikSidalih;

      if (!datana || !datana.nama) {
        return res.json({ status: false, message: "Data tidak ditemukan" });
      }

      return res.json({
        status: true,
        data: {
          nama: datana.nama,
          kabupaten: datana.kabupaten,
          kelurahan: datana.kelurahan,
          lhp: datana.lhp || []
        }
      });

    } catch (error) {
      return res.json({ status: false, error: error.message || "Gagal mengambil data" });
    }
  }
};
