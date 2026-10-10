import { ContactShadows, Html, PerspectiveCamera, Preload } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Component, ReactNode, Suspense, useMemo, useRef, useState } from "react";
import { RotateCcw, Undo2 } from "lucide-react";
import { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { BuildingFloor, BuildingProperty, BuildingUnit } from "../building/types";
import { Building3D } from "./Building3D";
import { BuildingLighting } from "./BuildingLighting";
import { CameraController, ViewMode } from "./CameraController";
import { sortFloorsAscending } from "./layout";

type PropertySceneProps = {
  property: BuildingProperty;
  floors: BuildingFloor[];
  selectedFloorId?: string;
  selectedUnitId?: string;
  onFloorSelect: (floorId: string) => void;
  onUnitSelect: (unit: BuildingUnit) => void;
};

type SceneState = {
  viewMode: ViewMode;
  focusedFloorId?: string;
};

export function PropertyScene({ property, floors, selectedFloorId, selectedUnitId, onFloorSelect, onUnitSelect }: PropertySceneProps) {
  const sortedFloors = useMemo(() => sortFloorsAscending(floors), [floors]);
  const initialFloorId = selectedFloorId ?? sortedFloors[0]?.id;
  const [sceneState, setSceneState] = useState<SceneState>({ viewMode: "building", focusedFloorId: initialFloorId });
  const focusedFloorId = sceneState.focusedFloorId ?? initialFloorId;
  const selectedFloorIndex = Math.max(0, sortedFloors.findIndex((floor) => floor.id === focusedFloorId));

  function focusFloor(floorId: string) {
    onFloorSelect(floorId);
    setSceneState({ viewMode: "floor", focusedFloorId: floorId });
  }

  function selectUnit(unit: BuildingUnit) {
    onUnitSelect(unit);
    setSceneState({ viewMode: "room", focusedFloorId: unit.floorId });
  }

  function goBack() {
    if (sceneState.viewMode === "room") {
      setSceneState({ viewMode: "floor", focusedFloorId });
    } else {
      setSceneState({ viewMode: "building", focusedFloorId });
    }
  }

  function resetView() {
    setSceneState({ viewMode: "building", focusedFloorId: initialFloorId });
  }

  if (!floors.length) {
    return (
      <div className="property-3d-empty">
        <strong>{property.name}</strong>
        <span>Add a floor and units to generate the 3D property visualization.</span>
      </div>
    );
  }

  return (
    <section className="property-3d-shell" aria-label={`${property.name} 3D property visualization`}>
      <header className="property-3d-toolbar">
        <div>
          <span>{sceneState.viewMode === "building" ? "Building View" : sceneState.viewMode === "floor" ? "Floor Focus" : "Room View"}</span>
          <strong>{property.name}</strong>
        </div>
        <div className="property-3d-controls">
          {sceneState.viewMode !== "building" ? <button onClick={goBack} title="Back"><Undo2 size={16} /></button> : null}
          <button onClick={resetView} title="Reset camera"><RotateCcw size={16} /></button>
        </div>
      </header>
      <WebGLErrorBoundary fallback={<LegacyFallback floors={floors} selectedFloorId={focusedFloorId} onFloorSelect={focusFloor} onUnitSelect={selectUnit} />}>
        <Canvas shadows dpr={[1, 1.65]} gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}>
          <PerspectiveCamera makeDefault fov={38} position={[6, 5, 10]} />
          <Suspense fallback={<SceneLoader />}>
            <BuildingLighting />
            <Building3D
              floors={floors}
              selectedFloorId={focusedFloorId}
              selectedUnitId={selectedUnitId}
              focusMode={sceneState.viewMode !== "building"}
              onFloorSelect={focusFloor}
              onUnitSelect={selectUnit}
            />
            <ContactShadows position={[0, -0.05, 0]} opacity={0.28} scale={18} blur={2.6} far={4.5} />
            <CameraRig floors={floors} viewMode={sceneState.viewMode} selectedFloorIndex={selectedFloorIndex} />
            <Preload all />
          </Suspense>
        </Canvas>
      </WebGLErrorBoundary>
      <FloorRail floors={sortedFloors} selectedFloorId={focusedFloorId} onFloorSelect={focusFloor} />
    </section>
  );
}

function CameraRig({ floors, viewMode, selectedFloorIndex }: { floors: BuildingFloor[]; viewMode: ViewMode; selectedFloorIndex: number }) {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  return <CameraController floors={floors} viewMode={viewMode} selectedFloorIndex={selectedFloorIndex} controlsRef={controlsRef} />;
}

function SceneLoader() {
  return (
    <Html center className="property-3d-loader">
      Preparing property visualization...
    </Html>
  );
}

function FloorRail({ floors, selectedFloorId, onFloorSelect }: { floors: BuildingFloor[]; selectedFloorId?: string; onFloorSelect: (floorId: string) => void }) {
  return (
    <aside className="property-3d-floor-rail" aria-label="Floors">
      {floors.slice().reverse().map((floor) => (
        <button key={floor.id} className={floor.id === selectedFloorId ? "selected" : ""} onClick={() => onFloorSelect(floor.id)}>
          <strong>{floor.name}</strong>
          <span>{floor.units.length} units</span>
        </button>
      ))}
    </aside>
  );
}

function LegacyFallback({ floors, selectedFloorId, onFloorSelect, onUnitSelect }: { floors: BuildingFloor[]; selectedFloorId?: string; onFloorSelect: (floorId: string) => void; onUnitSelect: (unit: BuildingUnit) => void }) {
  return (
    <div className="property-3d-fallback">
      {floors.map((floor) => (
        <section key={floor.id}>
          <button className={floor.id === selectedFloorId ? "selected" : ""} onClick={() => onFloorSelect(floor.id)}>{floor.name}</button>
          <div>
            {floor.units.map((unit) => (
              <button key={unit.id} onClick={() => onUnitSelect(unit)}>{unit.unitNumber}</button>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

class WebGLErrorBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}
