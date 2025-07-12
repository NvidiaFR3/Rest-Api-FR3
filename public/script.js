    const chatbox = document.getElementById("chatbox");
    const input = document.getElementById("userInput");
    const themeToggle = document.getElementById("themeToggle");
    const typingStatus = document.getElementById("typingStatus");

    let chatHistory = [];

    const prompt = `Nama kamu FR3 BOT, kamu adalah asisten virtual milik Rendy Indra Peratama.
Jawablah dengan bahasa Indonesia yang sopan, ringkas, dan ramah.
Jika tidak tahu jawabannya, balas: "Maaf, saya tidak tahu jawabannya."`;

    function escapeHtml(unsafe) {
      return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
    }

    function copyToClipboard(btn) {
      const code = btn.previousElementSibling.textContent;
      navigator.clipboard.writeText(code).then(() => {
        btn.textContent = "Disalin!";
        setTimeout(() => (btn.textContent = "Salin"), 2000);
      });
    }

    function addMessage(text, sender = "user", save = true) {
      const msg = document.createElement("div");
      msg.classList.add("bubble", sender);

      if (text.includes("```")) {
        const html = text.replace(/```(\w+)?\n([\s\S]*?)```/g, (_, lang, code) => {
          return `<pre><code class="language-${lang || ''}">${escapeHtml(code)}</code>
<button class="copy-btn" onclick="copyToClipboard(this)">Salin</button></pre>`;
        });
        msg.innerHTML = html;
      } else {
        msg.textContent = text;
      }

      chatbox.appendChild(msg);
      setTimeout(() => {
        chatbox.scrollTop = chatbox.scrollHeight;
      }, 100);

      if (save) {
        chatHistory.push({ sender, text });
      }
    }

    async function sendMessage() {
      const text = input.value.trim();
      if (!text) return;

      addMessage(text, "user");
      input.value = "";

      chatHistory.push({ sender: "user", text });
      typingStatus.textContent = "FR3 BOT sedang mengetik...";

      try {
        const conversation = chatHistory
          .map(msg => `${msg.sender === "user" ? "User" : "FR3 BOT"}: ${msg.text}`)
          .join("\n");

        const fullPrompt = `${prompt}\n${conversation}\nFR3 BOT:`;

        const res = await fetch(`https://api.nvidiabotz.xyz/ai/chatgpt?question=${encodeURIComponent(fullPrompt)}`);
        const data = await res.json();

        typingStatus.textContent = "";
        const reply = data?.result || "Maaf, aku belum bisa menjawab itu 😅";
        addMessage(reply, "bot");
        chatHistory.push({ sender: "bot", text: reply });
      } catch (err) {
        typingStatus.textContent = "";
        const failMsg = "⚠️ Gagal koneksi ke API.";
        addMessage(failMsg, "bot");
        chatHistory.push({ sender: "bot", text: failMsg });
      }
    }

    input.addEventListener("keydown", e => {
      if (e.key === "Enter") sendMessage();
    });

    themeToggle.addEventListener("click", () => {
      document.body.classList.toggle("dark");
      themeToggle.innerHTML = document.body.classList.contains("dark")
        ? '<i class="fas fa-sun"></i>'
        : '<i class="fas fa-moon"></i>';
    });
