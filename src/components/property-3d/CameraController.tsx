import { OrbitControls } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { RefObject, useMemo } from "react";
import { MathUtils, Vector3 } from "three";
import { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { BuildingFloor } from "../building/types";
import { calculateBuildingWidth, calculateCameraDistance, FLOOR_HEIGHT } from "./layout";

export type ViewMode = "building" | "floor" | "room";

type CameraControllerProps = {
  floors: BuildingFloor[];
  viewMode: ViewMode;
  selectedFloorIndex?: number;
  controlsRef: RefObject<OrbitControlsImpl>;
};

export function CameraController({ floors, viewMode, selectedFloorIndex = 0, controlsRef }: CameraControllerProps) {
  const camera = useThree((state) => state.camera);
  const target = useMemo(() => new Vector3(), []);
  const buildingWidth = calculateBuildingWidth(floors);
  const buildingHeight = Math.max(1, floors.length) * FLOOR_HEIGHT;
  const cameraDistance = calculateCameraDistance(floors);

  useFrame(() => {
    const floorY = selectedFloorIndex * FLOOR_HEIGHT + 0.72;
    const targetPosition =
      viewMode === "building"
        ? new Vector3(buildingWidth * 0.42, buildingHeight * 0.55 + 2.4, cameraDistance)
        : viewMode === "floor"
          ? new Vector3(buildingWidth * 0.18, floorY + 4.1, Math.max(5.2, buildingWidth * 0.58))
          : new Vector3(buildingWidth * 0.08, floorY + 2.3, Math.max(3.8, buildingWidth * 0.34));

    const lookAt =
      viewMode === "building"
        ? new Vector3(0, buildingHeight * 0.42, 0)
        : new Vector3(0, floorY, 0.05);

    camera.position.lerp(targetPosition, 0.065);
    target.lerp(lookAt, 0.08);
    camera.near = 0.1;
    camera.far = 80;
    camera.updateProjectionMatrix();
    controlsRef.current?.target.copy(target);
    controlsRef.current?.update();
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enablePan={false}
      enableDamping
      dampingFactor={0.08}
      minDistance={MathUtils.clamp(cameraDistance * 0.34, 3.4, 8)}
      maxDistance={MathUtils.clamp(cameraDistance * 1.6, 9, 30)}
      maxPolarAngle={Math.PI * 0.47}
      minPolarAngle={Math.PI * 0.16}
    />
  );
}
