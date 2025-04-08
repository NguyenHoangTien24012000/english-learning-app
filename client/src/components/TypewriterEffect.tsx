import React, { useState, useEffect } from 'react';

interface TypewriterEffectProps {
  text: string;
  speed?: number;
  onComplete?: () => void;
  onStart?: () => void;
}

const TypewriterEffect: React.FC<TypewriterEffectProps> = ({ 
  text, 
  speed = 30,
  onComplete,
  onStart
}) => {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    // Reset when text changes
    setDisplayedText('');
    setCurrentIndex(0);
    setHasStarted(false);
  }, [text]);

  useEffect(() => {
    if (!text) return;

    if (currentIndex < text.length) {
      // Call onStart only once when animation begins
      if (!hasStarted && onStart) {
        onStart();
        setHasStarted(true);
      }

      const timeout = setTimeout(() => {
        setDisplayedText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, speed);

      return () => clearTimeout(timeout);
    } else if (onComplete) {
      onComplete();
    }
  }, [currentIndex, text, speed, onComplete, onStart, hasStarted]);

  return (
    <div className="typewriter-text" style={{ whiteSpace: 'pre-wrap' }}>
      {displayedText}
    </div>
  );
};

export default TypewriterEffect; 