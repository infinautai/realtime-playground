import { useState } from 'react';
import { Log } from '@/app/page';

interface LogsDrawerProps {
  logs: Log[];
}

export const LogsDrawer: React.FC<LogsDrawerProps> = ({ logs }) => {
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  const toggle = (idx: number) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(idx)) {
        next.delete(idx);
      } else {
        next.add(idx);
      }
      return next;
    });
  };

  return (
    <div className="h-[calc(100vh-130px)] flex flex-col">
      <div className="flex-1 overflow-y-auto p-4">
        <div className="flex flex-col-reverse space-y-reverse space-y-1">
          {logs.map((log, index) => (
            <div
              key={`${log.timestamp}-${index}`}
              className="p-2 bg-muted/50 rounded-lg cursor-pointer select-none hover:bg-muted/80"
              onClick={() => toggle(index)}
            >
              <div className="group flex items-center justify-between mb-1 space-x-2">
                <span className={`text-sm ${
                    log.direction === '↑' ? 'text-blue-600' : 'text-green-600'
                  }`}>
                    {log.direction}
                </span>
                <span className="flex-1 text-sm font-normal overflow-hidden text-ellipsis group-hover:overflow-visible">
                  {log.event}
                </span> 
                <span className="text-xs font-light text-muted-foreground group-hover:hidden">
                  {new Date(log.timestamp).toLocaleTimeString('en-US', {
                    hour12: false,
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    fractionalSecondDigits: 3
                  })}
                </span>
              </div>
              {log.details && expanded.has(index) && (
                <pre className="mt-2 text-xs text-muted-foreground bg-muted/50 p-2 rounded overflow-x-auto">
                  {JSON.stringify(log.details, null, 2)}
                </pre>
              )}
              {log.details && !expanded.has(index) }
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}; 