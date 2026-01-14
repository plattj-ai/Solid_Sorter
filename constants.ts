
import { ShapeType } from './types';

export const LIVES_START = 5;
export const BELT_Z_POSITIONS = [-8, 0, 8];
export const BELT_START_X = -15;
export const BELT_END_X = 5;
export const BELT_Y = 4;
export const CHUTE_X = -16;
export const CHUTE_Y_START = 10;
export const LANDING_Y = 5;
export const PLAYER_X = 9;
export const PLAYER_Y = 0;
export const GRAVITY = -35;
export const INITIAL_SPEED = 4.5; // Reduced by 25% from 6
export const SHAPE_TYPES = Object.values(ShapeType);

export const SHAPE_COLORS: Record<ShapeType, number> = {
  [ShapeType.BOX]: 0xff3333,      // Vibrant Red
  [ShapeType.CYLINDER]: 0xff9900, // Orange
  [ShapeType.SPHERE]: 0x3366ff,   // Deep Blue
  [ShapeType.TORUS]: 0xff66cc,    // Pink
  [ShapeType.CONE]: 0xffff00,     // Yellow
  [ShapeType.ROOF]: 0x33ff33,     // Lime Green
  [ShapeType.PARABOLOID]: 0x9900ff, // Purple
};
