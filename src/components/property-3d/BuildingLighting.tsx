export function BuildingLighting() {
  return (
    <>
      <hemisphereLight args={["#eef6ff", "#b7a99a", 1.75]} />
      <directionalLight position={[6, 9, 5]} intensity={2.2} castShadow shadow-mapSize={[1024, 1024]} shadow-camera-near={1} shadow-camera-far={35} shadow-camera-left={-14} shadow-camera-right={14} shadow-camera-top={14} shadow-camera-bottom={-14} />
      <ambientLight intensity={0.35} />
    </>
  );
}
