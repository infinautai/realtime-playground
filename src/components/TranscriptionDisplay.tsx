interface TranscriptionDisplayProps {
  transcription: string;
  isRecording: boolean;
}

export const TranscriptionDisplay = ({ transcription, isRecording }: TranscriptionDisplayProps) => {
  return (
    <div className="flex-1 bg-card rounded-lg shadow-lg p-6 min-h-[400px] relative">
      {!transcription && !isRecording && (
        <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
          Conversation will appear here
        </div>
      )}
      {(transcription || isRecording) && (
        <div className="space-y-4">
          <div className="text-foreground leading-relaxed">
            {transcription}
            {isRecording && (
              <span className="inline-block w-2 h-4 bg-primary ml-1 animate-pulse" />
            )}
          </div>
        </div>
      )}
    </div>
  );
}; 