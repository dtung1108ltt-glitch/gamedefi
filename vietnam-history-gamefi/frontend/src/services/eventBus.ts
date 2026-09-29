// Simple Event Bus for domain events
type EventCallback = (payload: any) => void;

class GameEventBus {
  private listeners: Record<string, EventCallback[]> = {};

  on(event: string, callback: EventCallback) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(callback);
  }

  off(event: string, callback: EventCallback) {
    if (!this.listeners[event]) return;
    this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
  }

  emit(event: string, payload?: any) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(cb => {
        try {
          cb(payload);
        } catch (e) {
          console.error(`Error in event listener for ${event}:`, e);
        }
      });
    }
  }
}

export const eventBus = new GameEventBus();
