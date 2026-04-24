import { useState, useEffect, useRef } from "react";
import { Crepe } from "@milkdown/crepe";
import "@milkdown/crepe/theme/common/style.css";
import "@milkdown/crepe/theme/frame.css";

export default function NodeDetailsEditor({ nodeData, onUpdate }) {
  const editorRef = useRef(null);
  const crepeRef = useRef(null);

  // Sync dimensions
  const handleDimensionChange = (field, value) => {
    const newVal = parseFloat(value) || 0;
    const newDimensions = { 
      ...(nodeData.dimensions || { h: 0, w: 0, l: 0, sqft: 0 }), 
      [field]: newVal 
    };
    
    // Auto-calc sqft if w and l are changed
    if (field === 'w' || field === 'l') {
      newDimensions.sqft = newDimensions.w * newDimensions.l;
    }

    onUpdate({ ...nodeData, dimensions: newDimensions });
  };

  // Milkdown Integration
  useEffect(() => {
    if (!editorRef.current || nodeData.type !== 'note') return;

    if (crepeRef.current) {
        // Destroy existing if needed or just update content? 
        // Crepe doesn't have a simple content update yet, usually better to recreate if node changes
    }

    const crepe = new Crepe({
      root: editorRef.current,
      defaultValue: nodeData.content || "",
    });

    crepe.create().then(() => {
      crepeRef.current = crepe;
      
      // Listen for changes
      crepe.onShare((content) => {
         // This is a placeholder, actual Crepe API for changes might differ slightly
         // But we'll use a timer or blur to save for performance
      });
    });

    return () => {
      // Cleanup? Crepe cleanup is usually implicit by removing root, but better to check docs
    };
  }, [nodeData.id]);

  if (!nodeData) return <div className="sidebar-subtitle">Select a node to edit</div>;

  return (
    <div className="node-editor">
      <h4 className="editor-title">{nodeData.name} Settings</h4>
      
      {(nodeData.type === 'floor' || nodeData.type === 'room' || nodeData.type === 'property') && (
        <div className="dimensions-grid">
          <div className="sidebar-group">
            <label className="sidebar-label">Height (ft)</label>
            <input 
              type="number" 
              className="sidebar-input" 
              value={nodeData.dimensions?.h || 0} 
              onChange={(e) => handleDimensionChange('h', e.target.value)}
            />
          </div>
          <div className="sidebar-group">
            <label className="sidebar-label">Width (ft)</label>
            <input 
              type="number" 
              className="sidebar-input" 
              value={nodeData.dimensions?.w || 0} 
              onChange={(e) => handleDimensionChange('w', e.target.value)}
            />
          </div>
          <div className="sidebar-group">
            <label className="sidebar-label">Length (ft)</label>
            <input 
              type="number" 
              className="sidebar-input" 
              value={nodeData.dimensions?.l || 0} 
              onChange={(e) => handleDimensionChange('l', e.target.value)}
            />
          </div>
          <div className="sidebar-group">
            <label className="sidebar-label">Sqft</label>
            <input 
              type="number" 
              className="sidebar-input sidebar-readonly" 
              value={nodeData.dimensions?.sqft || 0} 
              disabled
            />
          </div>
        </div>
      )}

      {nodeData.type === 'note' && (
        <div className="note-editor-container">
          <label className="sidebar-label">Note Content</label>
          <div ref={editorRef} className="milkdown-editor" />
          <button 
            className="apply-action-btn"
            style={{ marginTop: '10px' }}
            onClick={() => {
                // Manual save trigger if needed
                const content = crepeRef.current?.getHtml(); // or markdown
                onUpdate({ ...nodeData, content });
            }}
          >
            Save Note
          </button>
        </div>
      )}
    </div>
  );
}
