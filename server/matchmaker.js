// Matchmaker - handles user queue and pairing

class Matchmaker {
  constructor() {
    this.waitingQueue = [];
    this.pairs = new Map(); // socketId -> partnerSocketId
  }

  // Add user to waiting queue
  addToQueue(socketId) {
    if (!this.waitingQueue.includes(socketId) && !this.pairs.has(socketId)) {
      this.waitingQueue.push(socketId);
    }
  }

  // Remove user from queue
  removeFromQueue(socketId) {
    const index = this.waitingQueue.indexOf(socketId);
    if (index > -1) {
      this.waitingQueue.splice(index, 1);
    }
  }

  // Try to find a match for a user
  findMatch(socketId) {
    // Remove self from queue if present
    this.removeFromQueue(socketId);

    // Find first available user in queue
    if (this.waitingQueue.length > 0) {
      const partnerId = this.waitingQueue.shift();

      // Create the pair
      this.pairs.set(socketId, partnerId);
      this.pairs.set(partnerId, socketId);

      return partnerId;
    }

    // No match found, add to queue
    this.addToQueue(socketId);
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
    return this.breakPair(socketId);
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
