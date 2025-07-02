import { 
  ClientEventType, 
  SessionProperties,
  SessionUpdateEvent,
  InputAudioBufferAppendEvent
} from '@/types/RealtimeApiEvents';

import {
  AudioInput,
  AudioOutput,
  type FormatConfig,
  arrayBufferToBase64,
  base64ToArrayBuffer
} from './Audio';

import { EventProcessor } from './EventProcessor';

interface ConversationConfig {
  url: string;
  audioConfig?: FormatConfig;
  eventProcessor: EventProcessor;
  onSendEvent?: (event: ClientEventType) => void;
}

export class Conversation {
  private ws: WebSocket | null = null;
  private isConnected: boolean = false;
  private audioConfig: FormatConfig;
  private eventProcessor: EventProcessor;
  private onSendEvent?: (event: ClientEventType) => void;
  private audioInput: AudioInput | null = null;
  private audioOutput: AudioOutput | null = null;
  private isMuted: boolean = false;
  private volume: number = 1;

  private constructor(private config: ConversationConfig) {
    this.audioConfig = config.audioConfig || {
      sampleRate: 16000,
      format: "pcm"
    };
    this.eventProcessor = config.eventProcessor;
    this.onSendEvent = config.onSendEvent;
  }

  private async initialize(): Promise<void> {
    try {
      // Initialize audio output
      this.audioOutput = await AudioOutput.create(this.audioConfig);
      
      // Initialize audio input
      this.audioInput = await AudioInput.create(this.audioConfig);
      
      // Set muted state
      if (this.isMuted) {
        this.audioInput.setMuted(true);
      }
      
      // Set audio input data processor
      this.audioInput.worklet.port.onmessage = (event) => {
        const [rawAudioPcmData, maxVolume] = event.data;

        if (this.isConnected) {
          this.sendAudioBuffer(rawAudioPcmData.buffer);
        }
      };
      
      // Initialize WebSocket connection
      await this.initializeWebSocket();
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  public static async startSession(config: ConversationConfig): Promise<Conversation> {
    const conversation = new Conversation(config);
    await conversation.initialize();
    return conversation;
  }

  private async initializeWebSocket(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        if (this.ws) {
          this.ws.close();
        }

        this.ws = new WebSocket(this.config.url);
        
        this.ws.onopen = () => {
          console.log('WebSocket connection opened');
          this.isConnected = true;
          this.eventProcessor.processInternalEvent({ type: "connected" });
          resolve();
        };

        this.ws.onclose = () => {
          console.log('WebSocket connection closed');
          this.isConnected = false;
          this.eventProcessor.processInternalEvent({ type: "disconnected" });
        };

        this.ws.onerror = async (error) => {
          console.error('WebSocket error:', error);
          this.isConnected = false;
          // Close audio input and output
          await this.audioInput?.close();
          await this.audioOutput?.close();
          this.handleError(error);
          reject(error);
        };

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            this.eventProcessor.processServerEvent(data);
          } catch (error) {
            console.error('Error parsing message:', error);
            this.handleError(new Error(`Failed to parse message: ${error}`));
          }
        };
      } catch (error) {
        console.error('Error initializing WebSocket:', error);
        reject(error);
      }
    });
  }

  private sendAudioBuffer(audioData: ArrayBufferLike) {
    const event: InputAudioBufferAppendEvent = {
      type: "input_audio_buffer.append",
      event_id: crypto.randomUUID(),
      audio: arrayBufferToBase64(audioData)
    };

    this.sendEvent(event);
  }

  public updateSession(session: SessionProperties) {
    const event: SessionUpdateEvent = {
      type: "session.update",
      event_id: crypto.randomUUID(),
      session
    };
    this.sendEvent(event);
  }

  public sendEvent(event: ClientEventType) {
    if (!this.ws || !this.isConnected) {
      throw new Error('WebSocket is not connected');
    }

    // Log sent events (except audio buffer events, because too frequent)
    if (event.type !== "input_audio_buffer.append") {
      const timestamp = new Date().toISOString();
      console.debug(`[${timestamp}] Sending event:`, {
        type: event.type,
        event
      });
    }

    this.ws.send(JSON.stringify(event));
    if (event.type !== "input_audio_buffer.append") {
      this.onSendEvent?.(event);
    }
  }

  private handleError(error: any) {
    const timestamp = new Date().toISOString();
    const errorDetails = {
      message: error.message || 'Unknown error',
      stack: error.stack,
      timestamp
    };
    
    console.error(`[${timestamp}] Error in conversation:`, errorDetails);
  }

  public async endSession(): Promise<void> {
    try {
      // Stop audio processing
      await this.audioInput?.close();
      await this.audioOutput?.close();
      
      // Close WebSocket connection
      if (this.ws) {
        this.ws.close();
        this.ws = null;
      }
      
      // Reset state
      this.isConnected = false;
      
      // Trigger disconnected event
      this.eventProcessor.processInternalEvent({ type: "disconnected" });
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  // Event listener proxy to event processor
  public on(eventType: string, handler: (event: any) => void): void {
    this.eventProcessor.on(eventType, handler);
  }

  public off(eventType: string, handler: (event: any) => void): void {
    this.eventProcessor.off(eventType, handler);
  }

  public async close() {
    try {
      await this.endSession();
    } catch (error) {
      this.handleError(error);
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.audioInput) {
      this.audioInput.setMuted(muted);
    } else {
      console.warn("[Conversation] audioInput is null when trying to set muted state");
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public setVolume(volume: number) {
    this.volume = Math.max(0, Math.min(1, volume));
    if (this.audioOutput) {
      this.audioOutput.gain.gain.value = this.volume;
    }
  }

  public getVolume(): number {
    return this.volume;
  }

  public getConnectionStatus(): boolean {
    return this.isConnected;
  }

  // Audio processing methods
  public addAudioBase64Chunk(chunk: string) {
    if (!this.audioOutput) {
      return;
    }

    this.audioOutput.worklet.port.postMessage({ type: "clearInterrupted" });
    this.audioOutput.worklet.port.postMessage({
      type: "buffer",
      buffer: base64ToArrayBuffer(chunk),
    });
  }

  public fadeOutAudio() {
    if (!this.audioOutput) {
      return;
    }

    this.audioOutput.worklet.port.postMessage({ type: "interrupt" });
    this.audioOutput.gain.gain.exponentialRampToValueAtTime(
      0.0001,
      this.audioOutput.context.currentTime + 2
    );

    // reset volume back
    setTimeout(() => {
      if (!this.audioOutput) {
        return;
      }

      this.audioOutput.gain.gain.value = this.volume;
      this.audioOutput.worklet.port.postMessage({ type: "clearInterrupted" });
    }, 2000); // Adjust the duration as needed
  }
} 