const axios = require("axios");

async function blackboxAI(question) {
  if (!question) throw new Error("Question is required");

  const requestBody = {
    model: "blackbox-model-v1", // Ganti dengan model yang sesuai dari Blackbox AI
    messages: [
      {
        role: "user",
        content: question, // Pastikan ini string
      },
    ],
  };

  try {
    const response = await axios.post(
      "https://api.blackbox.ai/v1/chat/completions", // Ganti dengan endpoint API Blackbox AI yang benar
      requestBody,
      {
        headers: {
          Authorization: "Bearer sk-rpZx1090xvTTAkc2oXCzrQ", // Ganti dengan token API Anda
          "Content-Type": "application/json",
        },
      }
    );

    // Ambil hasil response sesuai struktur API Blackbox AI
    const fullText = response.data.choices?.[0]?.message?.content || "";

    return fullText.trim();
  } catch (err) {
    // Logging error detail untuk debugging
    console.error("Request payload:", JSON.stringify(requestBody, null, 2));
    console.error("Response error:", err.response?.data || err.message);
    throw new Error(err.response?.data?.error || err.message);
  }
}

module.exports = {
  name: "BlackboxAI",
  desc: "Integrasi AI Blackbox untuk percakapan",
  category: "Artificial Intelligence",
  path: "/ai/blackbox?question=",

  async run(req, res) {
    const { question } = req.query;

    if (!question) {
      return res.json({ status: false, error: "Parameter 'question' is required" });
    }

    try {
      const result = await blackboxAI(question);

      res.json({
        creator: "FR3-NEWERA",
        status: true,
        result: result,
      });
    } catch (err) {
      res.status(500).json({
        status: false,
        error: err.message,
      });
    }
  },
};
