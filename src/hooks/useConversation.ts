import { useEffect, useRef, useCallback, useState } from 'react';
import { ConversationFactory } from '@/lib/ConversationFactory';
import { Conversation } from '@/lib/Conversation';
import type { FormatConfig } from '@/lib/Audio';
import type {
  ServerEventType,
  ClientEventType,
  SessionProperties,
  InputAudioBufferSpeechStartedEvent,
  InputAudioBufferSpeechStoppedEvent,
  ResponseTextDeltaEvent,
  ResponseTextDoneEvent,
  ResponseAudioDeltaEvent,
  ResponseAudioDoneEvent,
  ErrorEvent,
  ConversationItemInputAudioTranscriptionCompletedEvent,
  InputAudioBufferCommittedEvent,
  SessionCreatedEvent,
  SessionUpdatedEvent,
  ResponseCreatedEvent,
  ConversationItemCreatedEvent,
} from '@/types/RealtimeApiEvents';

interface UseConversationConfig {
  url: string;
  audioConfig?: FormatConfig;
  onSpeechStart?: (event: InputAudioBufferSpeechStartedEvent) => void;
  onSpeechEnd?: (event: InputAudioBufferSpeechStoppedEvent) => void;
  onAudioBufferCommitted?: (event: InputAudioBufferCommittedEvent) => void;
  onTextDelta?: (event: ResponseTextDeltaEvent) => void;
  onTextDone?: (event: ResponseTextDoneEvent) => void;
  onAudioDelta?: (event: ResponseAudioDeltaEvent) => void;
  onAudioDone?: (event: ResponseAudioDoneEvent) => void;
  onSessionCreated?: (event: SessionCreatedEvent) => void;
  onSessionUpdated?: (event: SessionUpdatedEvent) => void;
  onResponseCreated?: (event: ResponseCreatedEvent) => void;
  onConversationItemCreated?: (event: ConversationItemCreatedEvent) => void;
  onTranscriptComplete?: (event: ConversationItemInputAudioTranscriptionCompletedEvent) => void;
  onError?: (event: ErrorEvent) => void;
  onConnected?: () => void;
  onDisconnected?: () => void;
}

interface ConversationState {
  isConnected: boolean;
  isProcessing: boolean;
  error: ErrorEvent | null;
}

export function useConversation(config: UseConversationConfig) {
  const conversationRef = useRef<Conversation | null>(null);
  const [state, setState] = useState<ConversationState>({
    isConnected: false,
    isProcessing: false,
    error: null,
  });

  // add mute control
  const setMuted = useCallback((muted: boolean) => {
    if (conversationRef.current) {
      conversationRef.current.setMuted(muted);
    }
  }, []);

  const getMuted = useCallback(() => {
    return conversationRef.current?.getMuted() ?? false;
  }, []);

  // add volume control
  const setVolume = useCallback((volume: number) => {
    if (conversationRef.current) {
      conversationRef.current.setVolume(volume);
    }
  }, []);

  const getVolume = useCallback(() => {
    return conversationRef.current?.getVolume() ?? 1;
  }, []);

  // add connection status
  const getConnectionStatus = useCallback(() => {
    return conversationRef.current?.getConnectionStatus() ?? false;
  }, []);

  // start session
  const startSession = useCallback(async (url?: string) => {
    try {
      if (conversationRef.current) {
        await conversationRef.current.endSession();
      }

      console.log('Starting new session');
      const conversation = await ConversationFactory.createRealtimeApiConversation({
        url: url || config.url,
        audioConfig: config.audioConfig,
        onSendEvent: (event: ClientEventType) => {
          if (event.type === "response.create") {
            setState(prev => ({ ...prev, isProcessing: true }));
          }
        },
        eventHandlers: {
          onConnected: () => {
            console.log('Connected event received');
            setState(prev => ({ ...prev, isConnected: true, error: null }));
            config.onConnected?.();
          },
          onDisconnected: () => {
            console.log('Disconnected event received');
            setState(prev => ({ ...prev, isConnected: false }));
            config.onDisconnected?.();
          },
          onSpeechStart: (event: InputAudioBufferSpeechStartedEvent) => {
            config.onSpeechStart?.(event);
          },
          onSpeechEnd: (event: InputAudioBufferSpeechStoppedEvent) => {
            config.onSpeechEnd?.(event);
          },
          onAudioBufferCommitted: (event: InputAudioBufferCommittedEvent) => {
            config.onAudioBufferCommitted?.(event);
          },
          onTextDelta: (event: ResponseTextDeltaEvent) => {
            config.onTextDelta?.(event);
          },
          onTextDone: (event: ResponseTextDoneEvent) => {
            setState(prev => ({ ...prev, isProcessing: false }));
            config.onTextDone?.(event);
          },
          onAudioDelta: (event: ResponseAudioDeltaEvent) => {
            config.onAudioDelta?.(event);
          },
          onAudioDone: (event: ResponseAudioDoneEvent) => {
            config.onAudioDone?.(event);
          },
          onTranscriptComplete: (event: ConversationItemInputAudioTranscriptionCompletedEvent) => {
            config.onTranscriptComplete?.(event);
          },
          onSessionCreated: (event: SessionCreatedEvent) => {
            config.onSessionCreated?.(event);
          },
          onSessionUpdated: (event: SessionUpdatedEvent) => {
            config.onSessionUpdated?.(event);
          },
          onResponseCreated: (event: ResponseCreatedEvent) => {
            config.onResponseCreated?.(event);
          },
          onConversationItemCreated: (event: ConversationItemCreatedEvent) => {
            config.onConversationItemCreated?.(event);
          },
          onError: (event: ErrorEvent) => {
            console.error('Error event received:', event);
            setState(prev => ({
              ...prev,
              error: {
                type: "error",
                event_id: crypto.randomUUID(),
                error: {
                  type: "error",
                  code: "START_SESSION_ERROR",
                  message: event instanceof Error ? event.message : 'Failed to start conversation'
                }
              }
            }));
            config.onError?.(event);
          }
        }
      });

      // save instance reference
      conversationRef.current = conversation;
      console.log('Session started successfully');
    } catch (error) {
      console.error('Failed to start conversation:', error);
      setState(prev => ({
        ...prev,
        error: {
          type: "error",
          event_id: crypto.randomUUID(),
          error: {
            type: "error",
            code: "START_SESSION_ERROR",
            message: error instanceof Error ? error.message : 'Failed to start conversation'
          }
        }
      }));
      throw error;
    }
  }, [config]);

  // end session
  const endSession = useCallback(async () => {
    try {
      if (conversationRef.current) {
        await conversationRef.current.endSession();
        conversationRef.current = null;
      }
    } catch (error) {
      console.error('Failed to end conversation:', error);
    }
  }, []);

  // update session properties
  const updateSession = useCallback((properties: SessionProperties) => {
    conversationRef.current?.updateSession(properties);
  }, []);

  // send event
  const sendEvent = useCallback((event: ClientEventType) => {
    conversationRef.current?.sendEvent(event);
  }, []);

  // cleanup function
  useEffect(() => {
    return () => {
      if (conversationRef.current) {
        conversationRef.current.endSession().catch(console.error);
      }
    };
  }, []);

  return {
    ...state,
    startSession,
    endSession,
    updateSession,
    sendEvent,
    setMuted,
    getMuted,
    setVolume,
    getVolume,
    getConnectionStatus,
  };
} 