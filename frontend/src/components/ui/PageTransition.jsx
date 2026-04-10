import { motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';

const variants = {
  initial:  { opacity: 0, y: 12 },
  animate:  { opacity: 1, y: 0 },
  exit:     { opacity: 0, y: -8 },
};

const transition = {
  type: 'tween',
  ease: [0.22, 1, 0.36, 1],
  duration: 0.22,
};

export default function PageTransition({ children }) {
  const { pathname } = useLocation();
  return (
    <motion.div
      key={pathname}
      variants={variants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={transition}
      style={{ width: '100%' }}
    >
      {children}
    </motion.div>
  );
}
