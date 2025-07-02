import { 
  ClientEventType, 
  ServerEventType,
  ErrorEvent
} from '@/types/RealtimeApiEvents';

export interface EventProcessorConfig {
  onSendEvent?: (event: ClientEventType) => void;
}

export abstract class EventProcessor {
  protected eventHandlers: Map<string, Set<(event: any) => void>> = new Map();
  protected onSendEvent?: (event: ClientEventType) => void;

  constructor(config: EventProcessorConfig = {}) {
    this.onSendEvent = config.onSendEvent;
  }

  /**
   * Process raw events received from the server
   */
  abstract processServerEvent(event: ServerEventType): void;

  /**
   * Process internal events (such as connection status changes)
   */
  abstract processInternalEvent(event: { type: string; [key: string]: any }): void;

  /**
   * Register event handler
   */
  public on(eventType: string, handler: (event: any) => void): void {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, new Set());
    }
    this.eventHandlers.get(eventType)?.add(handler);
  }

  /**
   * Unregister event handler
   */
  public off(eventType: string, handler: (event: any) => void): void {
    this.eventHandlers.get(eventType)?.delete(handler);
  }

  /**
   * Trigger event
   */
  protected triggerEvent(eventType: string, event: any): void {
    const handlers = this.eventHandlers.get(eventType);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(event);
        } catch (error) {
          console.error(`Error in event handler for ${eventType}:`, error);
          this.handleError(error);
        }
      });
    }
  }

  /**
   * Error handling
   */
  protected handleError(error: any): void {
    const errorEvent: ErrorEvent = {
      type: "error",
      event_id: crypto.randomUUID(),
      error: {
        type: "error",
        code: "internal_error",
        message: error.message || 'Internal error occurred'
      }
    };
    this.triggerEvent("error", errorEvent);
  }

  /**
   * Clean up resources
   */
  public destroy(): void {
    this.eventHandlers.clear();
  }
} 