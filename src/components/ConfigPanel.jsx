import React, { useState } from "react";
import { CodeEditor } from "./CodeEditor";

export const ConfigPanel = ({
  config,
  setConfig,
  downloadOBJ,
  heightFunctionCode,
  setHeightFunctionCode,
  colorFunctionCode,
  setColorFunctionCode,
}) => {
  const [showModal, setShowModal] = useState(false);
  // Local state to hold the unsaved height function code.
  const [editorCode, setEditorCode] = useState("");

  const [showColorModal, setShowColorModal] = useState(false);
  // Local state to hold the unsaved color function code.
  const [editorColorCode, setEditorColorCode] = useState("");

  const openModal = () => {
    // Initialize the local code state with the saved height function code.
    setEditorCode(heightFunctionCode);
    setShowModal(true);
  };

  const handleSave = () => {
    // Update the saved height function code only when Save is clicked.
    setHeightFunctionCode(editorCode);
    setShowModal(false);
  };

  const handleCancel = () => {
    // Simply close the modal without saving changes.
    setShowModal(false);
  };

  const openColorModal = () => {
    setEditorColorCode(colorFunctionCode);
    setShowColorModal(true);
  };

  const handleColorSave = () => {
    setColorFunctionCode(editorColorCode);
    setShowColorModal(false);
  };

  const handleColorCancel = () => {
    setShowColorModal(false);
  };

  const handleChange = (key, value) =>
    setConfig((prev) => ({ ...prev, [key]: value }));

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, 200 / img.width, 200 / img.height);
        const defaultWidth = img.width * scale;
        const defaultHeight = img.height * scale;
        const aspect = img.width / img.height;
        setConfig((prev) => ({
          ...prev,
          image: url,
          imageFile: file,
          imageWidth: defaultWidth,
          imageHeight: defaultHeight,
          imageAspect: aspect,
          imageLinked: true,
        }));
      };
      img.src = url;
    }
  };

  const handleImageWidthChange = (e) => {
    const newWidth = parseFloat(e.target.value);
    if (config.imageLinked && config.imageAspect) {
      const newHeight = newWidth / config.imageAspect;
      setConfig((prev) => ({
        ...prev,
        imageWidth: newWidth,
        imageHeight: newHeight,
      }));
    } else {
      setConfig((prev) => ({ ...prev, imageWidth: newWidth }));
    }
  };

  const handleImageHeightChange = (e) => {
    const newHeight = parseFloat(e.target.value);
    if (config.imageLinked && config.imageAspect) {
      const newWidth = newHeight * config.imageAspect;
      setConfig((prev) => ({
        ...prev,
        imageHeight: newHeight,
        imageWidth: newWidth,
      }));
    } else {
      setConfig((prev) => ({ ...prev, imageHeight: newHeight }));
    }
  };

  return (
    <div>
      <h2>Configuration</h2>
      <div style={{ marginBottom: "10px" }}>
        <label>Rows: </label>
        <input
          type="number"
          value={config.rows}
          onChange={(e) => handleChange("rows", parseInt(e.target.value))}
        />
      </div>
      <div style={{ marginBottom: "10px" }}>
        <label>Columns: </label>
        <input
          type="number"
          value={config.cols}
          onChange={(e) => handleChange("cols", parseInt(e.target.value))}
        />
      </div>
      <div style={{ marginBottom: "10px" }}>
        <label>Radius (cm): </label>
        <input
          type="number"
          step="0.01"
          value={config.radius / 10}
          onChange={(e) =>
            handleChange("radius", parseFloat(e.target.value) * 10)
          }
        />
      </div>
      <div style={{ marginBottom: "10px" }}>
        <label>Padding (cm): </label>
        <input
          type="number"
          step="0.01"
          value={config.padding / 10}
          onChange={(e) =>
            handleChange("padding", parseFloat(e.target.value) * 10)
          }
        />
      </div>
      <div style={{ marginBottom: "10px" }}>
        <label>Color: </label>
        <input
          type="color"
          value={config.color}
          onChange={(e) => handleChange("color", e.target.value)}
        />
      </div>
      <div style={{ marginBottom: "10px" }}>
        <label>Start X (mm): </label>
        <input
          type="number"
          value={config.startX}
          onChange={(e) => handleChange("startX", parseFloat(e.target.value))}
        />
      </div>
      <div style={{ marginBottom: "10px" }}>
        <label>Start Z (mm): </label>
        <input
          type="number"
          value={config.startZ}
          onChange={(e) => handleChange("startZ", parseFloat(e.target.value))}
        />
      </div>
      <div style={{ marginBottom: "10px" }}>
        <label>Upload Image: </label>
        <input type="file" accept="image/*" onChange={handleImageUpload} />
      </div>
      {config.image && (
        <>
          <div style={{ marginBottom: "10px" }}>
            <label>Image Width (mm): </label>
            <input
              type="number"
              value={config.imageWidth}
              onChange={handleImageWidthChange}
            />
          </div>
          <div style={{ marginBottom: "10px" }}>
            <label>Image Height (mm): </label>
            <input
              type="number"
              value={config.imageHeight}
              onChange={handleImageHeightChange}
            />
          </div>
          <div style={{ marginBottom: "10px" }}>
            <label>
              <input
                type="checkbox"
                checked={config.imageLinked ?? true}
                onChange={() =>
                  setConfig((prev) => ({
                    ...prev,
                    imageLinked: !prev.imageLinked,
                  }))
                }
              />
              Link Dimensions
            </label>
          </div>
        </>
      )}
      <button onClick={openModal}>Describe height function</button>
      <button onClick={openColorModal}>Describe color function</button>
      <button onClick={downloadOBJ}>Download OBJ</button>
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button onClick={handleCancel}>Close</button>
            <CodeEditor value={editorCode} onChange={setEditorCode} />
            <div style={{ marginTop: "10px" }}>
              <button onClick={handleSave}>Save</button>
              <button onClick={handleCancel} style={{ marginLeft: "10px" }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      {showColorModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button onClick={handleColorCancel}>Close</button>
            <CodeEditor value={editorColorCode} onChange={setEditorColorCode} />
            <div style={{ marginTop: "10px" }}>
              <button onClick={handleColorSave}>Save</button>
              <button
                onClick={handleColorCancel}
                style={{ marginLeft: "10px" }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConfigPanel;
