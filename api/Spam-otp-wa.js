// api/send-pairing-wa.js
// Real WhatsApp Pairing Code Sender (uses WhatsApp Business Cloud API)
// SAFETY: requires consent=yes, checks global.apikey, per-number rate limit, global rate limiting.
// USAGE example:
// GET /premium/send-pairing-wa?apikey=FR31&nomor=+62812xxxxx&jumlah=2&consent=yes&wa_phone_id=12345&wa_token=EAA...

const axios = require('axios');

// In-memory stores (replace with persistent store like Redis in production)
const perNumberStore = new Map(); // phone => { count, windowStart }
const sendQueue = []; // jobs: { phone, message, wa_phone_id, wa_token, resolve, reject, meta }

const MAX_PER_HOUR = 1;       // max messages per phone per hour (hard)
const MAX_PER_JOB = 10;        // max messages a single request may send
const MAX_QUEUE = 20000;      // queue cap
const MAX_RATE_CAP = 10;       // hard cap global messages per second
const DEFAULT_RATE_PER_SEC = 1;
const RATE_PER_SEC = Math.min(DEFAULT_RATE_PER_SEC, MAX_RATE_CAP);

// worker
let workerRunning = false;
function startWorker() {
  if (workerRunning) return;
  workerRunning = true;
  const intervalMs = Math.round(1000 / RATE_PER_SEC);
  setInterval(async () => {
    if (sendQueue.length === 0) return;
    const job = sendQueue.shift();
    if (!job) return;

    try {
      // Build WhatsApp Cloud API request
      // endpoint: POST https://graph.facebook.com/v17.0/<PHONE_NUMBER_ID>/messages
      const url = `https://graph.facebook.com/v17.0/${job.wa_phone_id}/messages`;
      const headers = {
        Authorization: `Bearer ${job.wa_token}`,
        'Content-Type': 'application/json'
      };

      // Send request
      const resp = await axios.post(url, job.payload, { headers, timeout: 15000 });
      // resolve promise if provided
      if (job.resolve) job.resolve({ ok: true, data: resp.data });
      console.log(`[WA SENT] to=${job.phone} id=${resp.data?.messages?.[0]?.id || 'unknown'}`);
    } catch (err) {
      if (job.reject) job.reject(err);
      console.error(`[WA FAILED] to=${job.phone} err=${err.message}`);
    }
  }, intervalMs);
}

// helper: generate 6-digit pairing code
function genCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

// helper: validate phone basic
function normalizePhone(p) {
  // naive normalization; expect +country... or numeric
  if (!p) return null;
  return p.replace(/\s+/g, '');
}

module.exports = {
  name: "Send Pairing WA",
  desc: "Kirim pairing code via WhatsApp Business Cloud API. SAFETY: consent required, rate-limited.",
  category: "Premium",
  path: "/premium/send-pairing-wa?apikey=&nomor=&jumlah=&consent=&wa_phone_id=&wa_token=",

  async run(req, res) {
    try {
      const { apikey } = req.query;
      let { nomor, jumlah } = req.query;
      const consent = (req.query.consent || '').toLowerCase();
      // credentials: either pass in query OR set process.env.WA_PHONE_ID & WA_TOKEN
      const wa_phone_id = req.query.wa_phone_id || process.env.WA_PHONE_ID || '';
      const wa_token = req.query.wa_token || process.env.WA_TOKEN || '';

      // basic auth
      if (!apikey || !global.apikey || !global.apikey.includes(apikey)) {
        return res.json({
          status: false,
          error: "Silahkan Beli Apikey Ke https://t.me/fr3newera Ya, Harga Terjangkau."
        });
      }

      if (!nomor) return res.json({ status: false, error: "Parameter 'nomor' wajib diisi" });
      nomor = normalizePhone(nomor);
      if (!nomor) return res.json({ status: false, error: "Nomor tidak valid" });

      jumlah = parseInt(jumlah || "1", 10);
      if (!Number.isFinite(jumlah) || jumlah <= 0) jumlah = 1;

      if (jumlah > MAX_PER_JOB) {
        return res.json({ status: false, error: `Jumlah dibatasi maksimum ${MAX_PER_JOB} per request` });
      }

      if (consent !== 'yes') {
        return res.json({
          status: false,
          error: "Penerima harus memberikan izin (consent). Tambahkan param ?consent=yes"
        });
      }

      if (!wa_phone_id || !wa_token) {
        return res.json({ status: false, error: "WhatsApp credentials (wa_phone_id & wa_token) wajib disertakan sebagai query atau di .env" });
      }

      // check per-number hourly limit
      const now = Date.now();
      const hourMs = 60 * 60 * 1000;
      const entry = perNumberStore.get(nomor) || { count: 0, windowStart: now };
      if (now - entry.windowStart > hourMs) {
        entry.count = 0;
        entry.windowStart = now;
      }
      if ((entry.count + jumlah) > MAX_PER_HOUR) {
        return res.json({
          status: false,
          error: `Limit pengiriman untuk nomor ini tercapai. Maks ${MAX_PER_HOUR} pesan per jam. Sudah terkirim: ${entry.count}`
        });
      }

      // queue size guard
      if (sendQueue.length + jumlah > MAX_QUEUE) {
        return res.status(503).json({ status: false, error: "Server sibuk. Coba lagi nanti." });
      }

      // generate codes and enqueue messages
      const codes = [];
      const enqueueResults = [];
      for (let i = 0; i < jumlah; i++) {
        const code = genCode();
        codes.push(code);

        // Build message payload for WhatsApp Cloud API (text message). You can change to template if needed.
        const payload = {
          messaging_product: "whatsapp",
          to: nomor,
          type: "text",
          text: {
            body: `Pairing Code: ${code}\nKode ini berlaku selama 5 menit. Jika Anda tidak meminta, abaikan pesan ini.`
          }
        };

        // Create job promise to optionally observe result later
        const jobPromise = new Promise((resolve, reject) => {
          sendQueue.push({
            phone: nomor,
            payload,
            wa_phone_id,
            wa_token,
            enqueueAt: Date.now(),
            resolve,
            reject,
            meta: { code }
          });
        });
        enqueueResults.push(jobPromise);
      }

      // update per-number counter (reserve)
      entry.count += jumlah;
      perNumberStore.set(nomor, entry);

      // start worker if not running
      startWorker();

      // respond immediately with info + codes (for testing only)
      // NOTE: returning codes reveals actual codes; keep this for testing servers only.
      res.json({
        status: true,
        message: `Pairing code(s) queued for sending to ${nomor}`,
        queued: jumlah,
        codes, // remove or mask in production to avoid leaking codes
        note: `Worker processes ~${RATE_PER_SEC} messages/sec (cap ${MAX_RATE_CAP}). Per-number hourly cap: ${MAX_PER_HOUR}.`
      });

      // optionally handle job results (we don't block response)
      Promise.allSettled(enqueueResults).then(results => {
        const successes = results.filter(r => r.status === 'fulfilled').length;
        const fails = results.filter(r => r.status === 'rejected').length;
        console.log(`[PAIRING RESULT] to=${nomor} queued=${jumlah} success=${successes} fail=${fails}`);
      });

    } catch (err) {
      console.error("send-pairing-wa error:", err);
      return res.status(500).json({ status: false, error: err.message });
    }
  }
};
