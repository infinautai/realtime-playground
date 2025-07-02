import { useState, useRef, useEffect } from 'react';
import { FaMicrophone } from 'react-icons/fa';
import { IoClose } from 'react-icons/io5';
import { BsKeyboard } from 'react-icons/bs';
import { BiMicrophoneOff } from 'react-icons/bi';
import { AudioWaveform } from './AudioWaveform';
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isConnected: boolean;
  onConnect: (url: string) => Promise<void>;
  onDisconnect: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  isSpeaking: boolean;
}

export const ChatInput = ({
  onSendMessage,
  isConnected,
  onConnect,
  onDisconnect,
  isMuted,
  onToggleMute,
  isSpeaking,
}: ChatInputProps) => {
  const { toast } = useToast();
  const [isConnecting, setIsConnecting] = useState(false);
  const [message, setMessage] = useState('');
  const [audioTime, setAudioTime] = useState('00:00');
  const [showInput, setShowInput] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const [url, setUrl] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('apiUrl') || 'ws://localhost:7860/realtime';
    }
    return 'ws://localhost:7860/realtime';
  });

  useEffect(() => {
    if (isConnected) {
      startTimeRef.current = Date.now();
      timerRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        const minutes = Math.floor(elapsed / 60).toString().padStart(2, '0');
        const seconds = (elapsed % 60).toString().padStart(2, '0');
        setAudioTime(`${minutes}:${seconds}`);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      setAudioTime('00:00');
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isConnected]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      onSendMessage(message);
      setMessage('');
    }
  };

  const toggleInput = () => {
    setShowInput(!showInput);
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUrl = e.target.value;
    setUrl(newUrl);
    localStorage.setItem('apiUrl', newUrl);
  };

  const handleConnect = async () => {
    try {
      setIsConnecting(true);
      await onConnect(url);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Connection failed",
        description: error instanceof Error ? error.message : "Failed to connect to server"
      });
    } finally {
      setIsConnecting(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="p-4 mx-auto">
        <div className="bg-card rounded-2xl shadow-lg">
          <div className="flex items-center justify-between px-4 py-2  mt-2">
            <div className="flex flex-row items-center gap-2">
              <Button
                onClick={handleConnect}
                className="flex items-center gap-2"
                variant="outline"
                disabled={isConnecting}
              >
                <FaMicrophone className="w-5 h-5" />
                {isConnecting ? 'Connecting...' : 'Start Session'}
              </Button>
              <Input
                type="text"
                value={url}
                onChange={handleUrlChange}
                placeholder="URL of realtime api"
                className="min-w-[300px]"
                disabled={isConnecting}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 mx-auto min-w-[600px]">
      <form onSubmit={handleSubmit}>
        <div className="bg-card rounded-2xl shadow-lg">
          {showInput && (
            <div className="px-4 pt-6">
              <Input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Enter your message..."
                className="w-full"
              />
            </div>
          )}
          
          <div className="flex items-center justify-between px-4 py-2 mt-2">
            <div className="flex items-center gap-2">
              {isConnected && (
                <>
                  <span className="text-sm font-mono text-muted-foreground">{audioTime}</span>
                  <AudioWaveform isRecording={isConnected && !isMuted} isSpeaking={isSpeaking} />
                </>
              )}
            </div>
            <div className="flex items-center gap-2">
              {isConnected && (
                <Button
                  type="button"
                  onClick={onToggleMute}
                  variant="ghost"
                  size="icon"
                  className={isMuted ? 'text-destructive' : ''}
                >
                  {isMuted ? <BiMicrophoneOff className="w-5 h-5" /> : <FaMicrophone className="w-5 h-5" />}
                </Button>
              )}
              <Button
                type="button"
                onClick={toggleInput}
                variant="ghost"
                size="icon"
              >
                <BsKeyboard className="w-5 h-5" />
              </Button>
              <Button
                type="button"
                onClick={onDisconnect}
                variant="ghost"
                size="icon"
              >
                <IoClose className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}; 