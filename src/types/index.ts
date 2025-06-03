export interface User {
  id: string;
  username: string;
  role: "PLAYER" | "GM" | "ADMIN";
  createdAt: string;
  updatedAt: string;
}

export interface Room {
  id: string;
  name: string;
  gmId: string;
  createdAt: string;
  updatedAt: string;
  gm?: {
    id: string;
    username: string;
    role: string;
  };
  userRole?: 'GM' | 'MEMBER';
  memberCount?: number;
  hasPassword?: boolean;
}

export interface Map {
  id: string;
  roomId: string;
  name: string;
  gridType: "HEX" | "SQUARE";
  data: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface Unit {
  id: string;
  roomId: string;
  characterId?: string;
  type: "PC" | "NPC" | "OBJECT";
  label: string;
  positionX: number;
  positionY: number;
  movement: number;
  createdAt: string;
  updatedAt: string;
  // Frontend convenience fields
  name?: string;
  x?: number;
  y?: number;
}

export interface FrontendUnit {
  id: string;
  roomId: string;
  characterId?: string;
  type: "PC" | "NPC" | "OBJECT";
  name: string;
  x: number;
  y: number;
  movement: number;
  createdAt: string;
  updatedAt: string;
  character?: {
    id: string;
    name: string;
    userId: string;
    user: {
      id: string;
      username: string;
      role: string;
    };
  };
}

export interface Character {
  id: string;
  userId: string;
  name: string;
  stats: CharacterStats;
  inventory: CharacterInventory;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    username: string;
    role: "PLAYER" | "GM" | "ADMIN";
  };
  units?: {
    id: string;
    roomId: string;
    type: "PC" | "NPC" | "OBJECT";
    label: string;
    positionX: number;
    positionY: number;
  }[];
}

export interface CharacterStats {
  level: number;
  hitPoints: {
    current: number;
    max: number;
  };
  armorClass: number;
  attributes: {
    strength: number;
    dexterity: number;
    constitution: number;
    intelligence: number;
    wisdom: number;
    charisma: number;
  };
  skills: Record<string, number>;
  saves: {
    strength: number;
    dexterity: number;
    constitution: number;
    intelligence: number;
    wisdom: number;
    charisma: number;
  };
}

export interface CharacterInventory {
  items: InventoryItem[];
  currency: {
    gold: number;
    silver: number;
    copper: number;
  };
  equipment: {
    armor: InventoryItem | null;
    weapons: InventoryItem[];
    accessories: InventoryItem[];
  };
}

export interface InventoryItem {
  id?: string;
  name: string;
  description?: string;
  quantity?: number;
  weight?: number;
  value?: number;
}

// Character form interfaces
export interface CreateCharacterData {
  name: string;
  stats?: Partial<CharacterStats>;
  inventory?: Partial<CharacterInventory>;
}

export interface UpdateCharacterData {
  name?: string;
  stats?: Partial<CharacterStats>;
  inventory?: Partial<CharacterInventory>;
}

// API response interfaces for characters
export interface CharacterListResponse {
  characters: Character[];
  count: number;
}

export interface CharacterResponse {
  character: Character;
  message?: string;
}

export interface CharacterDeleteResponse {
  success: boolean;
  message: string;
}

export interface DiceRoll {
  id: string;
  userId: string;
  roomId: string;
  formula: string;
  result: number;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  content: string;
  createdAt: string;
  user: {
    id: string;
    username: string;
    role: "PLAYER" | "GM" | "ADMIN";
  };
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterCredentials {
  username: string;
  password: string;
  role?: "PLAYER" | "GM" | "ADMIN";
}

export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  status: number;
}

// Socket.IO event payloads
export interface UnitMovedPayload {
  unitId: string;
  targetX: number;
  targetY: number;
}

export interface MoveUnitPayload {
  unitId: string;
  x: number;
  y: number;
  roomId: string;
}

export interface CreateUnitPayload {
  roomId: string;
  name: string;
  x: number;
  y: number;
  characterId?: string;
  type?: "PC" | "NPC" | "OBJECT";
}

export interface UnitErrorEvent {
  message: string;
  field: string;
}

export interface UnitMovedEvent {
  unitId: string;
  x: number;
  y: number;
  movedBy: string;
  timestamp: string;
}

export interface UnitCreatedEvent {
  unit: FrontendUnit;
  createdBy: string;
  timestamp: string;
}

export interface RoomUnitsEvent {
  units: FrontendUnit[];
  roomId: string;
}

export interface DiceRollPayload {
  formula: string;
}

export interface ChatMessagePayload {
  content: string;
}

export interface VoiceJoinPayload {
  peerId: string;
}

// Socket.IO event responses
export interface UserTypingEvent {
  userId: string;
  username: string;
  typing: boolean;
}

export interface UserConnectionEvent {
  userId: string;
  username: string;
}

export interface CreateRoomData {
  name: string;
  password?: string;
}

export interface JoinRoomData {
  password?: string;
}

// Voice chat interfaces
export interface VoicePeerInfo {
  peerId: string;
  userId: string;
  username: string;
  isMuted: boolean;
  isConnected: boolean;
}

export interface VoicePeerJoinedEvent {
  peer: VoicePeerInfo;
  roomId: string;
}

export interface VoicePeerLeftEvent {
  peerId: string;
  userId: string;
  roomId: string;
}

export interface VoicePeerMutedEvent {
  peerId: string;
  userId: string;
  isMuted: boolean;
  roomId: string;
}

export interface VoiceRoomPeersEvent {
  peers: VoicePeerInfo[];
  roomId: string;
} 