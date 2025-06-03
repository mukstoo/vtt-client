import React, { useState, useEffect, useRef } from 'react';
import { socketService } from '../../services/socket';

interface DiceRollResult {
  id: string;
  formula: string;
  result: number;
  details: string;
  userId: string;
  username: string;
  timestamp: Date;
}

interface DiceRollerProps {
  roomId: string;
}

function DiceRoller({ roomId }: DiceRollerProps) {
  const [formula, setFormula] = useState('');
  const [isRolling, setIsRolling] = useState(false);
  const [error, setError] = useState('');
  const [rollHistory, setRollHistory] = useState<DiceRollResult[]>([]);
  const historyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Access socket through the service (using type assertion for private access)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const socket = (socketService as any).socket;
    if (!socket) return;

    // Request dice history when component mounts
    socket.emit('get_dice_history', { roomId, limit: 20 });

    // Listen for dice results
    const handleDiceResult = (result: DiceRollResult) => {
      setRollHistory(prev => [result, ...prev.slice(0, 19)]); // Keep last 20 rolls
      setIsRolling(false);
      setError('');
      
      // Scroll to top of history to show newest roll
      if (historyRef.current) {
        historyRef.current.scrollTop = 0;
      }
    };

    // Listen for dice history
    const handleDiceHistory = (data: { rolls: DiceRollResult[] }) => {
      setRollHistory(data.rolls);
    };

    // Listen for dice errors
    const handleDiceError = (data: { error: string }) => {
      setError(data.error);
      setIsRolling(false);
    };

    socket.on('dice_result', handleDiceResult);
    socket.on('dice_history', handleDiceHistory);
    socket.on('dice_error', handleDiceError);

    return () => {
      socket.off('dice_result', handleDiceResult);
      socket.off('dice_history', handleDiceHistory);
      socket.off('dice_error', handleDiceError);
    };
  }, [roomId]);

  const validateFormula = (input: string): boolean => {
    // Basic validation - allow common dice patterns
    const dicePattern = /^[\dd+\-\s*/()]+$/i;
    if (!dicePattern.test(input)) return false;
    
    // Check for reasonable length
    if (input.length > 50) return false;
    
    // Must contain at least one 'd' for dice
    if (!input.toLowerCase().includes('d')) return false;
    
    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const socket = (socketService as any).socket;
    if (!socket || !formula.trim()) return;

    const trimmedFormula = formula.trim();
    
    // Validate formula
    if (!validateFormula(trimmedFormula)) {
      setError('Invalid dice formula. Use patterns like "1d20", "2d6+3", etc.');
      return;
    }

    setIsRolling(true);
    setError('');
    socket.emit('roll_dice', { formula: trimmedFormula, roomId });
  };

  const formatTimestamp = (timestamp: Date) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getUsernameColor = (username: string) => {
    // Simple hash function to generate consistent colors
    let hash = 0;
    for (let i = 0; i < username.length; i++) {
      hash = username.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash) % 360;
    return `hsl(${hue}, 60%, 70%)`;
  };

  const refreshHistory = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const socket = (socketService as any).socket;
    if (socket) {
      socket.emit('get_dice_history', { roomId, limit: 20 });
    }
  };

  return (
    <div className="dice-roller">
      <div className="dice-roller-header">
        <h3>Dice Roller</h3>
      </div>

      <form onSubmit={handleSubmit} className="dice-roll-form">
        <div className="dice-input-group">
          <input
            type="text"
            value={formula}
            onChange={(e) => setFormula(e.target.value)}
            placeholder="e.g., 1d20, 2d6+3, 3d4+2"
            className={`dice-input ${error ? 'error' : ''}`}
            disabled={isRolling}
            maxLength={50}
          />
          <button 
            type="submit" 
            disabled={isRolling || !formula.trim()}
            className="dice-roll-button"
          >
            {isRolling ? '🎲' : 'Roll'}
          </button>
        </div>
        
        {error && (
          <div className="dice-error">
            {error}
          </div>
        )}
        
        <div className="dice-examples">
          <span>Examples: </span>
          <button type="button" onClick={() => setFormula('1d20')} className="example-button">1d20</button>
          <button type="button" onClick={() => setFormula('2d6+3')} className="example-button">2d6+3</button>
          <button type="button" onClick={() => setFormula('1d100')} className="example-button">1d100</button>
        </div>
      </form>

      <div className="dice-history" ref={historyRef}>
        <div className="dice-history-header">
          <h4>Recent Rolls</h4>
          {rollHistory.length > 0 && (
            <button 
              onClick={refreshHistory}
              className="refresh-button"
            >
              ↻
            </button>
          )}
        </div>
        
        <div className="dice-history-list">
          {rollHistory.length === 0 ? (
            <div className="no-rolls">No dice rolls yet</div>
          ) : (
            rollHistory.map((roll) => (
              <div key={roll.id} className="dice-roll-item">
                <div className="roll-header">
                  <span 
                    className="roll-username"
                    style={{ color: getUsernameColor(roll.username) }}
                  >
                    {roll.username}
                  </span>
                  <span className="roll-time">
                    {formatTimestamp(roll.timestamp)}
                  </span>
                </div>
                <div className="roll-content">
                  <span className="roll-formula">{roll.formula}</span>
                  <span className="roll-equals">=</span>
                  <span className="roll-result">{roll.result}</span>
                </div>
                {roll.details && roll.details !== `${roll.formula} = ${roll.result}` && (
                  <div className="roll-details">{roll.details}</div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default DiceRoller; 