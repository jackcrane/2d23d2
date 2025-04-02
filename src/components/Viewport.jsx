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

// Helper: sample pixel colors under the polygon.
const getPolygonColors = (posX, posZ, radius, imageData, config) => {
  if (!imageData) return { averageColor: null, colors: [] };

  const { width: imgWidth, height: imgHeight, data } = imageData;

  // Convert world coordinates (relative to image plane) to pixel coordinates.
  const worldToPixel = (x, z) => {
    const u = (x + config.imageWidth / 2) / config.imageWidth;
    const v = (config.imageHeight / 2 - z) / config.imageHeight;
    const px = Math.floor(u * imgWidth);
    const py = Math.floor(v * imgHeight);
    return { px, py };
  };

  // Define bounding box in world coordinates.
  const minX = posX - radius;
  const maxX = posX + radius;
  const minZ = posZ - radius;
  const maxZ = posZ + radius;
  const topLeft = worldToPixel(minX, maxZ);
  const bottomRight = worldToPixel(maxX, minZ);

  const startX = Math.max(0, topLeft.px);
  const endX = Math.min(imgWidth - 1, bottomRight.px);
  const startY = Math.max(0, topLeft.py);
  const endY = Math.min(imgHeight - 1, bottomRight.py);

  let totalR = 0,
    totalG = 0,
    totalB = 0,
    count = 0;
  let colors = [];

  const samplingStep = 4; // sample every 4 pixels for better performance

  for (let py = startY; py <= endY; py += samplingStep) {
    for (let px = startX; px <= endX; px += samplingStep) {
      // Convert pixel coordinates back to world coordinates.
      const x = (px / imgWidth) * config.imageWidth - config.imageWidth / 2;
      const z = config.imageHeight / 2 - (py / imgHeight) * config.imageHeight;
      // Check if the pixel is within the circular polygon area.
      if ((x - posX) ** 2 + (z - posZ) ** 2 <= radius ** 2) {
        const index = (py * imgWidth + px) * 4;
        const r = data[index];
        const g = data[index + 1];
        const b = data[index + 2];
        totalR += r;
        totalG += g;
        totalB += b;
        count++;
        const hex = `#${((1 << 24) + (r << 16) + (g << 8) + b)
          .toString(16)
          .slice(1)}`;
        colors.push(hex);
      }
    }
  }

  if (count === 0) return { averageColor: null, colors: [] };

  const avgR = Math.round(totalR / count);
  const avgG = Math.round(totalG / count);
  const avgB = Math.round(totalB / count);
  const averageColor = `#${((1 << 24) + (avgR << 16) + (avgG << 8) + avgB)
    .toString(16)
    .slice(1)}`;

  return { averageColor, colors };
};

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
            return (
              <NGon
                key={`${row}-${col}`}
                position={[posX, 0, posZ]}
                radius={config.radius}
                depth={heightValue}
                materialProps={{ color: config.color }}
                rotation={[-Math.PI / 2, 0, 0]}
              />
            );
          })
        )}
      </group>
    </Canvas>
  );
};
