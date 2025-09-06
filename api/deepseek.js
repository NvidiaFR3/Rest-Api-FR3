const axios = require("axios");

async function deepsek(question, { system_prompt = null, model = "deepseek-v3" } = {}) {
  const allowedModels = ["deepseek-v3", "deepseek-r1"];

  if (!question) throw new Error("Question is required");
  if (!allowedModels.includes(model)) throw new Error(`Available models: ${allowedModels.join(", ")}`);

  const response = await axios.post(
    "https://api.appzone.tech/v1/chat/completions",
    {
      messages: [
        ...(system_prompt
          ? [
              {
                role: "system",
                content: [{ type: "text", text: system_prompt }],
              },
            ]
          : []),
        {
          role: "user",
          content: [{ type: "text", text: question }],
        },
      ],
      model: model,
      isSubscribed: true,
    },
    {
      headers: {
        authorization: "Bearer az-chatai-key",
        "content-type": "application/json",
        "user-agent": "okhttp/4.9.2",
        "x-app-version": "3.0",
        "x-requested-with": "XMLHttpRequest",
        "x-user-id": "$RCAnonymousID:84947a7a4141450385bfd07a66c3b5c4",
      },
    }
  );

  let fullText = "";
  const lines = response.data.split("\n\n").map((line) => line.substring(6));
  for (const line of lines) {
    if (line === "[DONE]") continue;
    try {
      const d = JSON.parse(line);
      fullText += d.choices[0].delta.content || "";
    } catch (e) {}
  }

  return fullText.trim();
}

module.exports = {
  name: "DeepSeek",
  desc: "AI DeepSeek untuk percakapan cerdas",
  category: "Artificial Intelligence",
  path: "/ai/deepseek?question=&model=&prompt=",

  async run(req, res) {
    const { question, model, prompt } = req.query;

    if (!question) {
      return res.json({ status: false, error: "Parameter 'question' is required" });
    }

    try {
      const result = await deepsek(question, {
        model: model || "deepseek-v3",
        system_prompt: prompt || null,
      });

      res.json({
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
