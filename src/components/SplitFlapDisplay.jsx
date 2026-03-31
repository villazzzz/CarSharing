import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export function SplitFlapDisplay({ value, label }) {
  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    setDisplayValue(value);
  }, [value]);

  const chars = String(displayValue).padStart(2, '0').split(''); // ensure at least 2 digits

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex gap-1" aria-hidden="true">
        {chars.map((char, i) => (
          <div key={i} className="split-flap-card w-8 h-12 text-2xl md:w-12 md:h-16 md:text-4xl rounded-sm">
            <span className="split-flap-divider"></span>
            
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.div
                key={`${i}-${char}`}
                initial={{ rotateX: -90, opacity: 0 }}
                animate={{ rotateX: 0, opacity: 1 }}
                exit={{ rotateX: 90, opacity: 0 }}
                transition={{ duration: 0.3, type: "spring", stiffness: 100 }}
                className="absolute inset-0 flex items-center justify-center transform-origin-bottom"
                style={{ transformOrigin: "bottom" }}
              >
                {char}
              </motion.div>
            </AnimatePresence>
            {/* Base static character underneath for smooth effect */}
            <div className="absolute inset-0 flex items-center justify-center opacity-30">{char}</div>
          </div>
        ))}
      </div>
      <span className="text-xs md:text-sm text-gray-400 font-bold uppercase tracking-wider">{label}</span>
      <span className="sr-only">{label}: {displayValue}</span>
    </div>
  );
}
