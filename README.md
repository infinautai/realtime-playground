# Realtime(OpenAI realtime Beta) voice playground

A real-time voice conversation application with AI-powered transcription and response capabilities. Built with Next.js, TypeScript, and WebSocket technology for seamless voice interactions.

## Project Purpose

In the past half year, omni-modal models and speech-to-speech models such as Qwen Omni, Ming-Omni, and Qwen Audio have been released one after another, highlighting that omni-modal models are currently a major focus in AI research. However, there is still a lack of open-source tools for real-time API interaction. This project is inspired by the OpenAI realtime API and playground, and aims to provide an open-source version of a realtime playground. We hope this tool can help accelerate the adoption and development of these advanced models in the community.

## Features

### 🎤 Real-time Voice Conversation
- **Live Voice Input**: Speak naturally and see your words transcribed in real-time
- **AI Responses**: Get intelligent, contextual responses from AI models
- **Voice Output**: Listen to AI responses with natural-sounding speech synthesis
- **Interruption Support**: Seamlessly interrupt and restart conversations

### 🎛️ Advanced Audio Controls
- **Volume Control**: Adjust audio output volume with real-time controls
- **Mute Functionality**: Toggle microphone on/off during conversations
- **Audio Waveform Visualization**: See real-time audio input levels
- **Noise Reduction**: Multiple noise reduction options for better audio quality

### ⚙️ Configurable Settings
- **Voice Selection**: Choose from multiple AI voice options (Coral, etc.)
- **Turn Detection**: Configurable speech detection sensitivity
- **Model Selection**: Support for different AI models (qwen2.5-omni-3b, etc.)
- **Transcription Models**: Multiple transcription model options (whisper-large, etc.)
- **System Instructions**: Customizable AI personality and behavior

### 🔧 Developer Features
- **Event Logging**: Real-time event monitoring and debugging
- **WebSocket Protocol**: Robust real-time communication
- **Modular Architecture**: Extensible event processor system
- **TypeScript Support**: Full type safety and IntelliSense

## Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS, Radix UI Components
- **Audio**: Web Audio API, Audio Worklets
- **Real-time**: WebSocket, Event-driven Architecture
- **AI**: Integration with real-time API services
- **Icons**: React Icons, Lucide React

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or pnpm

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd voice-transcription-app
```

2. Install dependencies:
```bash
npm install
# or
pnpm install
```

3. Start the development server:
```bash
npm run dev
# or
pnpm dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Configuration

1. **Set up your API endpoint** in the settings panel
2. **Configure audio settings** for your microphone and speakers
3. **Adjust turn detection** sensitivity based on your environment
4. **Customize system instructions** to define AI behavior

## Usage

### Basic Conversation
1. Click the microphone button to start recording
2. Speak naturally - your words will appear as you talk
3. The AI will respond with both text and voice
4. Use the mute button to pause your input

### Advanced Features
- **Settings Panel**: Access via the gear icon to configure all options
- **Event Logs**: View real-time events and debugging information
- **Clear Conversation**: Reset the conversation history
- **Volume Control**: Adjust audio output levels

## Architecture

The application uses a modular, event-driven architecture:

```
┌─────────────────┐    ┌─────────────────────┐    ┌─────────────────┐
│ React Components│───▶│ ConversationFactory │───▶│ Conversation    │
└─────────────────┘    └─────────────────────┘    └─────────────────┘
                                │                         │
                                ▼                         ▼
                       ┌─────────────────┐    ┌─────────────────────┐
                       │ EventProcessor  │    │ Audio Processing    │
                       └─────────────────┘    └─────────────────────┘
```

### Key Components
- **Conversation**: Manages WebSocket connections and audio processing
- **EventProcessor**: Handles real-time event processing and routing
- **ConversationFactory**: Creates and configures conversation instances
- **Audio Worklets**: Process audio data in real-time

## Development

### Project Structure
```
src/
├── app/                 # Next.js app directory
├── components/          # React components
│   ├── ui/             # Reusable UI components
│   └── ...             # Feature-specific components
├── hooks/              # Custom React hooks
├── lib/                # Core library code
│   ├── protocols/      # Protocol implementations
│   └── ...             # Utility functions
├── types/              # TypeScript type definitions
└── ...
```

### Available Scripts
- `npm run dev` - Start development server
- `