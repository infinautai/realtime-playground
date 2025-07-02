import { EventProcessor, EventProcessorConfig } from '../EventProcessor';
import { 
  ServerEventType,
  ResponseAudioDeltaEvent,
  ResponseAudioDoneEvent,
  ResponseAudioCancelEvent,
  ResponseTextDeltaEvent,
  ResponseTextDoneEvent,
  InputAudioBufferSpeechStartedEvent,
  InputAudioBufferSpeechStoppedEvent,
  InputAudioBufferCommittedEvent,
  ResponseAudioTranscriptDeltaEvent,
  ResponseAudioTranscriptDoneEvent,
  SessionCreatedEvent,
  SessionUpdatedEvent,
  ConversationItemCreatedEvent,
  ConversationItemTruncatedEvent,
  ConversationItemDeletedEvent,
  ConversationItemRetrievedEvent,
  ResponseCreatedEvent,
  ResponseDoneEvent,
  ResponseFunctionCallArgumentsDeltaEvent,
  ResponseFunctionCallArgumentsDoneEvent,
  ConversationItemInputAudioTranscriptionDeltaEvent,
  ConversationItemInputAudioTranscriptionCompletedEvent,
  ConversationItemInputAudioTranscriptionFailedEvent
} from '@/types/RealtimeApiEvents';

export interface RealtimeApiEventProcessorConfig extends EventProcessorConfig {
  onAudioChunk?: (chunk: string) => void;
  onAudioInterrupt?: () => void;
  onAudioFadeOut?: () => void;
}

export class RealtimeApiEventProcessor extends EventProcessor {
  private lastInterruptTimestamp: number = 0;
  private onAudioChunk?: (chunk: string) => void;
  private onAudioInterrupt?: () => void;
  private onAudioFadeOut?: () => void;

  constructor(config: RealtimeApiEventProcessorConfig = {}) {
    super(config);
    this.onAudioChunk = config.onAudioChunk;
    this.onAudioInterrupt = config.onAudioInterrupt;
    this.onAudioFadeOut = config.onAudioFadeOut;
  }

  public processServerEvent(event: ServerEventType | ResponseAudioCancelEvent): void {
    const timestamp = new Date().toISOString();

    // Handle audio response events
    if (event.type === "response.audio.delta" || event.type === "response.audio.done") {
      this.handleAudioResponse(event as ResponseAudioDeltaEvent | ResponseAudioDoneEvent);
      return;
    }

    // Handle audio interrupt events
    if (event.type === "response.audio.cancel") {
      this.handleAudioInterrupt(event as ResponseAudioCancelEvent);
      return;
    }

    // Filter expired text response events
    if (event.type === "response.text.delta" || event.type === "response.text.done") {
      if (this.shouldFilterTextEvent(event as ResponseTextDeltaEvent | ResponseTextDoneEvent)) {
        return;
      }
    }

    // Trigger corresponding event handlers
    this.triggerEvent(event.type, event);
  }

  public processInternalEvent(event: { type: string; [key: string]: any }): void {
    this.triggerEvent(event.type, event);
  }

  private handleAudioResponse(event: ResponseAudioDeltaEvent | ResponseAudioDoneEvent): void {
    const timestamp = this.parseResponseId(event.response_id);
    
    if (this.lastInterruptTimestamp <= timestamp) {
      if (event.type === "response.audio.delta") {
        this.onAudioChunk?.(event.delta);
      }
      // For response.audio.done, no special handling is currently needed
    }
  }

  private handleAudioInterrupt(event: ResponseAudioCancelEvent): void {
    this.lastInterruptTimestamp = this.parseResponseId(event.response_id);
    console.log("lastInterruptTimestamp", this.lastInterruptTimestamp);
    this.onAudioInterrupt?.();
    this.onAudioFadeOut?.();
  }

  private shouldFilterTextEvent(event: ResponseTextDeltaEvent | ResponseTextDoneEvent): boolean {
    return this.lastInterruptTimestamp > this.parseResponseId(event.response_id);
  }

  private parseResponseId(responseId: string): number {
    return parseFloat(responseId.split('_')[1] || '0');
  }

  /**
   * Get the last interrupt timestamp (for external queries)
   */
  public getLastInterruptTimestamp(): number {
    return this.lastInterruptTimestamp;
  }

  /**
   * Reset interrupt timestamp
   */
  public resetInterruptTimestamp(): void {
    this.lastInterruptTimestamp = 0;
  }

  /**
   * Set audio chunk processing callback
   */
  public setAudioChunkCallback(callback: (chunk: string) => void): void {
    this.onAudioChunk = callback;
  }

  /**
   * Set audio interrupt callback
   */
  public setAudioInterruptCallback(callback: () => void): void {
    this.onAudioInterrupt = callback;
  }

  /**
   * Set audio fade out callback
   */
  public setAudioFadeOutCallback(callback: () => void): void {
    this.onAudioFadeOut = callback;
  }
} 