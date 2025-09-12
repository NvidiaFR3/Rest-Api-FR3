// feature-iqc-iphone-quote-fixed.js
const { createCanvas, loadImage, registerFont } = require("canvas");
const fetch = require("node-fetch");
const path = require("path");
const fs = require("fs");

// OPTIONAL: register SF Pro or other fonts if available on your server
// registerFont(path.join(__dirname, 'fonts', 'SFProDisplay-Regular.ttf'), { family: 'SFPro' });
// registerFont('/usr/share/fonts/truetype/noto/NotoColorEmoji.ttf', { family: 'NotoEmoji' });

function safeNumber(v, def) {
  const n = parseInt(v);
  return Number.isFinite(n) && n > 0 ? n : def;
}

function wrapTextForWidth(ctx, text, maxWidth) {
  // ensure ctx.font is already set
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
    const r = await fetch(url, { timeout: 15000 });
    if (!r.ok) return null;
    const buf = await r.buffer();
    return await loadImage(buf);
  } catch (e) {
    return null;
  }
}

module.exports = {
  name: "IQC iPhone Quote (fixed)",
  desc: "Generate iPhone-style chat quote image (fixed layout logic)",
  category: "ImageCreator",
  path: "/imagecreator/iqc?text=&sender=&time=&reactions=&bg=&width=&height=",

  async run(req, res) {
    try {
      const text = (req.query.text || "").trim();
      if (!text) return res.status(400).json({ status: false, error: "Parameter 'text' required" });

      const sender = (req.query.sender || "").trim();
      const time = (req.query.time || new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }));
      const reactions = (req.query.reactions || "").split(",").map(r => r.trim()).filter(Boolean);
      const width = safeNumber(req.query.width, 1240);
      const height = safeNumber(req.query.height, 2680);
      const bgUrl = req.query.bg || null;

      // canvas
      const canvas = createCanvas(width, height);
      const ctx = canvas.getContext("2d");

      // background
      ctx.fillStyle = "#0b1220";
      ctx.fillRect(0, 0, width, height);

      // optional background image (very faint)
      if (bgUrl) {
        const bgimg = await fetchImageSafe(bgUrl);
        if (bgimg) {
          ctx.globalAlpha = 0.14;
          const scale = Math.max(width / bgimg.width, height / bgimg.height);
          const bw = bgimg.width * scale;
          const bh = bgimg.height * scale;
          ctx.drawImage(bgimg, (width - bw) / 2, (height - bh) / 2, bw, bh);
          ctx.globalAlpha = 1;
        }
      }

      // layout constants (responsive)
      const marginX = Math.round(width * 0.06);
      const bubbleMaxWidth = Math.round(width * 0.78); // max bubble width (responsive)
      const bubbleX = marginX; // left aligned incoming bubble
      const topOffset = Math.round(height * 0.28); // where bubble will start (roughly)
      const bubblePadX = Math.round(width * 0.04);
      const bubblePadY = Math.round(width * 0.035);
      const bubbleRadius = Math.round(width * 0.03);

      // fonts (responsive sizes)
      const baseFont = "Arial"; // fallback; register SFPro if available
      const msgFontSize = Math.round(width * 0.045); // message size
      const senderFontSize = Math.round(msgFontSize * 0.65);
      const timeFontSize = Math.round(msgFontSize * 0.55);
      const reactionFontSize = Math.round(msgFontSize * 0.8);

      // prepare ctx for measuring
      ctx.font = `${msgFontSize}px ${baseFont}`;

      // wrap text according to bubble usable width
      const usableWidth = bubbleMaxWidth - bubblePadX * 2;
      const lines = wrapTextForWidth(ctx, text, usableWidth);

      // measure longest line
      let maxLineW = 0;
      for (const ln of lines) {
        const w = ctx.measureText(ln).width;
        if (w > maxLineW) maxLineW = w;
      }

      // include sender width if exists
      if (sender) {
        ctx.font = `${senderFontSize}px ${baseFont}`;
        const sw = ctx.measureText(sender).width;
        if (sw + 8 > maxLineW) maxLineW = sw + 8;
      }

      // compute bubble width dynamically (min padding + measured width)
      const bubbleContentWidth = Math.min(bubbleMaxWidth - bubblePadX * 2, Math.ceil(maxLineW));
      const bubbleWidth = bubbleContentWidth + bubblePadX * 2;

      // compute bubble height
      const lineHeight = Math.round(msgFontSize * 1.35);
      const textHeight = lines.length * lineHeight;
      const senderH = sender ? senderFontSize * 1.25 : 0;
      const reactionsH = reactions.length ? Math.round(reactionFontSize * 1.6) : 0;
      const bubbleHeight = bubblePadY + senderH + textHeight + bubblePadY + reactionsH + 18;

      // draw bubble background (rounded rect)
      const bubbleY = topOffset;
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

      // bubble color: dark translucent to mimic iPhone dark mode
      drawRoundedRect(bubbleX, bubbleY, bubbleWidth, bubbleHeight, bubbleRadius, "rgba(18,20,24,0.9)");

      // draw sender
      let cursorY = bubbleY + bubblePadY;
      if (sender) {
        ctx.font = `${senderFontSize}px ${baseFont}`;
        ctx.fillStyle = "rgba(255,255,255,0.78)";
        ctx.fillText(sender, bubbleX + bubblePadX, cursorY + senderFontSize);
        cursorY += senderH;
      }

      // draw message lines
      ctx.font = `${msgFontSize}px ${baseFont}`;
      ctx.fillStyle = "#ffffff";
      for (let i = 0; i < lines.length; i++) {
        ctx.fillText(lines[i], bubbleX + bubblePadX, cursorY + msgFontSize + i * lineHeight - (sender ? 4 : 0));
      }
      cursorY += textHeight + 6;

      // draw reactions (if any) as small rounded pill above bubble (aligned left)
      if (reactions.length) {
        const rx = bubbleX + bubblePadX;
        const ry = cursorY + 6;
        // measure total width
        ctx.font = `${reactionFontSize}px ${baseFont}`;
        let totalReactW = 0;
        const gaps = 8;
        const reactWidths = reactions.map(r => {
          const w = ctx.measureText(r).width;
          totalReactW += w + gaps;
          return w;
        });
        totalReactW = Math.max(totalReactW, reactionFontSize); // minimal
        const pillW = totalReactW + 12;
        const pillH = Math.round(reactionFontSize * 1.6);
        const pillRadius = Math.round(pillH / 2);
        // draw pill bg
        drawRoundedRect(rx - 6, ry - pillH + 4, pillW + 12, pillH, pillRadius, "rgba(255,255,255,0.06)");
        // draw each emoji
        let rxCursor = rx;
        for (let i = 0; i < reactions.length; i++) {
          ctx.fillText(reactions[i], rxCursor, ry + reactionFontSize / 2);
          rxCursor += reactWidths[i] + gaps;
        }
        cursorY += pillH + 8;
      }

      // draw time inside the bubble bottom-right
      ctx.font = `${timeFontSize}px ${baseFont}`;
      ctx.fillStyle = "rgba(255,255,255,0.55)";
      const timeW = ctx.measureText(time).width;
      const timeX = bubbleX + bubbleWidth - bubblePadX - timeW;
      const timeY = bubbleY + bubbleHeight - bubblePadY / 2;
      ctx.fillText(time, timeX, timeY);

      // OPTIONAL: draw small context menu mock above bubble-right (like screenshot),
      // but keep it subtle: a column of semi-transparent rounded rects.
      const menuX = bubbleX + bubbleWidth + 18;
      const menuY = bubbleY - 8;
      const menuW = Math.round(width * 0.22);
      const menuItemH = Math.round(msgFontSize * 1.3);
      // draw 6 menu items
      for (let i = 0; i < 6; i++) {
        drawRoundedRect(menuX, menuY + i * (menuItemH + 6), menuW, menuItemH, 8, "rgba(255,255,255,0.03)");
      }
      // draw red Delete box at bottom
      drawRoundedRect(menuX, menuY + 6 * (menuItemH + 6), menuW, menuItemH, 8, "rgba(255,50,50,0.12)");
      ctx.font = `${Math.round(msgFontSize * 0.85)}px ${baseFont}`;
      ctx.fillStyle = "rgba(255,255,255,0.6)";
      ctx.fillText("Hapus", menuX + 12, menuY + 6 * (menuItemH + 6) + menuItemH * 0.75);

      // final output
      const buffer = canvas.toBuffer("image/png");
      res.setHeader("Content-Type", "image/png");
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      return res.end(buffer);
    } catch (err) {
      console.error("IQC generation error:", err);
      return res.status(500).json({ status: false, error: "Gagal generate image", detail: err.message });
    }
  }
};
