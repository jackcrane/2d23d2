import * as THREE from "three";
import React from "react";

export const NGon = ({
  sides = 6,
  radius = 0.5,
  depth = 1,
  extrudeProps = {},
  materialProps = {},
  meshProps = {},
  position = [0, 0, 0],
  rotation = [0, 0, 0],
}) => {
  const shape = new THREE.Shape();

  for (let i = 0; i <= sides; i++) {
    const angle = (i / sides) * Math.PI * 2;
    const x = radius * Math.cos(angle);
    const y = radius * Math.sin(angle);
    if (i === 0) {
      shape.moveTo(x, y);
    } else {
      shape.lineTo(x, y);
    }
  }

  const extrudeSettings = {
    depth,
    bevelEnabled: false,
    ...extrudeProps,
  };

  return (
    <mesh position={position} rotation={rotation} {...meshProps}>
      <extrudeGeometry args={[shape, extrudeSettings]} />
      <meshStandardMaterial
        color="#ff00ff"
        side={THREE.DoubleSide}
        {...materialProps}
      />
    </mesh>
  );
};
