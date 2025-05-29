"use client"

import { motion } from "framer-motion"

export default function AnimatedDevLogo() {
  const buildingAnimation = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: 0.8,
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
        duration: 1.2, 
        ease: "easeInOut",
        delay: 0.3
      }
    }
  }

  const windowAnimation = {
    hidden: { scale: 0, opacity: 0 },
    visible: { 
      scale: 1,
      opacity: 1,
      transition: { 
        duration: 0.6, 
        ease: "easeOut",
        delay: 0.8
      }
    }
  }

  const pulseAnimation = {
    hidden: { opacity: 0.6 },
    visible: {
      opacity: [0.6, 1, 0.6],
      scale: [1, 1.05, 1],
      transition: {
        repeat: Infinity,
        duration: 3,
        ease: "easeInOut"
      }
    }
  }

  const glowAnimation = {
    hidden: { opacity: 0 },
    visible: {
      opacity: [0.3, 0.8, 0.3],
      transition: {
        repeat: Infinity,
        duration: 2,
        ease: "easeInOut"
      }
    }
  }

  return (
    <div className="w-12 h-12 flex items-center justify-center relative">
      <motion.svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        className="w-12 h-12 text-blue-600 relative z-10 drop-shadow-lg"
        initial="hidden"
        animate="visible"
        whileHover={{ scale: 1.1, rotate: 5 }}
        transition={{ duration: 0.3 }}
      >
        <motion.g
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 1 },
            visible: {
              opacity: 1,
              transition: {
                staggerChildren: 0.2,
                delayChildren: 0.1
              }
            }
          }}
        >
          {/* Animated shadow/ground with pulse */}
          <motion.ellipse 
            cx="12" 
            cy="23" 
            rx="10" 
            ry="1" 
            fill="currentColor" 
            opacity="0.15" 
            variants={pulseAnimation} 
          />
          
          {/* Foundation with enhanced animation */}
          <motion.rect 
            x="2" 
            y="22" 
            width="20" 
            height="1" 
            fill="currentColor" 
            variants={buildingAnimation}
            whileHover={{ scaleX: 1.05 }}
          />
          
          {/* Left wall with slide animation */}
          <motion.rect 
            x="2" 
            y="12" 
            width="2" 
            height="10" 
            fill="currentColor" 
            variants={{
              hidden: { opacity: 0, x: -10 },
              visible: { 
                opacity: 1, 
                x: 0,
                transition: { duration: 0.6, ease: "easeOut" }
              }
            }}
          />
          
          {/* Right wall with slide animation */}
          <motion.rect 
            x="20" 
            y="12" 
            width="2" 
            height="10" 
            fill="currentColor" 
            variants={{
              hidden: { opacity: 0, x: 10 },
              visible: { 
                opacity: 1, 
                x: 0,
                transition: { duration: 0.6, ease: "easeOut" }
              }
            }}
          />
          
          {/* Enhanced roof with drawing animation */}
          <motion.path
            d="M2 12L12 2L22 12"
            stroke="currentColor"
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            variants={roofAnimation}
            style={{
              filter: "drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1))"
            }}
          />
          
          {/* Enhanced door with scale animation */}
          <motion.rect 
            x="10" 
            y="16" 
            width="4" 
            height="6" 
            rx="0.5" 
            fill="currentColor" 
            variants={buildingAnimation}
            whileHover={{ scale: 1.1 }}
          />
          
          {/* Windows with enhanced animations */}
          <motion.rect 
            x="5" 
            y="14" 
            width="3" 
            height="3" 
            rx="0.5" 
            fill="currentColor" 
            variants={{
              ...windowAnimation,
              visible: {
                ...windowAnimation.visible,
                transition: {
                  ...windowAnimation.visible.transition,
                  delay: 1.0
                }
              }
            }}
            whileHover={{ scale: 1.2, brightness: 1.2 }}
          />
          <motion.rect 
            x="16" 
            y="14" 
            width="3" 
            height="3" 
            rx="0.5" 
            fill="currentColor" 
            variants={{
              ...windowAnimation,
              visible: {
                ...windowAnimation.visible,
                transition: {
                  ...windowAnimation.visible.transition,
                  delay: 1.2
                }
              }
            }}
            whileHover={{ scale: 1.2, brightness: 1.2 }}
          />
          
          {/* Enhanced decorative elements */}
          <motion.rect 
            x="11" 
            y="17" 
            width="2" 
            height="1" 
            fill="white" 
            opacity="0.7" 
            variants={{
              hidden: { opacity: 0, scale: 0 },
              visible: { 
                opacity: 0.7, 
                scale: 1,
                transition: { duration: 0.4, delay: 1.4 }
              }
            }}
          />
          
          {/* Window lights with flicker effect */}
          <motion.rect 
            x="5.5" 
            y="15.5" 
            width="2" 
            height="1" 
            fill="white" 
            variants={{
              hidden: { opacity: 0 },
              visible: { 
                opacity: [0.4, 0.8, 0.4],
                transition: {
                  repeat: Infinity,
                  duration: 4,
                  delay: 1.6,
                  ease: "easeInOut"
                }
              }
            }}
          />
          <motion.rect 
            x="16.5" 
            y="15.5" 
            width="2" 
            height="1" 
            fill="white" 
            variants={{
              hidden: { opacity: 0 },
              visible: { 
                opacity: [0.4, 0.8, 0.4],
                transition: {
                  repeat: Infinity,
                  duration: 4,
                  delay: 2.0,
                  ease: "easeInOut"
                }
              }
            }}
          />
          
          {/* Additional sparkle effects */}
          <motion.circle
            cx="12"
            cy="8"
            r="0.5"
            fill="white"
            opacity="0.6"
            variants={{
              hidden: { scale: 0, opacity: 0 },
              visible: {
                scale: [0, 1, 0],
                opacity: [0, 0.8, 0],
                transition: {
                  repeat: Infinity,
                  duration: 3,
                  delay: 2.5,
                  ease: "easeInOut"
                }
              }
            }}
          />
        </motion.g>
      </motion.svg>
    </div>
  )
}