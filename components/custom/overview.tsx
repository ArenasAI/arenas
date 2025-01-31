import { motion } from 'framer-motion';
import Link from 'next/link';

import { MessageIcon, SupabaseIcon, VercelIcon } from './icons';

export const Overview = () => {
  return (
    <motion.div
      key="overview"
      className="max-w-3xl mx-auto md:mt-20"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ delay: 0.5 }}
    >
      <div className="rounded-xl p-6 flex flex-col gap-8 leading-relaxed text-center max-w-xl">
        <h1 className="flex flex-row text-2xl justify-center gap-4 items-center">
        welcome to arenas, what would you like to work on?
        </h1>
      </div>
    </motion.div>
  );
};