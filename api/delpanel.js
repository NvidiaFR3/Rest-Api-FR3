const fetch = require("node-fetch");

module.exports = {
  name: "Delete Panel Pterodactyl",
  desc: "Deleting servers and users from Pterodactyl based on username",
  category: "Pterodactyl",
  path: "/pterodactyl/delpanel?domain=&plta=&username=",

  async run(req, res) {
    const { domain, plta, username } = req.query;

    if (!domain || !plta || !username) {
      return res.json({ status: false, error: "Wajib isi: domain, plta, username" });
    }

    const headers = {
      "Authorization": `Bearer ${plta}`,
      "Accept": "Application/vnd.pterodactyl.v1+json"
    };

    try {
      // Cari user berdasarkan username
      const getUsers = await fetch(`${domain}/api/application/users`, { headers });
      const userList = await getUsers.json();

      const user = userList.data.find(u => u.attributes.username === username);
      if (!user) return res.json({ status: false, error: "User tidak ditemukan" });

      const userId = user.attributes.id;

      // Ambil semua server milik user
      const getServers = await fetch(`${domain}/api/application/users/${userId}/servers`, { headers });
      const serverList = await getServers.json();

      // Hapus semua server milik user
      const deletedServers = [];
      for (const s of serverList.data) {
        const serverId = s.attributes.id;
        const delServer = await fetch(`${domain}/api/application/servers/${serverId}/force`, {
          method: "DELETE",
          headers
        });
        deletedServers.push({ id: serverId, success: delServer.status === 204 });
      }

      // Hapus user
      const delUser = await fetch(`${domain}/api/application/users/${userId}`, {
        method: "DELETE",
        headers
      });

      const userDeleted = delUser.status === 204;

      res.json({
        status: true,
        message: "User dan semua server telah dihapus",
        deletedServers,
        userDeleted
      });

    } catch (err) {
      res.status(500).json({ status: false, error: err.message });
    }
  }
};