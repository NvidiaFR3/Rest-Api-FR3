module.exports = {
  name: "Post Code Image",
  desc: "Render kode menjadi gambar seperti UI terminal",
  category: "Tools",
  path: "/tools/postcodeimg?title=&code=",
  async run(req, res) {
    const { title, code } = req.query;
    if (!title || !code) {
      return res.json({ status: false, error: "Missing title or code" });
    }

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body {
          background: #1e1e1e;
          font-family: 'Fira Code', monospace;
          margin: 0; padding: 0;
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
        }
        .window {
          background: #2d2d2d;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 6px 20px rgba(0,0,0,0.3);
          width: 700px;
        }
        .title-bar {
          background: #333;
          color: #f8f8f2;
          padding: 10px 16px;
          font-size: 14px;
        }
        pre {
          color: #f8f8f2;
          padding: 20px;
          font-size: 16px;
          white-space: pre-wrap;
        }
        .keyword { color: #ff79c6; }
        .string { color: #f1fa8c; }
        .number { color: #bd93f9; }
      </style>
    </head>
    <body>
      <div class="window">
        <div class="title-bar">${title}</div>
        <pre><code>${code.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</code></pre>
      </div>
    </body>
    </html>`;

    const imageBuffer = await nodeHtmlToImage({
      html: html,
      quality: 100,
      type: 'png',
      encoding: 'binary'
    });

    res.writeHead(200, {
      'Content-Type': 'image/png',
      'Content-Length': imageBuffer.length
    });
    res.end(imageBuffer);
  }
};
