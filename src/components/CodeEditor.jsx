import React from "react";
import AceEditor from "react-ace";

import "ace-builds/src-noconflict/mode-javascript";
import "ace-builds/src-noconflict/theme-tomorrow";
import "ace-builds/src-noconflict/ext-language_tools";

export const CodeEditor = ({ value, onChange }) => {
  const handleChange = (newValue) => {
    onChange(newValue);
    console.log("Height function code changed:", newValue);
  };

  return (
    <AceEditor
      placeholder="Enter height function code"
      mode="javascript"
      theme="tomorrow"
      name="heightFunctionEditor"
      fontSize={14}
      lineHeight={19}
      showPrintMargin={true}
      showGutter={true}
      highlightActiveLine={true}
      value={value}
      onChange={handleChange}
      setOptions={{
        enableBasicAutocompletion: true,
        enableLiveAutocompletion: true,
        enableSnippets: false,
        enableMobileMenu: true,
        showLineNumbers: true,
        tabSize: 2,
      }}
      width="100%"
      height="300px"
    />
  );
};
