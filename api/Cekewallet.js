const axios = require('axios');

async function checkSingleEwallet(ewallet, accNum) {
  const NETOVAS_API_URL = 'https://netovas.com/api/cekrek/v1/account-inquiry';
  const data = new URLSearchParams();
  data.append('account_bank', ewallet);
  data.append('account_number', accNum);

  try {
    const response = await axios.post(NETOVAS_API_URL, data, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    
    if (response.data && response.data.success && response.data.data) {
      return response.data.data;
    } else {
      return {
        account_bank: ewallet,
        account_holder: 'NOT FOUND!',
        account_number: accNum,
      };
    }
  } catch (error) {
    console.error(`Scrape error for ${ewallet}:`, error.message);
    return {
      account_bank: ewallet,
      account_holder: 'NOT FOUND!',
      account_number: accNum,
    };
  }
}
module.exports = [
  {
    name: "E-Wallet Account Inquiry",
    desc: "Checks an account number against OVO, DANA, GoPay, LinkAja, and ShopeePay.",
    category: "E-Wallet",
    path: "/ewallet/check?account_number=",
    async run(req, res) {
      const { account_number } = req.query;
      const cek = await validateApiKey(apikey);
      if (!cek.valid) {
        return res.status(401).json({ status: false, error: cek.msg });
      }

      if (!account_number) {
        return res.status(400).json({
          status: false,
          error: "Missing required parameter: account_number"
        });
      }

      try {
        const EWALLET_LIST = ['ovo', 'dana', 'linkaja', 'gopay', 'shopeepay'];
        const checkPromises = EWALLET_LIST.map(ewallet => 
          checkSingleEwallet(ewallet, account_number)
        );

        const results = await Promise.all(checkPromises);
        res.json({
          status: true,
          message: "E-wallet inquiry successful",
          data: results
        });
      } catch (error) {
        console.error("E-Wallet Scrape Internal Error:", error.message);
        return res.status(500).json({
          status: false,
          error: "An internal error occurred during the e-wallet scrape."
        });
      }
    }
  }
];
