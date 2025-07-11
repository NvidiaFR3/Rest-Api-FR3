const fetch = require("node-fetch");

module.exports = {
  name: "Clear All Server Panel",
  desc: "Remove ALL servers from the panel",
  category: "Pterodactyl",
  path: "/pterodactyl/clearallserver?domain=&plta=",

  async run(req, res) {
    const { domain, plta } = req.query;

    if (!domain || !plta) {
      return res.json({ status: false, error: "Wajib isi: domain dan plta" });
    }

    const headers = {
      "Authorization": `Bearer ${plta}`,
      "Accept": "Application/vnd.pterodactyl.v1+json"
    };

    try {
      const getServers = await fetch(`${domain}/api/application/servers?per_page=10000`, { headers });
      const srvData = await getServers.json();
      const servers = srvData.data || [];

      let deleted = 0;

      for (const srv of servers) {
        const del = await fetch(`${domain}/api/application/servers/${srv.attributes.id}`, {
          method: "DELETE",
          headers
        });

        if (del.ok) deleted++;
      }

      res.json({
        status: true,
        message: "Semua server berhasil dihapus",
        total_deleted: deleted
      });

    } catch (err) {
      res.status(500).json({ status: false, error: err.message });
    }
  }
};
