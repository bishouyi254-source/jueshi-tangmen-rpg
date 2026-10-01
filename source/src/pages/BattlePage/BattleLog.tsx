import { memo } from 'react';
import { RING_DISPLAY_COLOR } from '@/lib/gameStore';

interface BattleLogProps {
  logs: Array<{ id: number; text: string; type: string }>;
}

function BattleLog({ logs }: BattleLogProps) {
  return (
    <>
      {logs.length === 0 ? (
        <div className="text-muted-foreground/60 text-center py-2">战斗开始...</div>
      ) : logs.map((log) => (
        <div
          key={log.id}
          className={`leading-tight ${
            log.type === 'damage' ? 'text-red-400' :
            log.type === 'heal' ? 'text-emerald-400' :
            log.type === 'skill' ? 'text-cyan-400' :
            log.type === 'system' ? 'text-cyan-300 font-medium' :
            'text-cyan-300'
          }`}
        >
          {log.text}
        </div>
      ))}
    </>
  );
}

export default memo(BattleLog);
