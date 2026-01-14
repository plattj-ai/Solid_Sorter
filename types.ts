
export enum ShapeType {
  BOX = 'BOX',
  CYLINDER = 'CYLINDER',
  SPHERE = 'SPHERE',
  TORUS = 'TORUS',
  CONE = 'CONE',
  ROOF = 'ROOF',
  PARABOLOID = 'PARABOLOID'
}

export interface GameObject {
  id: string;
  type: ShapeType;
  position: { x: number; y: number; z: number };
  velocity: { x: number; y: number };
  isFalling: boolean;
  isSpawning: boolean;
  beltIndex: number;
}

export interface GameState {
  score: number;
  lives: number;
  targetShape: ShapeType;
  targetCount: number;
  playerZ: number;
  gameOver: boolean;
  isPaused: boolean;
  gameStarted: boolean;
  flash: 'red' | 'green' | null;
}
