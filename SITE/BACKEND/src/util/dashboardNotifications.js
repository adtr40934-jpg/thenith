const clients = new Map(); // userId -> Set of response objects

async function addClient(userId, res) {
  if (!clients.has(userId)) {
    clients.set(userId, new Set());
  }
  clients.get(userId).add(res);
}

async function removeClient(userId, res) {
  if (clients.has(userId)) {
    const userClients = clients.get(userId);
    userClients.delete(res);
    if (userClients.size === 0) {
      clients.delete(userId);
    }
  }
}

async function notifyUser(userId, data) {
  if (clients.has(userId)) {
    const userClients = clients.get(userId);
    const message = `data: ${JSON.stringify(data)}\n\n`;
    for (const client of userClients) {
      client.write(message);
    }
  }
}


export default {
  clients,
  addClient,
  removeClient,
  notifyUser
};
