const axios = require('axios');

// Shared utility functions
function generatePassword(length = 12) {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

// Pterodactyl Create Module
const pterodactylCreate = {
  name: "pterodactyl create",
  desc: "Buat user & server otomatis",
  category: "Pterodactyl",
  path: "/ptero/create?domain=&plta=&nameserver=&disk=&cpu=",

  async run(req, res) {
    const { domain, plta, nameserver, disk, cpu } = req.query;

    if (!domain || !plta || !nameserver || !disk || !cpu) {
      return res.status(400).json({
        status: false,
        error: "Missing required parameters: domain, plta, nameserver, disk, cpu"
      });
    }

    if (isNaN(disk) || isNaN(cpu)) {
      return res.status(400).json({
        status: false,
        error: "Disk and CPU must be numeric"
      });
    }

    const headers = {
      'Authorization': `Bearer ${plta}`,
      'Content-Type': 'application/json',
      'Accept': 'Application/vnd.pterodactyl.v1+json'
    };

    const username = nameserver.toLowerCase().replace(/[^a-z0-9]/g, '') + Math.floor(Math.random() * 1000);
    const email = `${username}@mail.com`;
    const password = generatePassword();

    try {
      const eggUrl = `${domain}/api/application/nests/5/eggs/15`;
      const eggData = (await axios.get(eggUrl, { headers })).data.attributes;
      const environment = {};

      eggData.variables.forEach(v => {
        environment[v.env_variable] = v.env_variable === "CMD_RUN"
          ? "npm start"
          : v.default_value || "";
      });

      const user = (await axios.post(`${domain}/api/application/users`, {
        email, username, first_name: 'Auto', last_name: 'User', password
      }, { headers })).data.attributes;

      const server = (await axios.post(`${domain}/api/application/servers`, {
        name: nameserver,
        user: user.id,
        egg: 15,
        docker_image: "ghcr.io/parkervcp/yolks:nodejs_18",
        startup: eggData.startup,
        environment,
        limits: {
          memory: parseInt(disk),
          swap: 0,
          disk: parseInt(disk),
          io: 500,
          cpu: parseInt(cpu)
        },
        feature_limits: { databases: 1, allocations: 1, backups: 1 },
        deploy: { locations: [1], dedicated_ip: false, port_range: [] },
        start_on_completion: true
      }, { headers })).data.attributes;

      res.json({
        status: true,
        data: {
          id_user: user.id,
          id_server: server.id,
          nama_server: nameserver,
          domain_panel: domain,
          username: user.username,
          password,
          login_url: `${domain}/auth/login`
        }
      });

    } catch (err) {
      res.status(500).json({
        status: false,
        error: 'Failed to create server or user',
        details: err.response?.data || err.message
      });
    }
  }
};

// Pterodactyl Delete Module
const pterodactylDelete = {
  name: "pterodactyl delete",
  desc: "Hapus server & user dari panel",
  category: "Pterodactyl",
  path: "/ptero/delete",

  async run(req, res) {
    const { domain, PTLC, id } = req.query;
    if (!domain || !PTLC || !id) {
      return res.status(400).json({
        status: false,
        error: "Missing required parameters: domain, PTLC, id"
      });
    }

    const headers = {
      'Authorization': `Bearer ${PTLC}`,
      'Accept': 'Application/vnd.pterodactyl.v1+json',
      'Content-Type': 'application/json'
    };

    try {
      const serverInfo = (await axios.get(`${domain}/api/application/servers/${id}`, { headers })).data.attributes;
      await axios.delete(`${domain}/api/application/servers/${id}`, { headers });
      await axios.delete(`${domain}/api/application/users/${serverInfo.user}`, { headers });

      res.json({
        status: true,
        message: "Server dan user berhasil dihapus",
        data: {
          server_id: id,
          server_name: serverInfo.name,
          user_id: serverInfo.user
        }
      });
    } catch (err) {
      res.status(err.response?.status || 500).json({
        status: false,
        error: err.message,
        details: err.response?.data?.errors || "Gagal menghapus server/user"
      });
    }
  }
};

// Pterodactyl List Module (example)
const pterodactylList = {
  name: "pterodactyl list",
  desc: "List servers from panel",
  category: "Pterodactyl",
  path: "/ptero/list",

  async run(req, res) {
    const { domain, PTLC } = req.query;
    if (!domain || !PTLC) {
      return res.status(400).json({
        status: false,
        error: "Missing required parameters: domain, PTLC"
      });
    }

    const headers = {
      'Authorization': `Bearer ${PTLC}`,
      'Accept': 'Application/vnd.pterodactyl.v1+json'
    };

    try {
      const response = await axios.get(`${domain}/api/application/servers`, { headers });
      res.json({
        status: true,
        data: response.data.data
      });
    } catch (err) {
      res.status(err.response?.status || 500).json({
        status: false,
        error: err.message,
        details: err.response?.data?.errors || "Gagal mendapatkan list server"
      });
    }
  }
};

// Export all modules
module.exports = [
  pterodactylCreate,
  pterodactylDelete,
  pterodactylList
];
