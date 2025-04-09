"use client"

import { motion } from "framer-motion"

export default function AnimatedDevLogo() {
  const buildingAnimation = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: 0.5,
        ease: "easeOut"
      }
    }
  }

  const roofAnimation = {
    hidden: { pathLength: 0, opacity: 0 },
    visible: { 
      pathLength: 1,
      opacity: 1,
      transition: { 
        duration: 0.8, 
        ease: "easeInOut",
        delay: 0.2
      }
    }
  }

  const windowAnimation = {
    hidden: { scale: 0, opacity: 0 },
    visible: { 
      scale: 1,
      opacity: 1,
      transition: { 
        duration: 0.4, 
        ease: "easeOut" 
      }
    }
  }

  const pulseAnimation = {
    hidden: { opacity: 0.7 },
    visible: {
      opacity: 1,
      transition: {
        repeat: Infinity,
        repeatType: "reverse",
        duration: 1.5
      }
    }
  }

  return (
    <div className="w-12 h-12 flex items-center justify-center">
      <motion.svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        className="w-12 h-12 text-blue-600"
        initial="hidden"
        animate="visible"
      >
        <motion.g
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 1 },
            visible: {
              opacity: 1,
              transition: {
                staggerChildren: 0.3,
                delayChildren: 0.1
              }
            }
          }}
        >
          {/* Shadow/Ground */}
          <motion.ellipse cx="12" cy="23" rx="10" ry="1" fill="currentColor" opacity="0.1" variants={pulseAnimation} />
          
          {/* Foundation */}
          <motion.rect x="2" y="22" width="20" height="1" fill="currentColor" variants={buildingAnimation} />
          
          {/* Left wall */}
          <motion.rect x="2" y="12" width="2" height="10" fill="currentColor" variants={buildingAnimation} />
          
          {/* Right wall */}
          <motion.rect x="20" y="12" width="2" height="10" fill="currentColor" variants={buildingAnimation} />
          
          {/* Roof */}
          <motion.path
            d="M2 12L12 2L22 12"
            stroke="currentColor"
            strokeWidth="2"
            fill="none"
            variants={roofAnimation}
          />
          
          {/* Door */}
          <motion.rect x="10" y="16" width="4" height="6" rx="0.5" fill="currentColor" variants={buildingAnimation} />
          
          {/* Windows */}
          <motion.rect x="5" y="14" width="3" height="3" rx="0.5" fill="currentColor" variants={windowAnimation} />
          <motion.rect x="16" y="14" width="3" height="3" rx="0.5" fill="currentColor" variants={windowAnimation} />
          
          {/* Decoration */}
          <motion.rect x="11" y="17" width="2" height="1" fill="white" opacity="0.5" variants={windowAnimation} />
          <motion.rect x="5.5" y="15.5" width="2" height="1" fill="white" opacity="0.3" variants={windowAnimation} />
          <motion.rect x="16.5" y="15.5" width="2" height="1" fill="white" opacity="0.3" variants={windowAnimation} />
        </motion.g>
      </motion.svg>
    </div>
  )
}