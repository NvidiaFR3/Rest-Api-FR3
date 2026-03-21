const axios = require("axios");

async function checkAccount(bank, accountNumber) {
    const url = "https://laey.dev/cek-rekening/api/check";
    try {
        const { data } = await axios.post(
            url,
            { bank, accountNumber },
            {
                headers: {
                    "Content-Type": "application/json",
                    "User-Agent": "Mozilla/5.0"
                }
            }
        );
        return data; 
    } catch (error) {
        throw new Error(error.response?.data?.message || error.message);
    }
}

module.exports = {
  name: "Cek Ewallet & Bank",
  desc: "Validasi nomor rekening atau e-wallet",
  category: "Tools",
  path: "/tools/cek-rekening?bank=&nomor=",
  async run(req, res) {
    try {
      const { bank, nomor } = req.query;

      if (!bank || !nomor) {
        return res.json({ status: false, error: "Parameter 'bank' dan 'nomor' diperlukan!" });
      }

      const listBank = [
        "dana", "ovo", "gopay", "shopeepay",
        "002", "008", "009", "013", "451",
        "535", "542", "567", "014", "022"
      ];

      if (!listBank.includes(bank.toLowerCase())) {
        return res.json({ status: false, error: "Kode bank/e-wallet tidak valid!" });
      }

      const result = await checkAccount(bank.toLowerCase(), nomor);
      
      res.json({
        status: true,
        creator: "FR3 NEWERA",
        result: result.data || result
      });

    } catch (err) {
      console.error("Error Cek Rekening:", err.message);
      res.json({ 
        status: false, 
        error: "Terjadi kesalahan pada server atau API target." 
      });
    }
  },
};
