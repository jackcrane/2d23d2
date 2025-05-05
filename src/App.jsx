import React, { useState, useRef, useEffect, useMemo } from "react";
import { OBJExporter } from "three/examples/jsm/exporters/OBJExporter";
import image from "../assets/slucam-logo-color.png";
import { ConfigPanel } from "./components/ConfigPanel";
import { Viewport } from "./components/Viewport";
import JSZip from "jszip";

export const cm = (m) => m * 10;

export const App = () => {
  const initialConfig = {
    rows: 5,
    cols: 7,
    radius: cm(0.5), // 0.5 cm becomes 5 mm.
    padding: cm(0.2), // 0.2 cm becomes 2 mm.
    color: "#00ff00",
    startX: 0,
    startZ: 0, // imageWidth and imageHeight will be set on image load.
  };

  const [config, setConfig] = useState(initialConfig);
  const sceneRef = useRef(null);
  const exportableRef = useRef(null);

  const [heightFunctionCode, setHeightFunctionCode] = useState(
    `(row, col, x, z, averageColor, colors) => {
  if(!averageColor) return -1;
  // Example: return height based on the sum of absolute x and z.
  console.log(averageColor);
  return averageColor.r / 255;
}`
  );

  const [colorFunctionCode, setColorFunctionCode] = useState(
    `(row, col, x, z, averageColor, colors) => {
  if(!averageColor) return { r: 255, g: 0, b: 255, a: 1 };
  // Example: return color based on averageColor values.
  return {
    r: averageColor.r,
    g: averageColor.g,
    b: averageColor.b,
    a: averageColor.a
  };
}`
  );

  const getHeightFunction = useMemo(() => {
    try {
      return eval(`(${heightFunctionCode})`);
    } catch (e) {
      console.error("Error compiling height function:", e);
      return (row, col, x, z, averageColor, colors) => 0;
    }
  }, [heightFunctionCode]);

  const getColorFunction = useMemo(() => {
    try {
      return eval(`(${colorFunctionCode})`);
    } catch (e) {
      console.error("Error compiling color function:", e);
      return (row, col, x, z, averageColor, colors) => ({
        r: 0,
        g: 0,
        b: 0,
        a: 1,
      });
    }
  }, [colorFunctionCode]);

  // Load the image into an off-screen canvas using scaled dimensions.
  const [imageData, setImageData] = useState(null);
  useEffect(() => {
    if (!config.image) {
      setImageData(null);
      return;
    }
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.src = config.image;
    img.onload = () => {
      // Scale the image so neither dimension exceeds 200 mm.
      const scale = Math.min(1, 200 / img.width, 200 / img.height);
      const scaledWidth = img.width * scale;
      const scaledHeight = img.height * scale;
      setConfig((prev) => ({
        ...prev,
        imageWidth: scaledWidth,
        imageHeight: scaledHeight,
      }));
      const canvas = document.createElement("canvas");
      canvas.width = scaledWidth;
      canvas.height = scaledHeight;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, scaledWidth, scaledHeight);
      const data = ctx.getImageData(0, 0, scaledWidth, scaledHeight);
      setImageData(data);
    };
  }, [config.image, setConfig]);

  const downloadOBJ = () => {
    if (!exportableRef.current) return;
    const exporter = new OBJExporter();
    let mtlString = "# Material Count\n";

    // Traverse the exportable scene and update each mesh's material name.
    exportableRef.current.traverse((child) => {
      if (child.isMesh && child.material) {
        const materialName = `Material_${child.name || child.uuid}`;
        child.material.name = materialName; // Ensure the material's name is set.
        mtlString += `newmtl ${materialName}\n`;
        mtlString += `Kd ${child.material.color.r} ${child.material.color.g} ${child.material.color.b}\n\n`;
      }
    });

    // Export the OBJ content.
    const objContent = exporter.parse(exportableRef.current);
    // Prepend the mtllib directive at the top of the OBJ file.
    const finalObjString = `mtllib materials.mtl\n` + objContent;
    const blob = new Blob([finalObjString], { type: "text/plain" });
    const mtlBlob = new Blob([mtlString], { type: "text/plain" });
    const objUrl = URL.createObjectURL(blob);
    const mtlUrl = URL.createObjectURL(mtlBlob);

    // Download the OBJ file.
    const linkObj = document.createElement("a");
    linkObj.href = objUrl;
    linkObj.download = "scene.obj";
    document.body.appendChild(linkObj);
    linkObj.click();
    document.body.removeChild(linkObj);

    // Download the MTL file.
    const linkMtl = document.createElement("a");
    linkMtl.href = mtlUrl;
    linkMtl.download = "materials.mtl";
    document.body.appendChild(linkMtl);
    linkMtl.click();
    document.body.removeChild(linkMtl);

    URL.revokeObjectURL(objUrl);
    URL.revokeObjectURL(mtlUrl);
  };

  const downloadZip = async () => {
    const zip = new JSZip();
    const { imageFile, ...configData } = config;
    const dataToSave = {
      config: configData,
      heightFunctionCode,
      colorFunctionCode,
    };
    zip.file("settings.json", JSON.stringify(dataToSave, null, 2));
    if (imageFile) {
      zip.file(imageFile.name, imageFile);
    }
    const content = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(content);
    const link = document.createElement("a");
    link.href = url;
    link.download = "settings.zip";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const loadZip = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const zip = await JSZip.loadAsync(file);
    const settingsFile = zip.file("settings.json");
    if (!settingsFile) return;
    const settingsText = await settingsFile.async("string");
    const loadedData = JSON.parse(settingsText);
    const newConfig = loadedData.config;
    // Check for an image file (assumes one image file is present with a common image extension)
    let imageFileEntry;
    zip.forEach((relativePath, zipEntry) => {
      if (
        relativePath !== "settings.json" &&
        /\.(png|jpe?g|gif)$/i.test(relativePath)
      ) {
        imageFileEntry = zipEntry;
      }
    });
    if (imageFileEntry) {
      const blob = await imageFileEntry.async("blob");
      const imageUrl = URL.createObjectURL(blob);
      newConfig.image = imageUrl;
      newConfig.imageFile = new File([blob], imageFileEntry.name, {
        type: blob.type,
      });
    }
    setConfig(newConfig);
    setHeightFunctionCode(loadedData.heightFunctionCode);
    setColorFunctionCode(loadedData.colorFunctionCode);
  };

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      <div style={{ flex: 1, position: "relative" }}>
        <Viewport
          config={config}
          sceneRef={sceneRef}
          exportableRef={exportableRef}
          getHeight={getHeightFunction}
          getColor={getColorFunction}
          imageData={imageData}
        />
        <img
          src={image}
          alt="SLUCAM logo"
          style={{
            width: 300,
            position: "absolute",
            bottom: 25,
            left: 25,
            opacity: 0.2,
            zIndex: -1,
          }}
        />
      </div>
      <div
        style={{
          width: "300px",
          borderLeft: "1px solid #ccc",
          padding: "10px",
          overflowY: "auto",
        }}
      >
        <ConfigPanel
          config={config}
          setConfig={setConfig}
          downloadOBJ={downloadOBJ}
          heightFunctionCode={heightFunctionCode}
          setHeightFunctionCode={setHeightFunctionCode}
          colorFunctionCode={colorFunctionCode}
          setColorFunctionCode={setColorFunctionCode}
        />
        <div style={{ marginTop: "20px" }}>
          <button onClick={downloadZip}>Download Settings Zip</button>
          <button
            style={{ marginLeft: "10px" }}
            onClick={() => document.getElementById("zipInput").click()}
          >
            Load Settings Zip
          </button>
          <input
            id="zipInput"
            type="file"
            accept=".zip"
            style={{ display: "none" }}
            onChange={loadZip}
          />
        </div>
      </div>
    </div>
  );
};

export default App;
