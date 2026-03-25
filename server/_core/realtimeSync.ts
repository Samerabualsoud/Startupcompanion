import { EventEmitter } from 'events';

/**
 * Real-time synchronization event emitter for Cap Table changes
 * Broadcasts updates to all connected clients instantly
 */
class RealtimeSyncManager extends EventEmitter {
  private static instance: RealtimeSyncManager;

  private constructor() {
    super();
    this.setMaxListeners(100); // Allow multiple listeners
  }

  static getInstance(): RealtimeSyncManager {
    if (!RealtimeSyncManager.instance) {
      RealtimeSyncManager.instance = new RealtimeSyncManager();
    }
    return RealtimeSyncManager.instance;
  }

  /**
   * Broadcast Cap Table update to all subscribed clients
   */
  broadcastCapTableUpdate(userId: number, capTable: any[]) {
    this.emit(`capTable:${userId}`, {
      type: 'capTable:update',
      userId,
      capTable,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Broadcast Cap Table founder update
   */
  broadcastFounderUpdate(userId: number, founder: any) {
    this.emit(`capTable:${userId}`, {
      type: 'founder:update',
      userId,
      founder,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Broadcast Cap Table founder deletion
   */
  broadcastFounderDelete(userId: number, founderId: number) {
    this.emit(`capTable:${userId}`, {
      type: 'founder:delete',
      userId,
      founderId,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Subscribe to Cap Table updates for a specific user
   */
  subscribeToCapTableUpdates(userId: number, callback: (data: any) => void) {
    const listener = callback;
    this.on(`capTable:${userId}`, listener);

    // Return unsubscribe function
    return () => {
      this.off(`capTable:${userId}`, listener);
    };
  }

  /**
   * Broadcast Dilution Simulator update
   */
  broadcastDilutionUpdate(userId: number, dilutionData: any) {
    this.emit(`dilution:${userId}`, {
      type: 'dilution:update',
      userId,
      dilutionData,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Subscribe to Dilution Simulator updates
   */
  subscribeToDilutionUpdates(userId: number, callback: (data: any) => void) {
    const listener = callback;
    this.on(`dilution:${userId}`, listener);

    return () => {
      this.off(`dilution:${userId}`, listener);
    };
  }

  /**
   * Broadcast Valuation Report update
   */
  broadcastValuationUpdate(userId: number, valuationData: any) {
    this.emit(`valuation:${userId}`, {
      type: 'valuation:update',
      userId,
      valuationData,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Subscribe to Valuation Report updates
   */
  subscribeToValuationUpdates(userId: number, callback: (data: any) => void) {
    const listener = callback;
    this.on(`valuation:${userId}`, listener);

    return () => {
      this.off(`valuation:${userId}`, listener);
    };
  }

  /**
   * Clear all listeners for a user (cleanup on logout)
   */
  clearUserListeners(userId: number) {
    this.removeAllListeners(`capTable:${userId}`);
    this.removeAllListeners(`dilution:${userId}`);
    this.removeAllListeners(`valuation:${userId}`);
  }
}

export const realtimeSync = RealtimeSyncManager.getInstance();
