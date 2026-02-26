// Matchmaker - handles user queue and pairing

class Matchmaker {
  constructor() {
    this.waitingQueue = []; // { socketId, userInfo }
    this.pairs = new Map(); // socketId -> partnerSocketId
    this.userMeta = new Map(); // socketId -> userInfo
  }

  // Add user to waiting queue
  addToQueue(socketId, userInfo) {
    const inQueue = this.waitingQueue.some(entry => entry.socketId === socketId);
    if (!inQueue && !this.pairs.has(socketId)) {
      this.waitingQueue.push({ socketId, userInfo: userInfo || null });
    }
  }

  // Remove user from queue
  removeFromQueue(socketId) {
    const index = this.waitingQueue.findIndex(entry => entry.socketId === socketId);
    if (index > -1) {
      this.waitingQueue.splice(index, 1);
    }
  }

  // Try to find a match for a user
  findMatch(socketId, userInfo) {
    // Store user meta
    if (userInfo) {
      this.userMeta.set(socketId, userInfo);
    }

    // Remove self from queue if present
    this.removeFromQueue(socketId);

    // Find first available user in queue
    if (this.waitingQueue.length > 0) {
      const partner = this.waitingQueue.shift();

      // Create the pair
      this.pairs.set(socketId, partner.socketId);
      this.pairs.set(partner.socketId, socketId);

      return partner.socketId;
    }

    // No match found, add to queue
    this.addToQueue(socketId, userInfo);
    return null;
  }

  // Get partner for a user
  getPartner(socketId) {
    return this.pairs.get(socketId) || null;
  }

  // Disconnect a pair
  breakPair(socketId) {
    const partnerId = this.pairs.get(socketId);
    if (partnerId) {
      this.pairs.delete(socketId);
      this.pairs.delete(partnerId);
      return partnerId;
    }
    return null;
  }

  // Full cleanup when user disconnects
  removeUser(socketId) {
    this.removeFromQueue(socketId);
    this.userMeta.delete(socketId);
    return this.breakPair(socketId);
  }

  // Get user meta
  getUserMeta(socketId) {
    return this.userMeta.get(socketId) || null;
  }

  // Get stats
  getStats() {
    return {
      waiting: this.waitingQueue.length,
      paired: this.pairs.size / 2
    };
  }
}

export default new Matchmaker();
