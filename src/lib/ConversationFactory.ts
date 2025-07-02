import { Conversation } from './Conversation';
import { RealtimeApiEventProcessor } from './protocols/RealtimeApiEventProcessor';
import { EventProcessor } from './EventProcessor';
import { FormatConfig } from './Audio';
import { ClientEventType } from '@/types/RealtimeApiEvents';

interface ConversationFactoryConfig {
  url: string;
  audioConfig?: FormatConfig;
  onSendEvent?: (event: ClientEventType) => void;
  eventHandlers?: {
    onConnected?: () => void;
    onDisconnected?: () => void;
    onSpeechStart?: (event: any) => void;
    onSpeechEnd?: (event: any) => void;
    onTextDelta?: (event: any) => void;
    onTextDone?: (event: any) => void;
    onAudioDelta?: (event: any) => void;
    onAudioDone?: (event: any) => void;
    onError?: (event: any) => void;
    [key: string]: ((event: any) => void) | undefined;
  };
}

export class ConversationFactory {
  /**
   * Create a conversation instance using the real-time API protocol
   */
  public static async createRealtimeApiConversation(config: ConversationFactoryConfig): Promise<Conversation> {
    // Create event processor
    const eventProcessor = new RealtimeApiEventProcessor({
      onSendEvent: config.onSendEvent
    });

    // Set up event handlers
    if (config.eventHandlers) {
      Object.entries(config.eventHandlers).forEach(([eventType, handler]) => {
        if (handler) {
          // Convert camelCase to underscore naming
          const normalizedEventType = this.normalizeEventType(eventType);
          eventProcessor.on(normalizedEventType, handler);
        }
      });
    }

    // Create conversation instance
    const conversation = await Conversation.startSession({
      url: config.url,
      audioConfig: config.audioConfig,
      eventProcessor,
      onSendEvent: config.onSendEvent
    });

    // Set up audio processing callbacks
    const audioProcessor = eventProcessor as RealtimeApiEventProcessor;
    audioProcessor.setAudioChunkCallback((chunk: string) => {
      conversation.addAudioBase64Chunk(chunk);
    });
    audioProcessor.setAudioFadeOutCallback(() => {
      conversation.fadeOutAudio();
    });

    return conversation;
  }

  /**
   * Create a conversation instance with custom protocol
   */
  public static async createCustomProtocolConversation(
    config: Omit<ConversationFactoryConfig, 'eventHandlers'> & {
      eventProcessor: EventProcessor;
    }
  ): Promise<Conversation> {
    return Conversation.startSession({
      url: config.url,
      audioConfig: config.audioConfig,
      eventProcessor: config.eventProcessor,
      onSendEvent: config.onSendEvent
    });
  }

  /**
   * Convert camelCase event handler names to underscore event types
   */
  private static normalizeEventType(eventType: string): string {
    const mapping: Record<string, string> = {
      'onConnected': 'connected',
      'onDisconnected': 'disconnected',
      'onSpeechStart': 'input_audio_buffer.speech_started',
      'onSpeechEnd': 'input_audio_buffer.speech_stopped',
      'onTextDelta': 'response.text.delta',
      'onTextDone': 'response.text.done',
      'onAudioDelta': 'response.audio.delta',
      'onAudioDone': 'response.audio.done',
      'onError': 'error',
      'onTranscriptDelta': 'conversation.item.input_audio_transcription.delta',
      'onTranscriptComplete': 'conversation.item.input_audio_transcription.completed',
      'onTranscriptFailed': 'conversation.item.input_audio_transcription.failed',
      'onAudioTranscriptDelta': 'response.audio_transcript.delta',
      'onAudioTranscriptDone': 'response.audio_transcript.done',
      'onSessionCreated': 'session.created',
      'onSessionUpdated': 'session.updated',
      'onConversationCreated': 'conversation.created',
      'onConversationItemCreated': 'conversation.item.created',
      'onConversationItemTruncated': 'conversation.item.truncated',
      'onConversationItemDeleted': 'conversation.item.deleted',
      'onConversationItemRetrieved': 'conversation.item.retrieved',
      'onResponseCreated': 'response.created',
      'onResponseDone': 'response.done',
      'onFunctionCallArgumentsDelta': 'response.function_call_arguments.delta',
      'onFunctionCallArgumentsDone': 'response.function_call_arguments.done'
    };

    return mapping[eventType] || eventType;
  }
} 