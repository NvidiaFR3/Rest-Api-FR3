const fetch = require("node-fetch");

const Apis = ["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", "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", 
  "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", 
  "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", 
  "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"]

const GROQ_API_KEY = Apis[Math.floor(Math.random() * Apis.length)];

async function askGroq(prompt, question, model) {
  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: "system",
            content: prompt
          },
          {
            role: "user",
            content: question
          }
        ]
      })
    });

    const data = await response.json();
    return data.choices?.[0]?.message?.content || "No response from model.";
  } catch (error) {
    console.error("Error:", error);
    return "Error while fetching response.";
  }
}

module.exports = [
{
    name: "Grok",
    desc: "Ai grok models",
    category: "Artificial Intelligence",
    path: "/ai/grok?question=",
    async run(req, res) {
        const { question, model, prompt } = req.query;

        if (!question) {
            return res.json({ status: false, error: "Parameter 'question' is required" });
        }

        try {
            const result = await askGroq("", question, "compound-beta")

            res.status(200).json({
                status: true,
                result: result
            });
        } catch (err) {
            res.status(500).json({ status: false, error: err.message });
        }
    }
},

{
    name: "Chat GPT",
    desc: "Ai chat gpt models",
    category: "Artificial Intelligence",
    path: "/ai/chatgpt?question=",
    async run(req, res) {
        const { question, model, prompt } = req.query;

        if (!question) {
            return res.json({ status: false, error: "Parameter 'question' is required" });
        }

        try {
            const result = await askGroq("", question, "openai/gpt-oss-120b")

            res.status(200).json({
                status: true,
                result: result
            });
        } catch (err) {
            res.status(500).json({ status: false, error: err.message });
        }
    }
}, 

{
    name: "Gemini",
    desc: "Ai gemini models",
    category: "Artificial Intelligence",
    path: "/ai/gemini?question=",
    async run(req, res) {
        const { question } = req.query;

        if (!question) {
            return res.json({ status: false, error: "Parameter 'question' is required" });
        }

        try {
            const result = await askGroq("", question, "openai/gpt-oss-120b")

            res.status(200).json({
                status: true,
                result: result
            });
        } catch (err) {
            res.status(500).json({ status: false, error: err.message });
        }
    }
}, 

{
  name: "GPT Prompt",
  desc: "Ai gpt prompt models",
  category: "Artificial Intelligence",
  path: "/ai/gpt?prompt=&text=",

  async run(req, res) {
    const { text, prompt } = req.query;

    if (!text)
      return res.json({ status: false, error: "Text is required" });

    try {
      const result = await askGroq(prompt, text, "openai/gpt-oss-120b")

            res.status(200).json({
                status: true,
                result: result
            });
    } catch (err) {
      res.status(500).json({ status: false, error: err.message });
    }
  }
}

]