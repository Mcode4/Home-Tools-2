import React, { useMemo, useCallback } from "react";
import MilkdownEditor from "./MilkdownEditor";
import "./NoteCanvas.css";

export default function NoteCanvas({ noteData, onUpdate }) {
    // If we have legacy blocks but no content, join them into markdown
    const activeContent = useMemo(() => {
        if (noteData.content) return noteData.content;
        if (noteData.blocks && noteData.blocks.length > 0) {
            return noteData.blocks.map(b => {
                if (b.type === 'rich_text') return b.data;
                if (b.type === 'inspector_findings') {
                    const findings = b.data.map(f => `- ${f.label}: ${f.status.toUpperCase()}`).join("\n");
                    return `### Inspector Findings\n${findings}`;
                }
                if (b.type === 'builder_cost') {
                    const costs = b.data.map(c => `| ${c.item} | ${c.est} | ${c.act} |`).join("\n");
                    return `### Cost Tracker\n| Item | Est. | Act. |\n| --- | --- | --- |\n${costs}`;
                }
                return "";
            }).join("\n\n");
        }
        return "";
    }, [noteData.content, noteData.blocks]);

    const handleContentChange = useCallback((newMarkdown) => {
        // Sync back to parent. We clear blocks to signal migration to markdown-only.
        onUpdate({ ...noteData, content: newMarkdown, blocks: [] });
    }, [noteData, onUpdate]);

    return (
        <div className="note-canvas">
            <MilkdownEditor 
                noteId={noteData.id}
                content={activeContent} 
                onChange={handleContentChange} 
            />
        </div>
    );
}
