import { motion } from 'framer-motion';
import { SPIRIT_ELEMENT_COLORS } from '@/data/soulSpirits';

interface SoulSpiritAvatarProps {
  iconChar: string;
  attribute: string;
  size?: 'sm' | 'md' | 'lg';
  animate?: boolean;
}

export default function SoulSpiritAvatar({ iconChar, attribute, size = 'md', animate = true }: SoulSpiritAvatarProps) {
  const colors = SPIRIT_ELEMENT_COLORS[attribute] || SPIRIT_ELEMENT_COLORS['金'];
  const sizeClass = size === 'sm' ? 'w-10 h-10 text-lg' : size === 'lg' ? 'w-16 h-16 text-2xl' : 'w-12 h-12 text-xl';

  return (
    <motion.div
      initial={animate ? { scale: 0.8, opacity: 0 } : false}
      animate={animate ? { scale: 1, opacity: 1 } : {}}
      transition={{ type: 'spring', stiffness: 200, damping: 15 }}
      className={`relative ${sizeClass} rounded-xl ${colors.bg} ${colors.border} border-2 flex items-center justify-center font-bold ${colors.text} shadow-lg ${colors.glow}`}
    >
      {iconChar}
      {animate && (
        <motion.div
          className={`absolute inset-0 rounded-xl ${colors.border} border-2 opacity-0`}
          animate={{ opacity: [0, 0.5, 0], scale: [1, 1.3, 1.5] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
        />
      )}
    </motion.div>
  );
}
