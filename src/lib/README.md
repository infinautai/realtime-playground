# Conversation Event Handling Architecture

## Overview

The new architecture separates event handling from the `Conversation` class, achieving better separation of concerns and extensibility.

## Architecture Components

### 1. EventProcessor (Abstract Base Class)
- Defines the basic interface for event handling
- Provides event registration and triggering mechanisms
- Handles errors and resource cleanup

### 2. RealtimeApiEventProcessor (Concrete Implementation)
- Implements event handling logic for the real-time API protocol
- Handles special logic such as audio interruption and text filtering
- Manages interrupt timestamps

### 3. Conversation (Refactored Conversation Class)
- Focuses on WebSocket connection and audio processing
- Delegates event handling to EventProcessor
- Provides a clean API interface

### 4. ConversationFactory (Factory Class)
- Simplifies conversation instance creation
- Supports event processors for different protocols
- Provides convenient configuration options

## Usage Examples

### Basic Usage

```typescript
import { ConversationFactory } from './lib/ConversationFactory';

// Create a conversation using the real-time API protocol
const conversation = await ConversationFactory.createRealtimeApiConversation({
  url: 'wss://api.example.com',
  audioConfig: {
    sampleRate: 16000,
    format: 'pcm'
  },
  eventHandlers: {
    onConnected: () => console.log('Connected'),
    onDisconnected: () => console.log('Disconnected'),
    onTextDelta: (event) => console.log('Text:', event.delta),
    onError: (event) => console.error('Error:', event.error)
  }
});

// Use the conversation
conversation.on('response.text.delta', (event) => {
  console.log('Received text:', event.delta);
});

// Set muted state
conversation.setMuted(true);

// Set volume
conversation.setVolume(0.8);

// Close connection
await conversation.close();
```

### Custom Protocol

```typescript
import { Conversation } from './lib/Conversation';
import { EventProcessor } from './lib/EventProcessor';

// Create custom event processor
class CustomEventProcessor extends EventProcessor {
  processServerEvent(event: any): void {
    // Custom event handling logic
    console.log('Custom event:', event);
    this.triggerEvent(event.type, event);
  }

  processInternalEvent(event: any): void {
    this.triggerEvent(event.type, event);
  }
}

// Create conversation instance
const customProcessor = new CustomEventProcessor();
const conversation = await Conversation.startSession({
  url: 'wss://custom-api.example.com',
  eventProcessor: customProcessor
});
```

### Advanced Configuration

```typescript
import { RealtimeApiEventProcessor } from './lib/protocols/RealtimeApiEventProcessor';

// Create custom real-time API event processor
const eventProcessor = new RealtimeApiEventProcessor({
  onAudioChunk: (chunk: string) => {
    // Custom audio processing logic
    playAudioChunk(chunk);
  },
  onAudioInterrupt: () => {
    // Custom interrupt handling
    stopAudioPlayback();
  },
  onAudioFadeOut: () => {
    // Custom fade out effect
    fadeOutAudio();
  }
});

// Register event handlers
eventProcessor.on('response.text.delta', (event) => {
  updateUI(event.delta);
});

// Create conversation
const conversation = await Conversation.startSession({
  url: 'wss://api.example.com',
  eventProcessor
});
```

## Advantages

1. **Protocol Decoupling**: Conversation class is no longer bound to specific protocols
2. **Extensibility**: Easy to support new protocol versions
3. **Testability**: Event processors can be tested independently
4. **Clear Responsibilities**: Each class has clear responsibilities
5. **Backward Compatibility**: Maintains API compatibility through factory classes

## New Features

```typescript
// Get connection status
const isConnected = conversation.getConnectionStatus();

// Set volume
conversation.setVolume(0.5);

// Get volume
const volume = conversation.getVolume();
``` 