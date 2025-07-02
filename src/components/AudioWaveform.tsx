import { useEffect, useRef } from 'react';

interface AudioWaveformProps {
  isRecording: boolean;
  isSpeaking: boolean;
}

export const AudioWaveform = ({ isRecording, isSpeaking }: AudioWaveformProps) => {
  const waveformRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>();

  useEffect(() => {
    if (!isRecording || !waveformRef.current) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      return;
    }

    const bars = waveformRef.current.children;
    let frame = 0;

    const animate = () => {
      frame++;
      for (let i = 0; i < bars.length; i++) {
        const bar = bars[i] as HTMLDivElement;
        const height = Math.sin((frame + i * 5) / 10) * 10 + 15;
        bar.style.height = `${height}px`;
      }
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isRecording]);

  return (
    <div 
      ref={waveformRef} 
      className="flex items-center gap-[2px] h-8 px-2"
    >
      {Array.from({ length: 20 }).map((_, i) => (
        <div
          key={i}
          className={`w-[2px] rounded-full transition-all duration-75 ${
            isRecording 
              ? isSpeaking 
                ? 'bg-destructive' 
                : 'bg-primary'
              : 'bg-muted'
          }`}
          style={{
            height: isRecording ? '15px' : '4px',
          }}
        />
      ))}
    </div>
  );
}; 