# 协议开发指南

## 概述

本指南介绍如何为语音转录应用开发新的协议支持。当前架构采用事件处理器分离的设计，使得添加新协议变得简单和可维护。

## 架构概览

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

## 开发步骤

### 步骤 1: 定义协议事件类型

在 `src/types/` 目录下创建新协议的事件类型定义：

```typescript
// src/types/YourProtocolEvents.ts

// 基础事件接口
interface BaseYourEvent {
  event_id: string;
  type: string;
  timestamp: number;
}

// 客户端事件
export interface YourClientEvent extends BaseYourEvent {
  type: "your.client.event";
  data: any;
}

// 服务器事件
export interface YourServerEvent extends BaseYourEvent {
  type: "your.server.event";
  payload: any;
}

// 音频事件
export interface YourAudioEvent extends BaseYourEvent {
  type: "your.audio.chunk";
  audio_data: string; // base64 encoded
  sequence: number;
}

// 文本事件
export interface YourTextEvent extends BaseYourEvent {
  type: "your.text.delta";
  text: string;
  is_final: boolean;
}

// 组合类型
export type YourClientEventType = YourClientEvent;
export type YourServerEventType = YourServerEvent | YourAudioEvent | YourTextEvent;
```

### 步骤 2: 创建协议事件处理器

在 `src/lib/protocols/` 目录下创建新协议的事件处理器：

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
        // 触发通用事件处理器
        this.triggerEvent(event.type, event);
    }
  }

  public processInternalEvent(event: { type: string; [key: string]: any }): void {
    this.triggerEvent(event.type, event);
  }

  private handleAudioEvent(event: YourAudioEvent): void {
    this.onAudioChunk?.(event.audio_data, event.sequence);
    
    // 转换为标准格式并触发事件
    this.triggerEvent("response.audio.delta", {
      type: "response.audio.delta",
      response_id: event.event_id,
      delta: event.audio_data,
    });
  }

  private handleTextEvent(event: YourTextEvent): void {
    this.onTextUpdate?.(event.text, event.is_final);
    
    // 转换为标准格式并触发事件
    this.triggerEvent("response.text.delta", {
      type: "response.text.delta",
      response_id: event.event_id,
      delta: event.text,
    });
  }

  // 设置回调的方法
  public setAudioChunkCallback(callback: (audioData: string, sequence: number) => void): void {
    this.onAudioChunk = callback;
  }

  public setTextUpdateCallback(callback: (text: string, isFinal: boolean) => void): void {
    this.onTextUpdate = callback;
  }
}
```

### 步骤 3: 扩展 ConversationFactory

在 `src/lib/ConversationFactory.ts` 中添加新协议的工厂方法：

```typescript
// 在 ConversationFactory 类中添加新方法

/**
 * 创建使用您的协议的对话实例
 */
public static async createYourProtocolConversation(
  config: ConversationFactoryConfig & {
    yourEventHandlers?: {
      onAudioChunk?: (audioData: string, sequence: number) => void;
      onTextUpdate?: (text: string, isFinal: boolean) => void;
    };
  }
): Promise<Conversation> {
  // 创建您的事件处理器
  const eventProcessor = new YourProtocolEventProcessor({
    onSendEvent: config.onSendEvent,
    onAudioChunk: config.yourEventHandlers?.onAudioChunk,
    onTextUpdate: config.yourEventHandlers?.onTextUpdate,
  });

  // 设置标准事件处理器
  if (config.eventHandlers) {
    Object.entries(config.eventHandlers).forEach(([eventType, handler]) => {
      if (handler) {
        const normalizedEventType = this.normalizeEventType(eventType);
        eventProcessor.on(normalizedEventType, handler);
      }
    });
  }

  // 创建对话实例
  const conversation = await Conversation.startSession({
    url: config.url,
    audioConfig: config.audioConfig,
    eventProcessor,
    onSendEvent: config.onSendEvent
  });

  // 设置音频处理回调
  eventProcessor.setAudioChunkCallback((audioData: string, sequence: number) => {
    conversation.addAudioBase64Chunk(audioData);
  });

  return conversation;
}
```

### 步骤 4: 创建使用示例

```typescript
// src/lib/protocols/YourProtocolExample.ts

import { ConversationFactory } from '../ConversationFactory';

// 使用工厂方法创建您的协议对话
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

// 手动创建方式
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

## 关键设计原则

### 1. 事件转换
- 将协议特定的事件转换为标准格式
- 保持与现有事件处理器的兼容性

### 2. 音频处理
- 确保音频数据能正确传递给 `Conversation`
- 支持音频中断和淡出功能

### 3. 错误处理
- 实现统一的错误处理机制
- 提供有意义的错误信息

### 4. 类型安全
- 使用 TypeScript 确保类型安全
- 定义清晰的接口和类型

## 测试指南

### 1. 单元测试
```typescript
// 测试事件处理器
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

### 2. 集成测试
```typescript
// 测试完整流程
describe('YourProtocol Integration', () => {
  it('should create conversation with your protocol', async () => {
    const conversation = await createYourProtocolConversation();
    expect(conversation).toBeDefined();
    expect(conversation.getConnectionStatus()).toBe(true);
  });
});
```

## 最佳实践

1. **保持一致性**: 遵循现有的命名约定和代码风格
2. **文档化**: 为每个协议提供详细的使用文档
3. **向后兼容**: 确保新协议不影响现有功能
4. **性能考虑**: 避免在事件处理中进行耗时操作
5. **错误恢复**: 实现适当的错误恢复机制

## 常见问题

### Q: 如何处理协议版本升级？
A: 在事件处理器中添加版本检测和兼容性处理逻辑。

### Q: 如何支持不同的音频格式？
A: 在音频处理回调中进行格式转换，或扩展 `AudioConfig` 接口。

### Q: 如何实现协议特定的认证？
A: 在工厂方法中添加认证配置参数，在 WebSocket 连接建立前处理认证。

## 总结

通过遵循这个指南，您可以轻松地为应用添加新的协议支持，同时保持代码的可维护性和扩展性。每个新协议都是独立的模块，不会影响现有的功能。 