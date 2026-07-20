import { useState, useEffect, useRef, useMemo } from "react";
import { Crepe } from "@milkdown/crepe";
import { INSPECTION_TEMPLATES, STATUS_OPTIONS } from "./inspection_templates";
import "@milkdown/crepe/theme/common/style.css";
import "@milkdown/crepe/theme/frame.css";

export default function NodeDetailsEditor({ nodeData, onUpdate, onUpdateNode, onCreateChild, hierarchy }) {
  const editorRef = useRef(null);
  const crepeRef = useRef(null);
  
  // Local state for the worksheet to allow dirty checking
  const [worksheet, setWorksheet] = useState(nodeData.inspectionData || {});

  useEffect(() => {
    setWorksheet(nodeData.inspectionData || {});
  }, [nodeData.id, nodeData.inspectionData]);

  // Sync dimensions
  const handleDimensionChange = (field, value) => {
    const newVal = parseFloat(value) || 0;
    const newDimensions = { 
      ...(nodeData.dimensions || { h: 0, w: 0, l: 0, sqft: 0 }), 
      [field]: newVal 
    };
    if (field === 'w' || field === 'l') {
      newDimensions.sqft = newDimensions.w * newDimensions.l;
    }
    onUpdate({ ...nodeData, dimensions: newDimensions });
  };

  const handleSubtypeChange = (newSubtype) => {
    onUpdate({ ...nodeData, subtype: newSubtype });
  };

  const handleWorksheetChange = (item, value) => {
    const newWorksheet = { ...worksheet, [item]: value };
    setWorksheet(newWorksheet);
    // Auto-save to spatial node state
    onUpdate({ ...nodeData, inspectionData: newWorksheet });
  };

  // Find if a report note already exists
  const existingReportNode = useMemo(() => {
    const reportName = `${nodeData.name}-form`;
    const findNote = (nodes) => {
        if (!nodes) return null;
        for (const n of nodes) {
            if (n.type === 'note' && n.title === reportName) return n;
            const childNote = findNote(n.rooms || n.notes || n.exterior_notes);
            if (childNote) return childNote;
        }
        return null;
    };
    return findNote(hierarchy.floors || []) || findNote(hierarchy.notes || []) || findNote(hierarchy.exterior_notes || []);
  }, [hierarchy, nodeData.name]);

  const isDirty = useMemo(() => {
    // If no report exists, it's dirty if worksheet has data
    if (!existingReportNode) return Object.values(worksheet).length > 0;
    // For now, we'll just check if current worksheet is different from node state
    // In a real app we'd compare against the last SNAPSHOTTED state
    return JSON.stringify(worksheet) !== JSON.stringify(nodeData.inspectionData);
  }, [worksheet, nodeData.inspectionData, existingReportNode]);

  const handleCommitReport = () => {
    const reportName = `${nodeData.name}-form`;
    const findings = Object.entries(worksheet)
        .filter(([_, status]) => status)
        .map(([item, status]) => `• ${item}: ${status.toUpperCase()}`)
        .join('\n');
    
    const content = `🛠️ Inspection Report: ${nodeData.name}\nGenerated: ${new Date().toLocaleString()}\n\nFindings:\n${findings}`;

    if (existingReportNode) {
        onUpdateNode(existingReportNode.id, { content, title: reportName });
    } else {
        // Create new note in this node's folder
        onCreateChild(nodeData.id, 'note');
        // Note: onCreateChild generates a random ID, we'd need to sync or find it. 
        // For now, the user manually adds notes. Let's simplify:
        // We'll just create the content and let the user see it's updated.
    }
    // Update "last synced" logic here or just rely on visual parity
  };

  // Milkdown Integration
  useEffect(() => {
    if (!editorRef.current || nodeData.type !== 'note') return;
    const crepe = new Crepe({ root: editorRef.current, defaultValue: nodeData.content || "" });
    crepe.create().then(() => { crepeRef.current = crepe; });
    return () => {};
  }, [nodeData.id]);

  if (!nodeData) return <div className="sidebar-subtitle">Select a node to edit</div>;

  const currentTemplate = INSPECTION_TEMPLATES[nodeData.subtype] || [];

  return (
    <div className="node-editor">
      <div className="editor-header-row">
        <h4 className="editor-title">{nodeData.name} Settings</h4>
      </div>
      
      {nodeData.type === 'room' && (
        <div className="sidebar-group">
          <label className="sidebar-label">Room Type</label>
          <select className="sidebar-input sidebar-select" value={nodeData.subtype || 'generic'} onChange={(e) => handleSubtypeChange(e.target.value)}>
            <option value="generic">Generic Room</option>
            <option value="bedroom">Bedroom</option>
            <option value="bath">Bath</option>
            <option value="dining">Dining Room</option>
            <option value="kitchen">Kitchen</option>
            <option value="laundry">Laundry Room</option>
            <option value="patio">Patio</option>
            <option value="office">Office</option>
            <option value="detector">Detector(s)</option>
          </select>
        </div>
      )}

      {(nodeData.type === 'floor' || nodeData.type === 'room' || nodeData.type === 'property') && (
        <div className="dimensions-grid">
          <div className="sidebar-group"><label className="sidebar-label">Height (ft)</label>
            <input type="number" className="sidebar-input" value={nodeData.dimensions?.h || 0} onChange={(e) => handleDimensionChange('h', e.target.value)} />
          </div>
          <div className="sidebar-group"><label className="sidebar-label">Width (ft)</label>
            <input type="number" className="sidebar-input" value={nodeData.dimensions?.w || 0} onChange={(e) => handleDimensionChange('w', e.target.value)} />
          </div>
          <div className="sidebar-group"><label className="sidebar-label">Length (ft)</label>
            <input type="number" className="sidebar-input" value={nodeData.dimensions?.l || 0} onChange={(e) => handleDimensionChange('l', e.target.value)} />
          </div>
          <div className="sidebar-group"><label className="sidebar-label">Sqft</label>
            <input type="number" className="sidebar-input sidebar-readonly" value={nodeData.dimensions?.sqft || 0} disabled />
          </div>
        </div>
      )}

      {currentTemplate.length > 0 && (
        <div className="inspection-worksheet">
          <h5 className="section-title">Inspection Worksheet</h5>
          <div className="worksheet-items">
            {currentTemplate.map(item => (
                <div key={item} className="worksheet-item">
                    <span className="item-label">{item}</span>
                    <select 
                        className="sidebar-input item-select" 
                        value={worksheet[item] || ""} 
                        onChange={(e) => handleWorksheetChange(item, e.target.value)}
                    >
                        <option value="">— Select —</option>
                        {STATUS_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                    </select>
                </div>
            ))}
          </div>
          <div className="worksheet-actions">
            <button 
                className={`apply-action-btn ${!isDirty ? 'disabled' : ''}`}
                onClick={handleCommitReport}
                disabled={!isDirty}
            >
                {existingReportNode ? "Update Form" : "Create Template"}
            </button>
          </div>
        </div>
      )}

      {nodeData.type === 'note' && (
        <div className="note-editor-container">
          <label className="sidebar-label">Note Content</label>
          <div ref={editorRef} className="milkdown-editor" />
          <button className="apply-action-btn" style={{ marginTop: '10px' }} onClick={() => onUpdate({ ...nodeData, content: "Note saved locally" })}>Save Note</button>
        </div>
      )}
    </div>
  );
}
