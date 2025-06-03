import { useEffect, useRef, useState, useCallback } from 'react';
import { socketService } from '../../services/socket';
import { apiService } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import type { 
  FrontendUnit, 
  UnitMovedEvent, 
  UnitCreatedEvent, 
  RoomUnitsEvent, 
  UnitErrorEvent,
  CreateUnitPayload,
  Character
} from '../../types';
import './MapCanvas.css';

interface MapCanvasProps {
  roomId: string;
  isGM: boolean;
}

interface CanvasUnit extends FrontendUnit {
  isSelected: boolean;
  isDragging: boolean;
}

export function MapCanvas({ roomId, isGM }: MapCanvasProps) {
  const { state } = useAuth();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [units, setUnits] = useState<CanvasUnit[]>([]);
  const [selectedUnit, setSelectedUnit] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newUnitName, setNewUnitName] = useState('');
  const [newUnitType, setNewUnitType] = useState<'PC' | 'NPC' | 'OBJECT'>('NPC');
  const [selectedCharacterId, setSelectedCharacterId] = useState<string>('');
  const [availableCharacters, setAvailableCharacters] = useState<Character[]>([]);
  const [isLoadingCharacters, setIsLoadingCharacters] = useState(false);
  const [isLoadingUnits, setIsLoadingUnits] = useState(true);
  const [showCharacterInfo, setShowCharacterInfo] = useState(false);
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Canvas dimensions and grid settings
  const CANVAS_WIDTH = 800;
  const CANVAS_HEIGHT = 600;
  const GRID_SIZE = 40;
  const UNIT_SIZE = 30;

  // Fetch available characters for the room
  const fetchAvailableCharacters = useCallback(async () => {
    if (!isGM && !state.user) return;
    
    setIsLoadingCharacters(true);
    try {
      const response = await apiService.getRoomCharacters(roomId);
      if (response.data) {
        setAvailableCharacters(response.data.characters);
      } else {
        console.error('Failed to fetch characters:', response.error);
      }
    } catch (error) {
      console.error('Error fetching characters:', error);
    } finally {
      setIsLoadingCharacters(false);
    }
  }, [roomId, isGM, state.user]);

  // Check if user can move a unit
  const canMoveUnit = useCallback((unit: CanvasUnit): boolean => {
    if (isGM) return true; // GMs can move any unit
    
    // Players can only move their own character units
    if (unit.character && unit.character.userId === state.user?.id) {
      return true;
    }
    
    return false;
  }, [isGM, state.user?.id]);

  // Simple request units function
  const requestUnits = useCallback(() => {
    const socket = socketService.getSocket();
    if (!socket || !socket.connected) {
      console.log('Socket not available or not connected');
      return;
    }

    console.log('Requesting room units for room:', roomId);
    setIsLoadingUnits(true);
    setError(null);
    
    // Clear any existing timeout
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
    }

    socket.emit('get_room_units', { roomId });

    // Set a timeout in case the server doesn't respond
    loadingTimeoutRef.current = setTimeout(() => {
      console.log('No response received for room units request');
      setIsLoadingUnits(false);
      setError('Failed to load units. Click retry to try again.');
    }, 5000);
  }, [roomId]);

  // Socket event handlers
  useEffect(() => {
    const socket = socketService.getSocket();
    if (!socket) return;

    // Listen for unit events
    const handleRoomUnits = (data: RoomUnitsEvent) => {
      console.log('Received room units:', data);
      if (data.roomId === roomId) {
        // Clear the loading timeout since we got a response
        if (loadingTimeoutRef.current) {
          clearTimeout(loadingTimeoutRef.current);
          loadingTimeoutRef.current = null;
        }
        
        setUnits(data.units.map(unit => ({
          ...unit,
          isSelected: false,
          isDragging: false
        })));
        setIsLoadingUnits(false);
      }
    };

    const handleUnitMoved = (data: UnitMovedEvent) => {
      setUnits(prev => prev.map(unit => 
        unit.id === data.unitId 
          ? { ...unit, x: data.x, y: data.y, isDragging: false }
          : unit
      ));
    };

    const handleUnitCreated = (data: UnitCreatedEvent) => {
      console.log('Unit created event received:', data);
      setUnits(prev => [...prev, {
        ...data.unit,
        isSelected: false,
        isDragging: false
      }]);
    };

    const handleUnitCreateSuccess = (data: { unit: FrontendUnit }) => {
      console.log('Unit create success:', data);
      // This is redundant with unit_created but ensures the creator sees the unit
      setUnits(prev => {
        // Check if unit already exists to avoid duplicates
        const exists = prev.some(unit => unit.id === data.unit.id);
        if (!exists) {
          return [...prev, {
            ...data.unit,
            isSelected: false,
            isDragging: false
          }];
        }
        return prev;
      });
    };

    const handleUnitError = (data: UnitErrorEvent) => {
      setError(data.message);
      setIsLoadingUnits(false);
      setTimeout(() => setError(null), 5000);
    };

    socket.on('room_units', handleRoomUnits);
    socket.on('unit_moved', handleUnitMoved);
    socket.on('unit_created', handleUnitCreated);
    socket.on('unit_create_success', handleUnitCreateSuccess);
    socket.on('unit_error', handleUnitError);

    return () => {
      socket.off('room_units', handleRoomUnits);
      socket.off('unit_moved', handleUnitMoved);
      socket.off('unit_created', handleUnitCreated);
      socket.off('unit_create_success', handleUnitCreateSuccess);
      socket.off('unit_error', handleUnitError);
      
      // Clear any pending timeout
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
        loadingTimeoutRef.current = null;
      }
    };
  }, [roomId]);

  // Separate effect for initial unit request
  useEffect(() => {
    const socket = socketService.getSocket();
    if (!socket) return;

    const attemptRequest = () => {
      if (socket.connected) {
        console.log('Attempting to request units...');
        requestUnits();
      } else {
        console.log('Socket not connected yet, waiting...');
        setTimeout(attemptRequest, 1000);
      }
    };

    // Start attempting requests after a short delay
    const timer = setTimeout(attemptRequest, 500);

    return () => clearTimeout(timer);
  }, [roomId, requestUnits]);

  // Manual retry function
  const handleRetry = () => {
    setError(null);
    requestUnits();
  };

  // Draw canvas
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw grid
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;

    // Vertical lines
    for (let x = 0; x <= CANVAS_WIDTH; x += GRID_SIZE) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, CANVAS_HEIGHT);
      ctx.stroke();
    }

    // Horizontal lines
    for (let y = 0; y <= CANVAS_HEIGHT; y += GRID_SIZE) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(CANVAS_WIDTH, y);
      ctx.stroke();
    }

    // Draw units
    units.forEach(unit => {
      const centerX = unit.x + UNIT_SIZE / 2;
      const centerY = unit.y + UNIT_SIZE / 2;

      // Unit background
      ctx.fillStyle = unit.isSelected ? '#667eea' : getUnitColor(unit.type);
      ctx.fillRect(unit.x, unit.y, UNIT_SIZE, UNIT_SIZE);

      // Unit border
      ctx.strokeStyle = unit.isSelected ? '#ffffff' : '#000000';
      ctx.lineWidth = unit.isSelected ? 3 : 1;
      ctx.strokeRect(unit.x, unit.y, UNIT_SIZE, UNIT_SIZE);

      // Unit label
      ctx.fillStyle = '#ffffff';
      ctx.font = '10px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(unit.name.substring(0, 3), centerX, centerY);
    });
  }, [units]);

  // Redraw canvas when units change
  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  // Get unit color based on type
  const getUnitColor = (type: string): string => {
    switch (type) {
      case 'PC': return '#10b981'; // Green for player characters
      case 'NPC': return '#ef4444'; // Red for NPCs
      case 'OBJECT': return '#6b7280'; // Gray for objects
      default: return '#3b82f6'; // Blue default
    }
  };

  // Snap position to grid
  const snapToGrid = (value: number): number => {
    return Math.round(value / GRID_SIZE) * GRID_SIZE;
  };

  // Get unit at position
  const getUnitAt = (x: number, y: number): CanvasUnit | null => {
    return units.find(unit => 
      x >= unit.x && x <= unit.x + UNIT_SIZE &&
      y >= unit.y && y <= unit.y + UNIT_SIZE
    ) || null;
  };

  // Fetch available characters when modal opens
  useEffect(() => {
    if (showCreateForm) {
      fetchAvailableCharacters();
    }
  }, [showCreateForm, fetchAvailableCharacters]);

  // Canvas mouse handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const clickedUnit = getUnitAt(x, y);

    if (clickedUnit) {
      setSelectedUnit(clickedUnit.id);
      setUnits(prev => prev.map(unit => ({
        ...unit,
        isSelected: unit.id === clickedUnit.id
      })));

      // Only allow dragging if user can move this unit
      if (canMoveUnit(clickedUnit)) {
        setIsDragging(true);
        setDragOffset({
          x: x - clickedUnit.x,
          y: y - clickedUnit.y
        });
      }

      // Show character info if unit has a linked character
      if (clickedUnit.character) {
        setShowCharacterInfo(true);
      } else {
        setShowCharacterInfo(false);
      }
    } else {
      // Clear selection
      setSelectedUnit(null);
      setShowCharacterInfo(false);
      setUnits(prev => prev.map(unit => ({
        ...unit,
        isSelected: false
      })));

      // Create unit on double-click if GM
      if (isGM && e.detail === 2) {
        setShowCreateForm(true);
        setNewUnitName('New Unit');
        setSelectedCharacterId('');
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging || !selectedUnit) return;

    const selectedUnitData = units.find(u => u.id === selectedUnit);
    if (!selectedUnitData || !canMoveUnit(selectedUnitData)) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const newX = snapToGrid(x - dragOffset.x);
    const newY = snapToGrid(y - dragOffset.y);

    // Constrain to canvas bounds
    const constrainedX = Math.max(0, Math.min(newX, CANVAS_WIDTH - UNIT_SIZE));
    const constrainedY = Math.max(0, Math.min(newY, CANVAS_HEIGHT - UNIT_SIZE));

    setUnits(prev => prev.map(unit => 
      unit.id === selectedUnit 
        ? { ...unit, x: constrainedX, y: constrainedY, isDragging: true }
        : unit
    ));
  };

  const handleMouseUp = () => {
    if (isDragging && selectedUnit) {
      const unit = units.find(u => u.id === selectedUnit);
      if (unit && unit.isDragging && canMoveUnit(unit)) {
        // Send move command to server
        const socket = socketService.getSocket();
        if (socket) {
          socket.emit('move_unit', {
            unitId: selectedUnit,
            x: unit.x,
            y: unit.y,
            roomId
          });
        }
      }
    }

    setIsDragging(false);
    setDragOffset({ x: 0, y: 0 });
  };

  // Handle character selection for unit creation
  const handleCharacterSelect = (characterId: string) => {
    setSelectedCharacterId(characterId);
    const selectedCharacter = availableCharacters.find(c => c.id === characterId);
    if (selectedCharacter) {
      setNewUnitName(selectedCharacter.name);
      setNewUnitType('PC'); // Character units are typically PCs
    } else {
      setNewUnitName('');
      setNewUnitType('NPC');
    }
  };

  // Create unit
  const handleCreateUnit = () => {
    if (!newUnitName.trim()) return;

    const socket = socketService.getSocket();
    if (socket) {
      const createData: CreateUnitPayload = {
        roomId,
        name: newUnitName.trim(),
        x: Math.floor(CANVAS_WIDTH / 2),
        y: Math.floor(CANVAS_HEIGHT / 2),
        type: newUnitType,
        ...(selectedCharacterId && { characterId: selectedCharacterId })
      };

      console.log('Creating unit with data:', createData);
      socket.emit('create_unit', createData);
    }

    setShowCreateForm(false);
    setNewUnitName('');
    setNewUnitType('NPC');
    setSelectedCharacterId('');
  };

  // Get selected unit data for character info display
  const getSelectedUnitData = (): CanvasUnit | null => {
    return selectedUnit ? units.find(u => u.id === selectedUnit) || null : null;
  };

  return (
    <div className="map-canvas-container">
      <div className="map-canvas-header">
        <h3>Battle Map</h3>
        <div className="map-controls">
          {isGM && (
            <button 
              onClick={() => setShowCreateForm(true)}
              className="create-unit-button"
              disabled={isLoadingUnits}
            >
              Add Unit
            </button>
          )}
          {isLoadingUnits && (
            <span className="loading-indicator">Loading...</span>
          )}
          {!isLoadingUnits && (
            <span className="unit-count">{units.length} units</span>
          )}
          {error && (
            <button 
              onClick={handleRetry}
              className="retry-button"
            >
              Retry
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="map-error">
          {error}
        </div>
      )}

      <div className="canvas-wrapper">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className="battle-map-canvas"
        />
      </div>

      {showCreateForm && (
        <div className="create-unit-modal">
          <div className="modal-content">
            <h4>Create Unit</h4>
            
            {/* Character Selection */}
            <div className="form-group">
              <label>Link to Character (Optional):</label>
              {isLoadingCharacters ? (
                <div className="loading-text">Loading characters...</div>
              ) : (
                <select
                  value={selectedCharacterId}
                  onChange={(e) => handleCharacterSelect(e.target.value)}
                >
                  <option value="">No character (manual unit)</option>
                  {availableCharacters.map(character => (
                    <option key={character.id} value={character.id}>
                      {character.name} (Level {character.stats.level})
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="form-group">
              <label>Name:</label>
              <input
                type="text"
                value={newUnitName}
                onChange={(e) => setNewUnitName(e.target.value)}
                placeholder="Unit name"
                maxLength={20}
              />
            </div>
            <div className="form-group">
              <label>Type:</label>
              <select
                value={newUnitType}
                onChange={(e) => setNewUnitType(e.target.value as 'PC' | 'NPC' | 'OBJECT')}
              >
                <option value="PC">Player Character</option>
                <option value="NPC">Non-Player Character</option>
                <option value="OBJECT">Object</option>
              </select>
            </div>
            <div className="modal-actions">
              <button onClick={() => setShowCreateForm(false)} className="cancel-button">
                Cancel
              </button>
              <button onClick={handleCreateUnit} className="create-button">
                Create Unit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Character Info Display */}
      {showCharacterInfo && selectedUnit && (() => {
        const selectedUnitData = getSelectedUnitData();
        return selectedUnitData?.character && (
          <div className="character-info-panel">
            <div className="character-info-header">
              <h4>{selectedUnitData.character.name}</h4>
              <button 
                onClick={() => setShowCharacterInfo(false)}
                className="close-info-button"
              >
                ×
              </button>
            </div>
            <div className="character-info-content">
              <div className="character-basic-info">
                <p><strong>Owner:</strong> {selectedUnitData.character.user?.username}</p>
                <p><strong>Unit Type:</strong> {selectedUnitData.type}</p>
                <p><strong>Position:</strong> ({Math.floor(selectedUnitData.x / GRID_SIZE)}, {Math.floor(selectedUnitData.y / GRID_SIZE)})</p>
              </div>
              
              {/* Movement permission indicator */}
              <div className="movement-permissions">
                {canMoveUnit(selectedUnitData) ? (
                  <p className="can-move">✓ You can move this unit</p>
                ) : (
                  <p className="cannot-move">✗ You cannot move this unit</p>
                )}
              </div>

              {/* Quick character stats if available */}
              <div className="character-quick-stats">
                <p><strong>Character ID:</strong> {selectedUnitData.character.id}</p>
                <p><em>View full character sheet in Characters page</em></p>
              </div>
            </div>
          </div>
        );
      })()}

      <div className="map-instructions">
        <p>
          • Click units to select and view character info • Drag to move units (permissions apply)
          • {isGM ? 'Double-click empty space to create units • Link units to characters for enhanced gameplay' : 'Character-linked units show ownership and stats'}
        </p>
      </div>
    </div>
  );
} 