// feature-iqc-iphone-quote.js
const { createCanvas, loadImage, registerFont } = require('canvas');
const fetch = require('node-fetch');
const path = require('path');
const fs = require('fs');

// Optional: register a nicer font if available in your server
// registerFont(path.join(__dirname, 'fonts', 'SF-Pro-Text-Regular.ttf'), { family: 'SFPro' });

function wrapText(ctx, text, maxWidth) {
  const words = text.split(' ');
  const lines = [];
  let line = '';
  for (let n = 0; n < words.length; n++) {
    const testLine = line ? line + ' ' + words[n] : words[n];
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && line) {
      lines.push(line);
      line = words[n];
    } else {
      line = testLine;
    }
  }
  if (line) lines.push(line);
  return lines;
}

async function fetchImageSafe(url) {
  try {
    const res = await fetch(url, { timeout: 15000 });
    if (!res.ok) return null;
    const buf = await res.buffer();
    return await loadImage(buf);
  } catch (e) {
    return null;
  }
}

module.exports = {
  name: "IQC iPhone Quote",
  desc: "Generate iPhone style quote image from text",
  category: "Imagecreator",
  path: "/imagecreator/iqc?text=&sender=&time=&reactions=&bg=&width=&height=",

  async run(req, res) {
    try {
      const text = (req.query.text || '').trim();
      if (!text) return res.status(400).json({ status: false, error: "Parameter 'text' is required" });

      const sender = req.query.sender || '';
      const time = req.query.time || (new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }));
      const reactions = (req.query.reactions || '').split(',').map(r => r.trim()).filter(Boolean);
      const width = parseInt(req.query.width) || 1240;
      const height = parseInt(req.query.height) || 2680;
      const bgUrl = req.query.bg || null;

      // Canvas setup
      const canvas = createCanvas(width, height);
      const ctx = canvas.getContext('2d');

      // Background: dark blur + optional image
      ctx.fillStyle = '#0f1720'; // fallback dark
      ctx.fillRect(0, 0, width, height);

      if (bgUrl) {
        const bgImg = await fetchImageSafe(bgUrl);
        if (bgImg) {
          // draw blurred scaled background
          // draw at lower opacity and scale to cover
          ctx.globalAlpha = 0.18;
          const scale = Math.max(width / bgImg.width, height / bgImg.height);
          const bw = bgImg.width * scale;
          const bh = bgImg.height * scale;
          ctx.drawImage(bgImg, (width - bw) / 2, (height - bh) / 2, bw, bh);
          ctx.globalAlpha = 1.0;
        }
      }

      // Top bar mimic (time, signal) - subtle
      ctx.fillStyle = 'rgba(255,255,255,0.03)';
      ctx.fillRect(0, 0, width, 110);

      // Message bubble area
      const marginX = Math.round(width * 0.08);
      const bubbleMaxW = Math.round(width * 0.62);
      const bubbleX = marginX;
      const bubbleY = 420;
      const bubblePadX = 48;
      const bubblePadY = 38;

      // Bubble styling (dark iPhone incoming bubble)
      const bubbleRadius = 28;
      // Prepare text font
      const fontFamily = 'Arial';
      const fontSize = Math.round(width * 0.045); // responsive
      ctx.font = `${fontSize}px ${fontFamily}`;
      ctx.fillStyle = '#ffffff';

      // Wrap text to fit bubble width
      const lines = wrapText(ctx, text, bubbleMaxW - bubblePadX * 2);

      // Bubble height based on text lines and optional sender/time rows
      const lineHeight = Math.round(fontSize * 1.35);
      let bubbleHeight = lineHeight * lines.length + bubblePadY * 2;

      // Add space for reactions row if present
      const reactionRowH = reactions.length ? 60 : 0;
      bubbleHeight += reactionRowH;

      // Draw bubble (rounded rect)
      const drawRoundedRect = (x, y, w, h, r, fillStyle) => {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.arcTo(x + w, y, x + w, y + h, r);
        ctx.arcTo(x + w, y + h, x, y + h, r);
        ctx.arcTo(x, y + h, x, y, r);
        ctx.arcTo(x, y, x + w, y, r);
        ctx.closePath();
        ctx.fillStyle = fillStyle;
        ctx.fill();
      };

      // Slight translucent black bubble to mimic iPhone dark bubble
      drawRoundedRect(bubbleX, bubbleY, bubbleMaxW, bubbleHeight, bubbleRadius, 'rgba(14,18,23,0.85)');

      // Draw sender (if any)
      const senderFontSize = Math.round(fontSize * 0.7);
      if (sender) {
        ctx.font = `${senderFontSize}px ${fontFamily}`;
        ctx.fillStyle = 'rgba(255,255,255,0.75)';
        ctx.fillText(sender, bubbleX + bubblePadX, bubbleY + senderFontSize + 8);
      }

      // Draw message text
      ctx.font = `${fontSize}px ${fontFamily}`;
      ctx.fillStyle = '#ffffff';
      const textStartY = bubbleY + bubblePadY + (sender ? senderFontSize + 12 : 0);
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        ctx.fillText(line, bubbleX + bubblePadX, textStartY + i * lineHeight);
      }

      // Draw time small at bottom-right of bubble
      const timeFontSize = Math.round(fontSize * 0.6);
      ctx.font = `${timeFontSize}px ${fontFamily}`;
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      const timeW = ctx.measureText(time).width;
      ctx.fillText(time, bubbleX + bubbleMaxW - bubblePadX - timeW, bubbleY + bubbleHeight - bubblePadY / 2);

      // Draw reactions above bubble left side if present
      if (reactions.length) {
        const rx = bubbleX + bubblePadX;
        const ry = bubbleY - 58;
        const reactSize = 44;
        // small rounded rect background
        const totalW = reactions.length * (reactSize + 8);
        drawRoundedRect(rx - 8, ry - 8, totalW + 16, reactSize + 16, 20, 'rgba(255,255,255,0.06)');
        // draw emojis as text
        ctx.font = `${reactSize}px ${fontFamily}`;
        for (let i = 0; i < reactions.length; i++) {
          const e = reactions[i];
          ctx.fillText(e, rx + i * (reactSize + 8), ry + reactSize - 6);
        }
      }

      // Draw three-dot context menu mimic at top-left of bubble
      ctx.fillStyle = 'rgba(255,255,255,0.06)';
      ctx.fillRect(bubbleX - 12, bubbleY - 220, 280, 200);

      // Optionally draw a subtle blurred overlay (not real blur here)
      // Final: output PNG
      const buf = canvas.toBuffer('image/png');

      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      return res.end(buf);
    } catch (err) {
      console.error('IQC error:', err);
      return res.status(500).json({ status: false, error: 'Gagal generate image', detail: err.message });
    }
  }
};
