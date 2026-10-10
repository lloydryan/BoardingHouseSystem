import { BuildingFloor } from "../building/types";

export const ROOM_WIDTH = 2.65;
export const ROOM_DEPTH = 2.9;
export const FLOOR_HEIGHT = 1.55;
export const CORRIDOR_DEPTH = 1;
export const ROOM_GAP = 0.08;
export const SLAB_DEPTH = ROOM_DEPTH + CORRIDOR_DEPTH + 0.42;
export const WALL_HEIGHT = 1.22;

export type RoomLayout = {
  x: number;
  z: number;
  width: number;
  depth: number;
  index: number;
};

export type FloorLayout = {
  floorId: string;
  y: number;
  width: number;
  roomLayouts: RoomLayout[];
};

export function calculateFloorWidth(roomCount: number) {
  return Math.max(ROOM_WIDTH * 2.3, roomCount * ROOM_WIDTH + Math.max(0, roomCount - 1) * ROOM_GAP + 0.62);
}

export function calculateBuildingWidth(floors: BuildingFloor[]) {
  return Math.max(...floors.map((floor) => calculateFloorWidth(Math.max(1, floor.units.length))), ROOM_WIDTH * 2.3);
}

export function calculateCameraDistance(floors: BuildingFloor[]) {
  const width = calculateBuildingWidth(floors);
  const height = Math.max(1, floors.length) * FLOOR_HEIGHT;
  return Math.max(8, width * 0.72 + height * 0.85);
}

export function sortFloorsAscending(floors: BuildingFloor[]) {
  return floors.slice().sort((a, b) => {
    if (a.displayOrder !== b.displayOrder) return a.displayOrder - b.displayOrder;
    return a.floorNumber - b.floorNumber;
  });
}

export function createFloorLayouts(floors: BuildingFloor[]) {
  return sortFloorsAscending(floors).map((floor, floorIndex) => {
    const unitCount = Math.max(1, floor.units.length);
    const width = calculateFloorWidth(unitCount);
    const startX = -((unitCount * ROOM_WIDTH + Math.max(0, unitCount - 1) * ROOM_GAP) / 2) + ROOM_WIDTH / 2;
    return {
      floorId: floor.id,
      y: floorIndex * FLOOR_HEIGHT,
      width,
      roomLayouts: floor.units.map((_, index) => ({
        x: startX + index * (ROOM_WIDTH + ROOM_GAP),
        z: -0.38,
        width: ROOM_WIDTH,
        depth: ROOM_DEPTH,
        index
      }))
    } satisfies FloorLayout;
  });
}
