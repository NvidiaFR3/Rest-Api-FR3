const axios = require("axios");

async function blackboxAI(question) {
  if (!question) throw new Error("Question is required");

  const response = await axios.post(
    "https://api.blackbox.ai/v1/chat/completions", // ganti dengan endpoint Blackbox AI yang benar
    {
      model: "blackbox-model-v1", // ganti dengan model yang sesuai
      messages: [
        {
          role: "user",
          content: question,
        },
      ],
    },
    {
      headers: {
        Authorization: "Bearer sk-rpZx1090xvTTAkc2oXCzrQ", // ganti dengan token Blackbox AI Anda
        "Content-Type": "application/json",
      },
    }
  );

  // Ambil hasil response sesuai struktur Blackbox AI
  const fullText = response.data.choices?.[0]?.message?.content || "";

  return fullText.trim();
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
