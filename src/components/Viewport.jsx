import React from "react";
import { useLoader, Canvas } from "@react-three/fiber";
import { TextureLoader } from "three";
import {
  OrbitControls,
  Environment,
  GizmoHelper,
  GizmoViewport,
  Grid,
} from "@react-three/drei";
import { NGon } from "./shapes/ngon";
import { getPolygonColors } from "../util/getPolygonColors";

export const ImagePlane = ({ config }) => {
  if (!config.image) return null;
  const texture = useLoader(TextureLoader, config.image);
  return (
    <mesh position={[0, -0.2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[config.imageWidth, config.imageHeight]} />
      <meshBasicMaterial map={texture} transparent />
    </mesh>
  );
};

export const Viewport = ({
  config,
  sceneRef,
  exportableRef,
  getHeight,
  getColor,
  imageData,
}) => {
  const HEX_WIDTH = config.radius * 2 + config.padding;
  const HEX_HEIGHT = Math.sqrt(3) * config.radius + config.padding;

  return (
    <Canvas
      camera={{ position: [0, 150, 150], fov: 50, near: 0.1, far: 10000 }}
      onCreated={({ scene }) => {
        sceneRef.current = scene;
      }}
    >
      <OrbitControls makeDefault />
      <Environment preset="city" />
      <GizmoHelper alignment="bottom-right" margin={[80, 80]}>
        <GizmoViewport
          axisColors={["#9d4b4b", "#2f7f4f", "#3b5b9d"]}
          labelColor="white"
        />
      </GizmoHelper>
      <Grid
        cellSize={10}
        sectionSize={100}
        cellColor="#6f6f6f"
        sectionColor="#9d4b4b"
        fadeDistance={10000}
        position={[0, 0, 0]}
        followCamera
        infiniteGrid
      />
      <ambientLight intensity={1} />
      <directionalLight position={[50, 50, 50]} />
      <ImagePlane config={config} />
      <group ref={exportableRef}>
        {Array.from({ length: config.rows }).map((_, row) =>
          Array.from({ length: config.cols }).map((_, col) => {
            const x = col * HEX_WIDTH * 0.75;
            const z = row * HEX_HEIGHT + (col % 2 === 1 ? HEX_HEIGHT / 2 : 0);
            const posX =
              x - (config.cols * HEX_WIDTH * 0.75) / 2 + config.startX;
            const posZ = z - (config.rows * HEX_HEIGHT) / 2 + config.startZ;

            let avgColor = null;
            let colorsArray = [];
            if (imageData) {
              const result = getPolygonColors(
                posX,
                posZ,
                config.radius,
                imageData,
                config
              );
              avgColor = result.averageColor;
              colorsArray = result.colors;
            }

            const heightValue = getHeight(
              row,
              col,
              posX,
              posZ,
              avgColor,
              colorsArray
            );

            const colorValue = getColor(
              row,
              col,
              posX,
              posZ,
              avgColor,
              colorsArray
            );

            return (
              <NGon
                key={`${row}-${col}`}
                position={[posX, 0, posZ]}
                radius={config.radius}
                depth={heightValue}
                materialProps={{
                  color: `rgb(${colorValue.r}, ${colorValue.g}, ${colorValue.b})`,
                }}
                rotation={[-Math.PI / 2, 0, 0]}
              />
            );
          })
        )}
      </group>
    </Canvas>
  );
};
