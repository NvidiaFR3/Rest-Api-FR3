module.exports = {
  name: "Post Code",
  desc: "Tampilkan kode dengan style mirip terminal",
  category: "Tools",
  path: "/tools/postcode?title=&code=",

  async run(req, res) {
    const { title, code } = req.query;
    if (!title || !code) {
      return res.json({ status: false, error: "Missing title or code" });
    }

    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <style>
        body {
          background: #1e1e1e;
          color: #f8f8f2;
          font-family: 'Fira Code', monospace;
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
          margin: 0;
        }
        .code-box {
          background: #2d2d2d;
          border-radius: 8px;
          padding: 20px;
          width: 90%;
          max-width: 800px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        }
        .title-bar {
          background: #333;
          padding: 8px 16px;
          font-size: 14px;
          color: #eee;
          border-radius: 8px 8px 0 0;
        }
        pre {
          margin: 0;
          padding: 16px;
          overflow-x: auto;
          color: #f8f8f2;
          font-size: 14px;
        }
        /* Highlight warna */
        .keyword { color: #ff79c6; }
        .string { color: #f1fa8c; }
        .number { color: #bd93f9; }
      </style>
    </head>
    <body>
      <div class="code-box">
        <div class="title-bar">${title}</div>
        <pre><code>${code.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</code></pre>
      </div>
    </body>
    </html>`;

    res.setHeader("Content-Type", "text/html");
    res.send(html);
  }
};
