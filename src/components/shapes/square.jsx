import React from "react";
import * as THREE from "three";

export const Square = () => {
  const shape = new THREE.Shape();
  shape.moveTo(-0.5, -0.5);
  shape.lineTo(0.5, -0.5);
  shape.lineTo(0.5, 0.5);
  shape.lineTo(-0.5, 0.5);
  shape.lineTo(-0.5, -0.5);

  const extrudeSettings = {
    depth: 1,
    bevelEnabled: false,
  };

  return (
    <mesh>
      <extrudeGeometry args={[shape, extrudeSettings]} />
      <meshStandardMaterial color="#ffff00" side={THREE.DoubleSide} />
    </mesh>
  );
};
