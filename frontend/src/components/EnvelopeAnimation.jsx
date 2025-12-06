import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

const EnvelopeAnimation = ({ 
  children, 
  onComplete,
  envelopeColor = 'premium', // premium, classic, modern
  autoPlay = false 
}) => {
  const [stage, setStage] = useState('closed'); // closed, opening, opened, hidden
  const [showContent, setShowContent] = useState(false);

  // Color schemes
  const colorSchemes = {
    premium: {
      envelope: 'linear-gradient(135deg, #f5f5dc 0%, #fffef7 100%)',
      border: '#d4af37',
      flap: 'linear-gradient(135deg, #f0e6d2 0%, #f5f5dc 100%)',
      shadow: 'rgba(212, 175, 55, 0.3)'
    },
    classic: {
      envelope: 'linear-gradient(135deg, #ffffff 0%, #f8f8f8 100%)',
      border: '#cccccc',
      flap: 'linear-gradient(135deg, #f0f0f0 0%, #ffffff 100%)',
      shadow: 'rgba(0, 0, 0, 0.15)'
    },
    modern: {
      envelope: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      border: '#ffffff',
      flap: 'linear-gradient(135deg, #5568d3 0%, #667eea 100%)',
      shadow: 'rgba(102, 126, 234, 0.3)'
    }
  };

  const colors = colorSchemes[envelopeColor] || colorSchemes.premium;

  React.useEffect(() => {
    if (autoPlay) {
      setTimeout(() => handleOpenEnvelope(), 500);
    }
  }, [autoPlay]);

  const handleOpenEnvelope = () => {
    setStage('opening');
    
    // First open the flap
    setTimeout(() => {
      setShowContent(true);
    }, 800);

    // Then show the card sliding out
    setTimeout(() => {
      setStage('opened');
    }, 1500);

    // Finally hide envelope completely
    setTimeout(() => {
      setStage('hidden');
      if (onComplete) onComplete();
    }, 2800);
  };

  const handleSkip = () => {
    setStage('hidden');
    setShowContent(true);
    if (onComplete) onComplete();
  };

  if (stage === 'hidden') {
    return <div>{children}</div>;
  }

  return (
    <div 
      className="fixed inset-0 z-50 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center overflow-hidden"
      onClick={(e) => {
        // Prevent any default click behavior that might cause navigation
        e.stopPropagation();
      }}
    >
      {/* Skip Button */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          handleSkip();
        }}
        className="absolute top-8 right-8 text-white/70 hover:text-white transition-colors z-50"
      >
        <X className="h-6 w-6" />
      </motion.button>

      {/* Decorative Elements */}
      <motion.div
        className="absolute inset-0 opacity-10"
        initial={{ rotate: 0 }}
        animate={{ rotate: 360 }}
        transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
      >
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-white rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              opacity: Math.random() * 0.5
            }}
          />
        ))}
      </motion.div>

      {/* Main Envelope Container */}
      <div className="relative" style={{ perspective: '1500px' }}>
        <AnimatePresence>
          {stage !== 'hidden' && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 50 }}
              animate={{ 
                scale: stage === 'opened' ? 0.95 : 1, 
                opacity: stage === 'opened' ? 0 : 1,
                y: stage === 'opened' ? -100 : 0 
              }}
              exit={{ scale: 0.8, opacity: 0, y: -100 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="relative w-[90vw] max-w-[600px] h-[60vw] max-h-[400px]"
              style={{ transformStyle: 'preserve-3d' }}
            >
              {/* Envelope Body */}
              <motion.div
                className="absolute inset-0 rounded-lg shadow-2xl"
                style={{
                  background: colors.envelope,
                  border: `3px solid ${colors.border}`,
                  boxShadow: `0 20px 60px ${colors.shadow}`
                }}
              >
                {/* Premium Border Pattern */}
                <div className="absolute inset-0 rounded-lg overflow-hidden">
                  <div 
                    className="absolute inset-0 opacity-20"
                    style={{
                      backgroundImage: `repeating-linear-gradient(
                        45deg,
                        ${colors.border} 0px,
                        ${colors.border} 1px,
                        transparent 1px,
                        transparent 10px
                      )`
                    }}
                  />
                </div>

                {/* Inner Shadow */}
                <div 
                  className="absolute inset-4 rounded border-2"
                  style={{ 
                    borderColor: colors.border,
                    opacity: 0.3
                  }}
                />

                {/* Center Logo/Seal - CLICKABLE AREA */}
                {stage === 'closed' && (
                  <motion.button
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.3, duration: 0.6, type: "spring" }}
                    onClick={handleOpenEnvelope}
                    onTouchEnd={(e) => {
                      e.preventDefault();
                      handleOpenEnvelope();
                    }}
                    className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 cursor-pointer touch-manipulation"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    style={{
                      WebkitTapHighlightColor: 'transparent',
                      touchAction: 'manipulation'
                    }}
                  >
                    <div 
                      className="w-32 h-32 md:w-40 md:h-40 rounded-full flex items-center justify-center"
                      style={{
                        background: colors.border,
                        boxShadow: `0 4px 20px ${colors.shadow}`
                      }}
                    >
                      <span className="text-5xl md:text-6xl">💌</span>
                    </div>
                    
                    {/* Tap to Open text inside seal */}
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 1, duration: 0.5 }}
                      className="absolute -bottom-14 md:-bottom-16 left-1/2 transform -translate-x-1/2 whitespace-nowrap pointer-events-none"
                    >
                      <p 
                        className="text-sm md:text-lg font-serif italic"
                        style={{ color: colors.border }}
                      >
                        Açmaq üçün toxunun
                      </p>
                    </motion.div>
                  </motion.button>
                )}
              </motion.div>

              {/* Envelope Flap (Top) */}
              <motion.div
                className="absolute top-0 left-0 right-0 h-[200px] origin-top rounded-t-lg shadow-lg pointer-events-none"
                style={{
                  background: colors.flap,
                  border: `3px solid ${colors.border}`,
                  borderBottom: 'none',
                  transformStyle: 'preserve-3d',
                  clipPath: 'polygon(0 0, 50% 60%, 100% 0)'
                }}
                initial={{ rotateX: 0 }}
                animate={{ 
                  rotateX: stage === 'closed' ? 0 : -180,
                  z: stage === 'closed' ? 0 : 20
                }}
                transition={{ 
                  duration: 0.8, 
                  ease: [0.43, 0.13, 0.23, 0.96]
                }}
              >
                {/* Flap decorative line */}
                <div 
                  className="absolute inset-0"
                  style={{
                    borderTop: `2px solid ${colors.border}`,
                    opacity: 0.5
                  }}
                />
              </motion.div>

              {/* Invitation Card Sliding Out */}
              <AnimatePresence>
                {showContent && (
                  <motion.div
                    initial={{ y: 0, scale: 0.8, opacity: 0 }}
                    animate={{ 
                      y: -350, 
                      scale: 1, 
                      opacity: 1,
                      rotateX: stage === 'opened' ? 0 : -10
                    }}
                    exit={{ y: -400, opacity: 0 }}
                    transition={{ 
                      duration: 1.2, 
                      ease: [0.43, 0.13, 0.23, 0.96]
                    }}
                    className="absolute top-[50%] left-1/2 transform -translate-x-1/2 w-[520px] bg-white rounded-lg shadow-2xl overflow-hidden"
                    style={{
                      transformStyle: 'preserve-3d',
                      boxShadow: '0 30px 90px rgba(0, 0, 0, 0.3)'
                    }}
                  >
                    {/* Card Preview (mini version) */}
                    <div className="p-8 bg-gradient-to-br from-white to-gray-50">
                      <div className="text-center">
                        <motion.h2
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 1.5 }}
                          className="text-3xl font-serif mb-4"
                          style={{ color: colors.border }}
                        >
                          Dəvətnamə
                        </motion.h2>
                        <motion.p
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 1.8 }}
                          className="text-gray-600 text-sm"
                        >
                          Açmaq üçün klikləyin...
                        </motion.p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Confetti Effect */}
        {stage === 'opened' && (
          <div className="absolute inset-0 pointer-events-none">
            {[...Array(30)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ 
                  x: 300, 
                  y: 200, 
                  opacity: 1,
                  scale: 0
                }}
                animate={{ 
                  x: 300 + (Math.random() - 0.5) * 600,
                  y: 200 + Math.random() * 400,
                  opacity: 0,
                  scale: 1,
                  rotate: Math.random() * 360
                }}
                transition={{ 
                  duration: 1.5,
                  delay: i * 0.03,
                  ease: "easeOut"
                }}
                className="absolute w-3 h-3 rounded-full"
                style={{
                  background: ['#d4af37', '#ffd700', '#fff', '#f0e6d2'][i % 4]
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default EnvelopeAnimation;
