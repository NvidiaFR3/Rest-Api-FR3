// api/premium-send-otp.js
// Requirements:
// npm i twilio express-rate-limit
// .env must contain: APIKEY (array JSON or comma), TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_VERIFY_SID

const Twilio = require('twilio');
const rateLimit = require('express-rate-limit');

const client = Twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

// simple in-memory store for per-number rate limiting (replace with Redis in production)
const numberAttempts = new Map();
const MAX_PER_HOUR = 5; // max OTP sends per number per hour

module.exports = {
  name: "Send OTP (Premium)",
  desc: "Kirim OTP sekali untuk verifikasi (dengan proteksi). Harus ada consent dari penerima.",
  category: "Premium",
  path: "/premium/send-otp?apikey=&phone=&channel=",
  async run(req, res) {
    try {
      const { apikey, phone, channel = 'sms' } = req.query;

      // APIKEY check (global.apikey loaded in index.js)
      if (!apikey || !global.apikey.includes(apikey)) {
        return res.json({
          status: false,
          error: "Silahkan Beli Apikey Ke https://t.me/fr3newera Ya, Harga Terjangkau."
        });
      }

      // basic validation
      if (!phone) return res.json({ status: false, error: "Parameter 'phone' wajib diisi" });

      // Important: require explicit consent param in body/query for safety (example)
      // In production, you should check a prior opt-in flag in DB for that phone number.
      // Here we just illustrate: require ?consent=yes
      if (req.query.consent !== 'yes') {
        return res.json({
          status: false,
          error: "Penerima harus memberikan izin (consent). Tambahkan param ?consent=yes"
        });
      }

      // rate limiting per phone (in-memory)
      const now = Date.now();
      const windowMs = 60 * 60 * 1000; // 1 hour
      const entry = numberAttempts.get(phone) || { count: 0, start: now };
      if (now - entry.start > windowMs) {
        entry.count = 0;
        entry.start = now;
      }
      if (entry.count >= MAX_PER_HOUR) {
        return res.json({ status: false, error: "Limit pengiriman OTP untuk nomor ini sudah tercapai (rate limit)." });
      }

      // send OTP via Twilio Verify
      const verifyServiceSid = process.env.TWILIO_VERIFY_SID;
      if (!verifyServiceSid) {
        return res.status(500).json({ status: false, error: "TWILIO_VERIFY_SID belum diset di .env" });
      }

      // allowed channels: sms or whatsapp (if Twilio Verify supports)
      const channelAllowed = channel === 'whatsapp' ? 'whatsapp' : 'sms';

      const sendResp = await client.verify.services(verifyServiceSid)
        .verifications
        .create({ to: phone, channel: channelAllowed });

      // update rate limit counter
      entry.count += 1;
      numberAttempts.set(phone, entry);

      return res.json({
        status: true,
        message: "OTP dikirim (jika nomor valid).",
        sid: sendResp.sid,
        to: sendResp.to,
        channel: sendResp.channel
      });

    } catch (err) {
      console.error("send-otp error:", err);
      return res.status(500).json({ status: false, error: "Gagal mengirim OTP", detail: err.message });
    }
  }
};
