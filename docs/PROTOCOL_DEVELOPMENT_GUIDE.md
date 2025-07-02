# Protocol Development Guide

## Overview

This guide introduces how to develop new protocol support for voice transcription applications. The current architecture adopts an event processor separation design, making it simple and maintainable to add new protocols.

## Architecture Overview

```
┌─────────────────┐    ┌─────────────────────┐    ┌─────────────────┐
│ useConversation │───▶│ ConversationFactory │───▶│ Conversation    │
└─────────────────┘    └─────────────────────┘    └─────────────────┘
                                │                         │
                                ▼                         ▼
                       ┌─────────────────┐       ┌─────────────────┐
                       │ EventProcessor  │       │   AudioInput    │
                       │   (Abstract)    │       │   AudioOutput   │
                       └─────────────────┘       └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │Protocol Specific│
                       │EventProcessor   │
                       └─────────────────┘
```

## Development Steps

### Step 1: Define Protocol Event Types

Create event type definitions for the new protocol in the `src/types/` directory:

```typescript
// src/types/YourProtocolEvents.ts

// Base event interface
interface BaseYourEvent {
  event_id: string;
  type: string;
  timestamp: number;
}

// Client events
export interface YourClientEvent extends BaseYourEvent {
  type: "your.client.event";
  data: any;
}

// Server events
export interface YourServerEvent extends BaseYourEvent {
  type: "your.server.event";
  payload: any;
}

// Audio events
export interface YourAudioEvent extends BaseYourEvent {
  type: "your.audio.chunk";
  audio_data: string; // base64 encoded
  sequence: number;
}

// Text events
export interface YourTextEvent extends BaseYourEvent {
  type: "your.text.delta";
  text: string;
  is_final: boolean;
}

// Combined types
export type YourClientEventType = YourClientEvent;
export type YourServerEventType = YourServerEvent | YourAudioEvent | YourTextEvent;
```

### Step 2: Create Protocol Event Processor

Create an event processor for the new protocol in the `src/lib/protocols/` directory:

```typescript
// src/lib/protocols/YourProtocolEventProcessor.ts

import { EventProcessor, EventProcessorConfig } from '../EventProcessor';
import { 
  YourServerEventType,
  YourAudioEvent,
  YourTextEvent
} from '@/types/YourProtocolEvents';

export interface YourProtocolEventProcessorConfig extends EventProcessorConfig {
  onAudioChunk?: (audioData: string, sequence: number) => void;
  onTextUpdate?: (text: string, isFinal: boolean) => void;
}

export class YourProtocolEventProcessor extends EventProcessor {
  private onAudioChunk?: (audioData: string, sequence: number) => void;
  private onTextUpdate?: (text: string, isFinal: boolean) => void;

  constructor(config: YourProtocolEventProcessorConfig = {}) {
    super(config);
    this.onAudioChunk = config.onAudioChunk;
    this.onTextUpdate = config.onTextUpdate;
  }

  public processServerEvent(event: YourServerEventType): void {
    switch (event.type) {
      case "your.audio.chunk":
        this.handleAudioEvent(event as YourAudioEvent);
        break;
      case "your.text.delta":
        this.handleTextEvent(event as YourTextEvent);
        break;
      default:
        // Trigger generic event processor
        this.triggerEvent(event.type, event);
    }
  }

  public processInternalEvent(event: { type: string; [key: string]: any }): void {
    this.triggerEvent(event.type, event);
  }

  private handleAudioEvent(event: YourAudioEvent): void {
    this.onAudioChunk?.(event.audio_data, event.sequence);
    
    // Convert to standard format and trigger event
    this.triggerEvent("response.audio.delta", {
      type: "response.audio.delta",
      response_id: event.event_id,
      delta: event.audio_data,
    });
  }

  private handleTextEvent(event: YourTextEvent): void {
    this.onTextUpdate?.(event.text, event.is_final);
    
    // Convert to standard format and trigger event
    this.triggerEvent("response.text.delta", {
      type: "response.text.delta",
      response_id: event.event_id,
      delta: event.text,
    });
  }

  // Methods to set callbacks
  public setAudioChunkCallback(callback: (audioData: string, sequence: number) => void): void {
    this.onAudioChunk = callback;
  }

  public setTextUpdateCallback(callback: (text: string, isFinal: boolean) => void): void {
    this.onTextUpdate = callback;
  }
}
```

### Step 3: Extend ConversationFactory

Add a factory method for the new protocol in `src/lib/ConversationFactory.ts`:

```typescript
// Add new method in ConversationFactory class

/**
 * Create a conversation instance using your protocol
 */
public static async createYourProtocolConversation(
  config: ConversationFactoryConfig & {
    yourEventHandlers?: {
      onAudioChunk?: (audioData: string, sequence: number) => void;
      onTextUpdate?: (text: string, isFinal: boolean) => void;
    };
  }
): Promise<Conversation> {
  // Create your event processor
  const eventProcessor = new YourProtocolEventProcessor({
    onSendEvent: config.onSendEvent,
    onAudioChunk: config.yourEventHandlers?.onAudioChunk,
    onTextUpdate: config.yourEventHandlers?.onTextUpdate,
  });

  // Set up standard event handlers
  if (config.eventHandlers) {
    Object.entries(config.eventHandlers).forEach(([eventType, handler]) => {
      if (handler) {
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

  // Set up audio processing callback
  eventProcessor.setAudioChunkCallback((audioData: string, sequence: number) => {
    conversation.addAudioBase64Chunk(audioData);
  });

  return conversation;
}
```

### Step 4: Create Usage Examples

```typescript
// src/lib/protocols/YourProtocolExample.ts

import { ConversationFactory } from '../ConversationFactory';

// Create your protocol conversation using factory method
export async function createYourProtocolConversation() {
  const conversation = await ConversationFactory.createYourProtocolConversation({
    url: 'wss://your-api.example.com',
    audioConfig: {
      sampleRate: 16000,
      format: 'pcm'
    },
    eventHandlers: {
      onConnected: () => console.log('Connected to your protocol'),
      onDisconnected: () => console.log('Disconnected from your protocol'),
      onTextDelta: (event) => console.log('Text delta:', event.delta),
      onError: (event) => console.error('Error:', event.error)
    },
    yourEventHandlers: {
      onAudioChunk: (audioData, sequence) => {
        console.log(`Received audio chunk ${sequence}:`, audioData.substring(0, 50) + '...');
      },
      onTextUpdate: (text, isFinal) => {
        console.log(`Text update (${isFinal ? 'final' : 'partial'}):`, text);
      }
    }
  });

  return conversation;
}

// Manual creation method
export async function createYourProtocolConversationManual() {
  const eventProcessor = new YourProtocolEventProcessor({
    onAudioChunk: (audioData, sequence) => {
      console.log(`Your audio chunk ${sequence}`);
    },
    onTextUpdate: (text, isFinal) => {
      console.log(`Your text: ${text} (${isFinal ? 'final' : 'partial'})`);
    }
  });

  const conversation = await ConversationFactory.createCustomProtocolConversation({
    url: 'wss://your-api.example.com',
    audioConfig: { sampleRate: 16000, format: 'pcm' },
    eventProcessor
  });

  eventProcessor.setAudioChunkCallback((audioData, sequence) => {
    conversation.addAudioBase64Chunk(audioData);
  });

  return conversation;
}
```

## Key Design Principles

### 1. Event Transformation
- Convert protocol-specific events to standard format
- Maintain compatibility with existing event processors

### 2. Audio Processing
- Ensure audio data is correctly passed to `Conversation`
- Support audio interruption and fade-out functionality

### 3. Error Handling
- Implement unified error handling mechanism
- Provide meaningful error messages

### 4. Type Safety
- Use TypeScript to ensure type safety
- Define clear interfaces and types

## Testing Guide

### 1. Unit Testing
```typescript
// Test event processor
describe('YourProtocolEventProcessor', () => {
  it('should handle audio events correctly', () => {
    const processor = new YourProtocolEventProcessor();
    const mockCallback = jest.fn();
    processor.setAudioChunkCallback(mockCallback);
    
    processor.processServerEvent({
      type: 'your.audio.chunk',
      event_id: 'test',
      timestamp: Date.now(),
      audio_data: 'base64data',
      sequence: 1
    });
    
    expect(mockCallback).toHaveBeenCalledWith('base64data', 1);
  });
});
```

### 2. Integration Testing
```typescript
// Test complete workflow
describe('YourProtocol Integration', () => {
  it('should create conversation with your protocol', async () => {
    const conversation = await createYourProtocolConversation();
    expect(conversation).toBeDefined();
    expect(conversation.getConnectionStatus()).toBe(true);
  });
});
```

## Best Practices

1. **Maintain Consistency**: Follow existing naming conventions and code style
2. **Documentation**: Provide detailed usage documentation for each protocol
3. **Backward Compatibility**: Ensure new protocols don't affect existing functionality
4. **Performance Considerations**: Avoid time-consuming operations in event processing
5. **Error Recovery**: Implement appropriate error recovery mechanisms

## Frequently Asked Questions

### Q: How to handle protocol version upgrades?
A: Add version detection and compatibility handling logic in the event processor.

### Q: How to support different audio formats?
A: Perform format conversion in audio processing callbacks, or extend the `AudioConfig` interface.

### Q: How to implement protocol-specific authentication?
A: Add authentication configuration parameters in factory methods, handle authentication before establishing WebSocket connections.

## Summary

By following this guide, you can easily add new protocol support to your application while maintaining code maintainability and extensibility. Each new protocol is an independent module that won't affect existing functionality. 