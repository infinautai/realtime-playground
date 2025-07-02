// Basic type definitions
export type Modality = "text" | "audio";
export type AudioFormat = "pcm16" | "g711_ulaw" | "g711_alaw";
export type ItemType = "message" | "function_call" | "function_call_output";
export type ItemRole = "user" | "assistant" | "system";
export type ItemStatus = "completed" | "in_progress" | "incomplete";
export type ResponseStatus = "completed" | "cancelled" | "failed" | "incomplete";
export type ContentType = "text" | "audio" | "input_text" | "input_audio";


export interface InputAudioTranscription {
  model?: string;
  language?: string;
  prompt?: string;
}

export interface TurnDetection {
  type?: "server_vad";
  threshold?: number;
  prefix_padding_ms?: number;
  silence_duration_ms?: number;
}

export interface SessionProperties {
  modalities?: Modality[];
  instructions?: string;
  input_audio_format?: AudioFormat;
  output_audio_format?: AudioFormat;
  input_audio_transcription?: InputAudioTranscription;
  turn_detection?: TurnDetection | boolean;
  tools?: any[];
  tool_choice?: "auto" | "none" | "required";
  temperature?: number;
  max_response_output_tokens?: number | "inf";
}

export interface RealtimeError {
  type: string;
  code?: string;
  message: string;
  param?: string;
  event_id?: string;
}

export interface ItemContent {
  type: ContentType;
  text?: string;
  audio?: string;  // base64 encoded audio
  transcript?: string;
}

export interface ConversationItem {
  id: string;
  object?: "realtime.item";
  type: ItemType;
  status?: ItemStatus;
  role?: ItemRole;
  content?: ItemContent[];
  call_id?: string;
  name?: string;
  arguments?: string;
  output?: string;
}

// Conversation
export interface RealtimeConversation {
  id: string;
  object: "realtime.conversation";
}

// Status details
export interface StatusDetails {
  reason: string;
  type?: ResponseStatus;
  error?: Record<string, any>;
}

// Inbound response properties
export interface InboundResponseProperties {
  conversation?: "auto" | "none";
  metadata?: Record<string, any>;
  input?: ConversationItem[];
  modalities?: Modality[];
  instructions?: string;
  voice?: string;
  output_audio_format?: AudioFormat;
  tools?: any[];
  tool_choice?: "auto" | "none" | "required";
  temperature?: number;
  max_response_output_tokens?: number | "inf";
}

// Outbound response properties
export interface OutboundResponseProperties {
  id: string;
  conversation_id?: string;
  max_output_tokens?: number | "inf";
  metadata?: Record<string, any>;
  modalities?: Modality[];
  object: "realtime.response";
  output?: ConversationItem[];
  output_audio_format?: AudioFormat;
  status?: ResponseStatus;
  status_details?: StatusDetails;
  temperature?: number;
  usage?: Record<string, any>;
  voice?: string;
}

// Base event interface
interface BaseEvent {
  event_id: string;
  type: string;
}

// Client events
export interface SessionUpdateEvent extends BaseEvent {
  type: "session.update";
  session: SessionProperties;
}

export interface InputAudioBufferAppendEvent extends BaseEvent {
  type: "input_audio_buffer.append";
  audio: string;  // base64 encoded audio
}

export interface InputAudioBufferCommitEvent extends BaseEvent {
  type: "input_audio_buffer.commit";
}

export interface InputAudioBufferClearEvent extends BaseEvent {
  type: "input_audio_buffer.clear";
}

export interface ConversationItemCreateEvent extends BaseEvent {
  type: "conversation.item.create";
  previous_item_id?: string;
  item: ConversationItem;
}

export interface ConversationItemTruncateEvent extends BaseEvent {
  type: "conversation.item.truncate";
  item_id: string;
  content_index: number;
  audio_end_ms: number;
}

export interface ConversationItemDeleteEvent extends BaseEvent {
  type: "conversation.item.delete";
  item_id: string;
}

export interface ConversationItemRetrieveEvent extends BaseEvent {
  type: "conversation.item.retrieve";
  item_id: string;
}

export interface ResponseCreateEvent extends BaseEvent {
  type: "response.create";
  response?: InboundResponseProperties;
}

export interface ResponseCancelEvent extends BaseEvent {
  type: "response.cancel";
  response_id?: string;
}

// Server events
export interface SessionCreatedEvent extends BaseEvent {
  type: "session.created";
  session: SessionProperties;
}

export interface SessionUpdatedEvent extends BaseEvent {
  type: "session.updated";
  session: SessionProperties;
}

export interface ConversationCreatedEvent extends BaseEvent {
  type: "conversation.created";
  conversation: RealtimeConversation;
}

export interface ConversationItemCreatedEvent extends BaseEvent {
  type: "conversation.item.created";
  previous_item_id?: string;
  item: ConversationItem;
}

export interface ConversationItemInputAudioTranscriptionDeltaEvent extends BaseEvent {
  type: "conversation.item.input_audio_transcription.delta";
  item_id: string;
  content_index: number;
  delta: string;
}

export interface ConversationItemInputAudioTranscriptionCompletedEvent extends BaseEvent {
  type: "conversation.item.input_audio_transcription.completed";
  item_id: string;
  content_index: number;
  transcript: string;
}

export interface ConversationItemInputAudioTranscriptionFailedEvent extends BaseEvent {
  type: "conversation.item.input_audio_transcription.failed";
  item_id: string;
  content_index: number;
  error: RealtimeError;
}

export interface ConversationItemTruncatedEvent extends BaseEvent {
  type: "conversation.item.truncated";
  item_id: string;
  content_index: number;
  audio_end_ms: number;
}

export interface ConversationItemDeletedEvent extends BaseEvent {
  type: "conversation.item.deleted";
  item_id: string;
}

export interface ConversationItemRetrievedEvent extends BaseEvent {
  type: "conversation.item.retrieved";
  item: ConversationItem;
}

export interface ResponseCreatedEvent extends BaseEvent {
  type: "response.created";
  response: OutboundResponseProperties;
}

export interface ResponseDoneEvent extends BaseEvent {
  type: "response.done";
  response: OutboundResponseProperties;
}

export interface ResponseOutputItemAddedEvent extends BaseEvent {
  type: "response.output_item.added";
  response_id: string;
  output_index: number;
  item: ConversationItem;
}

export interface ResponseOutputItemDoneEvent extends BaseEvent {
  type: "response.output_item.done";
  response_id: string;
  output_index: number;
  item: ConversationItem;
}

export interface ResponseTextDeltaEvent extends BaseEvent {
  type: "response.text.delta";
  response_id: string;
  item_id: string;
  output_index: number;
  content_index: number;
  delta: string;
}

export interface ResponseTextDoneEvent extends BaseEvent {
  type: "response.text.done";
  response_id: string;
  item_id: string;
  output_index: number;
  content_index: number;
  text: string;
}

export interface ResponseAudioTranscriptDeltaEvent extends BaseEvent {
  type: "response.audio_transcript.delta";
  response_id: string;
  item_id: string;
  output_index: number;
  content_index: number;
  delta: string;
}

export interface ResponseAudioTranscriptDoneEvent extends BaseEvent {
  type: "response.audio_transcript.done";
  response_id: string;
  item_id: string;
  output_index: number;
  content_index: number;
  transcript: string;
}

export interface ResponseAudioDeltaEvent extends BaseEvent {
  type: "response.audio.delta";
  response_id: string;
  item_id: string;
  output_index: number;
  content_index: number;
  delta: string;  // base64 encoded audio
}

export interface ResponseAudioCancelEvent extends BaseEvent {
  type: "response.audio.cancel";
  response_id: string;
  item_id: string;
}

export interface ResponseAudioDoneEvent extends BaseEvent {
  type: "response.audio.done";
  response_id: string;
  item_id: string;
  output_index: number;
  content_index: number;
}

export interface ResponseFunctionCallArgumentsDeltaEvent extends BaseEvent {
  type: "response.function_call_arguments.delta";
  response_id: string;
  item_id: string;
  output_index: number;
  call_id: string;
  delta: string;
}

export interface ResponseFunctionCallArgumentsDoneEvent extends BaseEvent {
  type: "response.function_call_arguments.done";
  response_id: string;
  item_id: string;
  output_index: number;
  call_id: string;
  arguments: string;
}

export interface InputAudioBufferSpeechStartedEvent extends BaseEvent {
  type: "input_audio_buffer.speech_started";
  audio_start_ms: number;
  item_id: string;
}

export interface InputAudioBufferSpeechStoppedEvent extends BaseEvent {
  type: "input_audio_buffer.speech_stopped";
  audio_end_ms: number;
  item_id: string;
}

export interface InputAudioBufferCommittedEvent extends BaseEvent {
  type: "input_audio_buffer.committed";
}

export interface InputAudioBufferClearedEvent extends BaseEvent {
  type: "input_audio_buffer.cleared";
}

export interface ErrorEvent extends BaseEvent {
  type: "error";
  error: RealtimeError;
}

// Client event types union
export type ClientEventType =
  | SessionUpdateEvent
  | InputAudioBufferAppendEvent
  | InputAudioBufferCommitEvent
  | InputAudioBufferClearEvent
  | ConversationItemCreateEvent
  | ConversationItemTruncateEvent
  | ConversationItemDeleteEvent
  | ConversationItemRetrieveEvent
  | ResponseCreateEvent
  | ResponseCancelEvent;

// Server event types union
export type ServerEventType =
  | { type: "connected" }
  | { type: "disconnected" }
  | SessionCreatedEvent
  | SessionUpdatedEvent
  | ConversationCreatedEvent
  | ConversationItemCreatedEvent
  | ConversationItemInputAudioTranscriptionDeltaEvent
  | ConversationItemInputAudioTranscriptionCompletedEvent
  | ConversationItemInputAudioTranscriptionFailedEvent
  | ConversationItemTruncatedEvent
  | ConversationItemDeletedEvent
  | ConversationItemRetrievedEvent
  | ResponseCreatedEvent
  | ResponseDoneEvent
  | ResponseOutputItemAddedEvent
  | ResponseOutputItemDoneEvent
  | ResponseTextDeltaEvent
  | ResponseTextDoneEvent
  | ResponseAudioTranscriptDeltaEvent
  | ResponseAudioTranscriptDoneEvent
  | ResponseAudioDeltaEvent
  | ResponseAudioDoneEvent
  | ResponseFunctionCallArgumentsDeltaEvent
  | ResponseFunctionCallArgumentsDoneEvent
  | InputAudioBufferSpeechStartedEvent
  | InputAudioBufferSpeechStoppedEvent
  | InputAudioBufferCommittedEvent
  | InputAudioBufferClearedEvent
  | ErrorEvent;

