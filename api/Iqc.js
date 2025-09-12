// feature-iqc-iphone-quote-simple.js
const { createCanvas, loadImage, registerFont } = require("canvas");
const fetch = require("node-fetch");

function safeNumber(v, def) {
  const n = parseInt(v);
  return Number.isFinite(n) && n > 0 ? n : def;
}

function wrapTextForWidth(ctx, text, maxWidth) {
  const words = text.split(" ");
  const lines = [];
  let line = "";

  for (let i = 0; i < words.length; i++) {
    const test = line ? line + " " + words[i] : words[i];
    const w = ctx.measureText(test).width;
    if (w > maxWidth && line) {
      lines.push(line);
      line = words[i];
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

async function fetchImageSafe(url) {
  try {
    const r = await fetch(url);
    if (!r.ok) return null;
    const buf = await r.buffer();
    return await loadImage(buf);
  } catch {
    return null;
  }
}

module.exports = {
  name: "IQC iPhone Quote",
  desc: "Generate iPhone-style chat quote image (simple, no reactions)",
  category: "ImageCreator",
  path: "/imagecreator/iqc?text=&sender=&time=&bg=&width=&height=",

  async run(req, res) {
    try {
      const text = (req.query.text || "").trim();
      if (!text) return res.json({ status: false, error: "Parameter 'text' diperlukan" });

      const sender = (req.query.sender || "").trim();
      const time = req.query.time || new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
      const width = safeNumber(req.query.width, 1240);
      const height = safeNumber(req.query.height, 2680);
      const bgUrl = req.query.bg || null;

      const canvas = createCanvas(width, height);
      const ctx = canvas.getContext("2d");

      // background gelap
      ctx.fillStyle = "#0b1220";
      ctx.fillRect(0, 0, width, height);

      if (bgUrl) {
        const bgimg = await fetchImageSafe(bgUrl);
        if (bgimg) {
          ctx.globalAlpha = 0.15;
          const scale = Math.max(width / bgimg.width, height / bgimg.height);
          const bw = bgimg.width * scale;
          const bh = bgimg.height * scale;
          ctx.drawImage(bgimg, (width - bw) / 2, (height - bh) / 2, bw, bh);
          ctx.globalAlpha = 1;
        }
      }

      // ukuran bubble
      const marginX = Math.round(width * 0.06);
      const bubbleMaxWidth = Math.round(width * 0.78);
      const bubbleX = marginX;
      const topOffset = Math.round(height * 0.28);
      const bubblePadX = Math.round(width * 0.04);
      const bubblePadY = Math.round(width * 0.035);
      const bubbleRadius = Math.round(width * 0.03);

      // font
      const msgFontSize = Math.round(width * 0.045);
      const senderFontSize = Math.round(msgFontSize * 0.65);
      const timeFontSize = Math.round(msgFontSize * 0.55);
      const baseFont = "Arial";

      ctx.font = `${msgFontSize}px ${baseFont}`;
      const usableWidth = bubbleMaxWidth - bubblePadX * 2;
      const lines = wrapTextForWidth(ctx, text, usableWidth);

      let maxLineW = 0;
      for (const ln of lines) {
        const w = ctx.measureText(ln).width;
        if (w > maxLineW) maxLineW = w;
      }
      if (sender) {
        ctx.font = `${senderFontSize}px ${baseFont}`;
        const sw = ctx.measureText(sender).width;
        if (sw > maxLineW) maxLineW = sw;
      }

      const bubbleWidth = maxLineW + bubblePadX * 2;
      const lineHeight = Math.round(msgFontSize * 1.35);
      const textHeight = lines.length * lineHeight;
      const senderH = sender ? senderFontSize * 1.25 : 0;
      const bubbleHeight = bubblePadY + senderH + textHeight + bubblePadY + 20;

      const bubbleY = topOffset;

      // rounded rect bubble
      const drawRoundedRect = (x, y, w, h, r, fill) => {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.arcTo(x + w, y, x + w, y + h, r);
        ctx.arcTo(x + w, y + h, x, y + h, r);
        ctx.arcTo(x, y + h, x, y, r);
        ctx.arcTo(x, y, x + w, y, r);
        ctx.closePath();
        ctx.fillStyle = fill;
        ctx.fill();
      };

      drawRoundedRect(bubbleX, bubbleY, bubbleWidth, bubbleHeight, bubbleRadius, "rgba(18,20,24,0.9)");

      let cursorY = bubbleY + bubblePadY;
      if (sender) {
        ctx.font = `${senderFontSize}px ${baseFont}`;
        ctx.fillStyle = "rgba(255,255,255,0.78)";
        ctx.fillText(sender, bubbleX + bubblePadX, cursorY + senderFontSize);
        cursorY += senderH;
      }

      ctx.font = `${msgFontSize}px ${baseFont}`;
      ctx.fillStyle = "#ffffff";
      for (let i = 0; i < lines.length; i++) {
        ctx.fillText(lines[i], bubbleX + bubblePadX, cursorY + msgFontSize + i * lineHeight - (sender ? 4 : 0));
      }
      cursorY += textHeight + 6;

      // draw time bottom-right
      ctx.font = `${timeFontSize}px ${baseFont}`;
      ctx.fillStyle = "rgba(255,255,255,0.55)";
      const timeW = ctx.measureText(time).width;
      ctx.fillText(time, bubbleX + bubbleWidth - bubblePadX - timeW, bubbleY + bubbleHeight - bubblePadY / 2);

      // output
      const buffer = canvas.toBuffer("image/png");
      res.setHeader("Content-Type", "image/png");
      res.end(buffer);
    } catch (err) {
      console.error("IQC simple error:", err);
      res.status(500).json({ status: false, error: err.message });
    }
  }
};
