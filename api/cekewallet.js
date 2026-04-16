module.exports = {
  name: "Cek Rekening",
  desc: "Memeriksa pemilik rekening berbagai bank dan e-wallet",
  category: "Tools",
  path: "/tools/cek-rekening?bank=&number=",
  async run(req, res) {
    const { bank, number } = req.query;

    if (!bank || !number) {
      return res.json({ 
        status: false, 
        message: 'Masukkan parameter bank (misal: bca, ovo) dan number' 
      });
    }

    const apiUrl = 'https://laey.dev/cek-rekening/api/check';
    
    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': 'FREE',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        body: JSON.stringify({
          bank: bank.toLowerCase(),
          accountNumber: number
        })
      });

      const result = await response.json();
      res.json(result);
    } catch (error) {
      res.json({ 
        status: false, 
        error: 'Gagal menghubungkan ke server API' 
      });
    }
  }
}
