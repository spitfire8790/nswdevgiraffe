import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Building2, Database, Shield, Zap, CheckCircle, Info } from 'lucide-react';

const FloatingShape = ({ delay = 0, duration = 8, size = 'w-4 h-4', color = 'bg-blue-500' }) => (
  <motion.div
    className={`${size} ${color} rounded-full absolute opacity-20 blur-sm`}
    animate={{
      x: [0, 100, 0],
      y: [0, -100, 0],
      rotate: [0, 180, 360],
    }}
    transition={{
      duration,
      delay,
      repeat: Infinity,
      ease: "easeInOut"
    }}
    style={{
      left: `${Math.random() * 80}%`,
      top: `${Math.random() * 80}%`,
    }}
  />
);

const Particle = ({ delay = 0 }) => (
  <motion.div
    className="w-1 h-1 bg-blue-400 rounded-full absolute opacity-60"
    animate={{
      y: [0, -800],
      x: [0, Math.random() * 100 - 50],
      opacity: [0, 1, 0],
    }}
    transition={{
      duration: Math.random() * 10 + 10,
      delay,
      repeat: Infinity,
      ease: "linear"
    }}
    style={{
      left: `${Math.random() * 100}%`,
      bottom: '-10px',
    }}
  />
);

const EnhancedLandingPage = ({ tooltipContent }) => {
  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 animate-gradient-shift bg-[length:400%_400%]" />
      
      {/* Floating Shapes */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(8)].map((_, i) => (
          <FloatingShape
            key={i}
            delay={i * 0.5}
            duration={8 + i}
            size={i % 3 === 0 ? 'w-6 h-6' : 'w-4 h-4'}
            color={i % 2 === 0 ? 'bg-blue-500' : 'bg-purple-500'}
          />
        ))}
      </div>

      {/* Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <Particle key={i} delay={i * 0.5} />
        ))}
      </div>

      {/* Main Content */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 py-12">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center mb-16"
        >
          {/* Animated Logo */}
          <motion.div
            className="w-24 h-24 mx-auto mb-8 relative"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <div className="relative z-10 w-full h-full bg-white rounded-3xl flex items-center justify-center shadow-depth">
              <Building2 className="w-12 h-12 text-blue-600" />
            </div>
          </motion.div>

          {/* Title with Gradient Text */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-6xl md:text-7xl font-bold mb-6"
          >
            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent animate-gradient-shift bg-[length:200%_200%]">
              NSW Development
            </span>
            <br />
            <span className="text-gray-900">Applications</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto mb-12 leading-relaxed"
          >
            Select a Local Government Area above to begin. 
          </motion.p>
        </motion.div>

        {/* Enhanced About Section */}
        {tooltipContent?.deduplicationInfo && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="max-w-4xl mx-auto"
          >
            {/* Compact Main Card */}
            <div className="relative bg-white/80 backdrop-blur-xl rounded-2xl shadow-depth border border-white/30 overflow-hidden">
              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/3 via-purple-500/3 to-indigo-500/3" />
              
              {/* Compact Header */}
              <div className="relative z-10 px-6 pt-6 pb-4 text-center">
                <motion.div
                  className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-glow mx-auto mb-3"
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.3 }}
                >
                  <Info className="w-6 h-6 text-white" />
                </motion.div>
                <h3 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {tooltipContent.deduplicationInfo.title}
                </h3>
              </div>

              {/* Compact Content Sections */}
              <div className="relative z-10 px-6 pb-6">
                {(() => {
                  const content = tooltipContent.deduplicationInfo.content;
                  const sections = content.split('\n\n').filter(section => section.trim());
                  
                  return sections.map((section, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -15 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5, delay: 0.7 + (index * 0.1) }}
                      className={`flex items-center gap-3 ${index > 0 ? 'mt-4' : ''}`}
                    >
                      <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-sm">
                        <CheckCircle className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="text-gray-700 leading-relaxed text-sm">
                          {section.trim()}
                        </p>
                      </div>
                    </motion.div>
                  ));
                })()}

                {/* Compact Source Section */}
                {tooltipContent.deduplicationInfo.source && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 1.0 }}
                    className="mt-5 pt-4 border-t border-gray-200/50"
                  >
                    <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                      <Database className="w-3 h-3 text-blue-500" />
                      <span>{tooltipContent.deduplicationInfo.source}</span>
                      <span>•</span>
                      <a 
                        href={tooltipContent.deduplicationInfo.sourceLink} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-blue-600 hover:text-blue-700 hover:underline transition-colors"
                      >
                        View source
                      </a>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default EnhancedLandingPage; 