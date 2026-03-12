import React, { useState, useEffect, useRef } from 'react';
import './BreathingOrb.css';

// 4-7-8 Breathing Technique Timing (in seconds)
const INHALE_TIME = 4;
const HOLD_TIME = 7;
const EXHALE_TIME = 8;
const CYCLE_TIME = INHALE_TIME + HOLD_TIME + EXHALE_TIME;

const BreathingOrb = ({ onStop }) => {
  const [phase, setPhase] = useState('inhale'); // 'inhale', 'hold', 'exhale'
  const [timeLeft, setTimeLeft] = useState(INHALE_TIME);
  const [cycleCount, setCycleCount] = useState(0);
  const startTimeRef = useRef(Date.now());
  
  useEffect(() => {
    startTimeRef.current = Date.now();
    
    let animationFrameId;
    
    const updateTime = () => {
      const elapsedMilliseconds = Date.now() - startTimeRef.current;
      const progressInSeconds = (elapsedMilliseconds / 1000) % CYCLE_TIME;
      const currentCycle = Math.floor(elapsedMilliseconds / 1000 / CYCLE_TIME);
      
      setCycleCount(currentCycle);
      
      if (progressInSeconds < INHALE_TIME) {
        setPhase('inhale');
        setTimeLeft(Math.ceil(INHALE_TIME - progressInSeconds));
      } else if (progressInSeconds < INHALE_TIME + HOLD_TIME) {
        setPhase('hold');
        setTimeLeft(Math.ceil((INHALE_TIME + HOLD_TIME) - progressInSeconds));
      } else {
        setPhase('exhale');
        setTimeLeft(Math.ceil(CYCLE_TIME - progressInSeconds));
      }
      
      animationFrameId = requestAnimationFrame(updateTime);
    };
    
    animationFrameId = requestAnimationFrame(updateTime);
    
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  // For the SVG ring, we want a smooth continuous progress over the cycle
  const circleCircumference = 2 * Math.PI * 140; // r=140
  
  let phaseText = '';
  if (phase === 'inhale') phaseText = 'Inhale';
  if (phase === 'hold') phaseText = 'Hold';
  if (phase === 'exhale') phaseText = 'Exhale';

  return (
    <div className="orb-wrapper">
      <div className="aura-field">
        {/* Particles could be injected here, but we use CSS for a subtle drifting bloom */}
      </div>

      <div className="energy-ring-container">
        <svg className="energy-ring-svg" viewBox="0 0 300 300">
          <circle 
            className="ring-background" 
            cx="150" 
            cy="150" 
            r="140"
          />
          <circle 
            className={`ring-progress ${phase}`}
            cx="150" 
            cy="150" 
            r="140"
            strokeDasharray={circleCircumference}
            strokeDashoffset={circleCircumference} // Controlled via CSS animations
            style={{ animationDuration: `${CYCLE_TIME}s` }}
          />
        </svg>
      </div>

      <div className={`core-orb ${phase}`}>
        <div className="orb-content">
          <div className="phase-text">{phaseText}</div>
          <div className="timer-text">{timeLeft}</div>
        </div>
      </div>
      
      <div className="cycle-counter">
        Cycles completed: {cycleCount}
      </div>

      <button className="stop-button" onClick={onStop}>
        Stop Session
      </button>
    </div>
  );
};

export default BreathingOrb;
