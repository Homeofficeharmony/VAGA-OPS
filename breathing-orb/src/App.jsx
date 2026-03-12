import { useState } from 'react';
import './App.css';
import BreathingOrb from './BreathingOrb';

function App() {
  const [isActive, setIsActive] = useState(false);

  return (
    <div className="app-container">
      {!isActive ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <h1 className="title">Prana</h1>
          <button className="start-button" onClick={() => setIsActive(true)}>
            Begin Selection
          </button>
        </div>
      ) : (
        <BreathingOrb onStop={() => setIsActive(false)} />
      )}
    </div>
  );
}

export default App;
