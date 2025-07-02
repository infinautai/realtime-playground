import { Card, CardContent } from "@/components/ui/card"
import { motion } from "framer-motion"

interface MessageProps {
  content: string;
  timestamp: string;
  type: 'user' | 'assistant';
}

export function Message({ content, timestamp, type }: MessageProps) {
  const isUser = type === 'user';
  const isSpeaking = isUser && content === '';

  const messageVariants = {
    hidden: { 
      opacity: 0,
      y: isUser ? 20 : -20,
      x: isUser ? 20 : -20
    },
    visible: { 
      opacity: 1,
      y: 0,
      x: 0,
      transition: {
        duration: 0.3,
        ease: "easeOut"
      }
    }
  };

  return (
    <motion.div 
      className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} gap-1`}
      initial="hidden"
      animate="visible"
      variants={messageVariants}
    >
      <div className={`flex items-center gap-2 mb-1 ${isUser ? 'justify-end' : 'justify-start'}`}> 
        <span className="text-xs text-muted-foreground">{isUser ? 'USER' : 'ASSISTANT'}</span>
        <span className="text-[10px] text-muted-foreground/70">{timestamp}</span>
      </div>
      <Card
        className={`px-4 py-2 rounded-lg border-0 shadow-sm max-w-[90%] ${
          isUser
            ? 'bg-primary/5 text-primary border-r-2 border-primary'
            : 'bg-muted/50 text-muted-foreground border-l-2 border-primary'
        }`}
      >
        <CardContent className="p-0">
          {isSpeaking ? (
            <div className="flex items-center gap-1">
              <span className="animate-bounce">•</span>
              <span className="animate-bounce delay-100">•</span>
              <span className="animate-bounce delay-200">•</span>
            </div>
          ) : (
            <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">{content}</p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
} 