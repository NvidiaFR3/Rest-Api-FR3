
const fetch = require('node-fetch');

const yt = {
    headers: {
        "referer": "https://ytmp3.cc",
        "origin": "https://ytmp3.cc"
    },

    hit: async (url, deskripsi, returnType = "text", opts) => {
        try {
            const respond = await fetch(url, opts)
            if (!respond.ok) throw Error(`${deskripsi} is not ok ${respond.status} ${respond.statusText}\n${await respond.text() || null}`)
            let result = null
            try {
                if (returnType == "json") {
                    result = await respond.json()
                } else {
                    result = await respond.text()
                }
            } catch (err) {
                throw Error(`gagal mengubah respond menjadi ${returnType}\n${deskripsi}\n${err.message}`)
            }
            return result
        } catch (err) {
            throw Error(`fetch gagal di ${deskripsi}\n${err.message}`)
        }
    },

    getAuth: async () => {
        const webUrl = yt.headers.origin
        const homepage = await yt.hit(webUrl, "hit webpage", "text", { headers: yt.headers })
        const kodeJavascript1 = homepage?.match(/<script>(.+?)<\/script>/ms)?.[1]
        if (!kodeJavascript1) throw Error(`tidak menemukan match kodeJavascript1`)
        try { eval(kodeJavascript1) } catch (err) { throw Error(`eval gagal saat eksekusi kodejavascript1\n${err.message}`) }
        const m_jsUrl = homepage.matchAll(/<script src="(.+?)"/g)
        const jsUrls = Array.from(m_jsUrl).map(v => webUrl + v?.[1])
        const jsFetchs = jsUrls.map((v, i) => yt.hit(v, `hit js ${(i + 1)}`))
        const jsFiles = await Promise.all(jsFetchs)
        try { eval(jsFiles[0]) } catch (err) { throw Error(`eval gagal saat eksekusi js file 1\n${err.message}`) }
        const kodeAuth = jsFiles?.[1]?.match(/function authorization\(\)(.+?)\}\}/g)?.[0]
        if (!kodeAuth) throw Error(`tidak menemukan match auth function`)

        let url_key, url_value, header_auth
        try {
            var decodeBin = (e) => e.split(" ").map(v => parseInt(v, 2))
            var decodeHex = (e) => e.match(/0x[a-fA-F0-9]{2}/g).map(v => String.fromCharCode(v)).join("")
            header_auth = decodeHex(sH)
            url_key = decodeHex(sP)
            url_value = eval(`${kodeAuth}; authorization()`)
        } catch (error) {
            throw Error(`eval gagal saat eksekusi js file 2\n${error.message}`)
        }

        return { header_auth, url_key, url_value }
    },

    download: async (youtubeUrl, format = "mp3") => {
        const validFormats = ["mp3", "mp4"]
        if (!validFormats.includes(format)) throw Error(`${format} is invalid format. available format ${validFormats.join(", ")}`)

        const delay = async (ms) => new Promise(r => setTimeout(r, ms))

        const { videoId, url } = await yt.getYoutubeId(youtubeUrl)
        const { header_auth, url_key, url_value } = await yt.getAuth()

        const url1 = `https://d.ecoe.cc/api/v1/init?${url_key}=${url_value}&_=${Math.random()}`
        const headers = {
            "x-auth-key": header_auth,
            ...yt.headers
        }
        const init = await yt.hit(url1, "init api", "json", { headers })
        if (init.error != "0") throw Error(`ada error di init api.`)

        const url2 = new URL(init.convertURL)
        url2.searchParams.append("v", videoId)
        url2.searchParams.append("f", format)
        url2.searchParams.append("_", Math.random())
        const resultConvert = await yt.hit(url2, "hit convert", "json", { headers: yt.headers })
        let { downloadURL, progressURL, redirectURL, error: errorFromConvertUrl } = resultConvert
        if (errorFromConvertUrl) throw Error(`error code ${errorFromConvertUrl}`)

        if (redirectURL) {
            ({ downloadURL, progressURL } = (await yt.hit(redirectURL, "fetch redirectURL", "json")))
        }

        let { error, progress, title } = {}
        while (progress != 3) {
            const api3 = new URL(progressURL)
            api3.searchParams.append("_", Math.random());
            ({ error, progress, title } = (await yt.hit(api3, "cek progressURL", "json")))
            if (error) throw Error(`progress error code ${error}`)
            if (progress != 3) await delay(5000)
        }

        return { title, downloadURL, url }
    },

    getYoutubeId: async (youtubeUrl) => {
        const headers = {
            "user-agent": "Mozilla/5.0"
        }
        const resp = await fetch(youtubeUrl, {
            "method": "HEAD",
            headers
        })
        if (!resp.ok) throw Error(`gagal mendapatkan id video ${resp.status} ${resp.statusText}`)
        let videoId = new URL(resp.url)?.searchParams?.get("v")
        if (!videoId) {
            videoId = resp.url.match(/https:\/\/www.youtube.com\/shorts\/(.*?)(?:\?|$)/)?.[1]
            if (!videoId) throw Error(`invalid YouTube link`)
        }
        return { videoId, url: resp.url }
    },
}


module.exports = [
  {
    name: "Ytmp4 V2",
    desc: "Download video youtube v2",
    category: "Downloader",
    path: "/download/ytmp4v2?url=",
    async run(req, res) {
      try {
        const { url } = req.query;
        if (!url)
          return res.json({ status: false, error: "Url is required" });

        const results = await yt.download(url, "mp4")
        res.status(200).json({
          status: true,
          result: results,
        });
      } catch (error) {
        res.status(500).json({ status: false, error: error.message });
      }
    },
  },

  {
    name: "Ytmp3 V2",
    desc: "Download audio youtube v2",
    category: "Downloader",
    path: "/download/ytmp3v2?url=",
    async run(req, res) {
      try {
        const { url } = req.query;
        if (!url)
          return res.json({ status: false, error: "Url is required" });

        const results = await yt.download(url)
        res.status(200).json({
          status: true,
          result: results,
        });
      } catch (error) {
        res.status(500).json({ status: false, error: error.message });
      }
    },
  },
];
            
