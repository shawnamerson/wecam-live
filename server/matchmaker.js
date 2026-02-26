// Matchmaker - handles user queue and pairing

class Matchmaker {
  constructor() {
    this.waitingQueue = []; // { socketId, userInfo, genderFilter }
    this.pairs = new Map(); // socketId -> partnerSocketId
    this.userMeta = new Map(); // socketId -> { userInfo, genderFilter }
  }

  // Two-way compatibility check
  isCompatible(a, b) {
    if (a.genderFilter && b.userInfo?.gender !== a.genderFilter) return false;
    if (b.genderFilter && a.userInfo?.gender !== b.genderFilter) return false;
    return true;
  }

  // Add user to waiting queue
  addToQueue(socketId, userInfo, genderFilter) {
    const inQueue = this.waitingQueue.some(entry => entry.socketId === socketId);
    if (!inQueue && !this.pairs.has(socketId)) {
      this.waitingQueue.push({ socketId, userInfo: userInfo || null, genderFilter: genderFilter || null });
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
  findMatch(socketId, userInfo, genderFilter) {
    // Store user meta
    this.userMeta.set(socketId, { userInfo: userInfo || null, genderFilter: genderFilter || null });

    // Remove self from queue if present
    this.removeFromQueue(socketId);

    const incoming = { socketId, userInfo: userInfo || null, genderFilter: genderFilter || null };

    // Scan queue for first compatible user
    for (let i = 0; i < this.waitingQueue.length; i++) {
      const candidate = this.waitingQueue[i];
      if (this.isCompatible(incoming, candidate)) {
        // Remove matched candidate from queue
        this.waitingQueue.splice(i, 1);

        // Create the pair
        this.pairs.set(socketId, candidate.socketId);
        this.pairs.set(candidate.socketId, socketId);

        return candidate.socketId;
      }
    }

    // No match found, add to queue
    this.addToQueue(socketId, userInfo, genderFilter);
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
