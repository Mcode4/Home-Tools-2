import React from 'react';
import { Milkdown, MilkdownProvider, useEditor } from '@milkdown/react';
import { Editor, rootCtx, defaultValueCtx } from '@milkdown/core';
import { commonmark } from '@milkdown/preset-commonmark';
import { listener, listenerCtx } from '@milkdown/plugin-listener';
import { nord } from '@milkdown/theme-nord';

// Nord Editor Internal Component (Matching ai-manager reference)
function EditorInternal({ content, onChange, noteId }) {
  useEditor((root) => {
    return Editor.make()
      .config(nord)
      .config((ctx) => {
        ctx.set(rootCtx, root);
        ctx.set(defaultValueCtx, content || '');
        ctx.get(listenerCtx).markdownUpdated((ctx, markdown, prevMarkdown) => {
          if (markdown !== prevMarkdown) {
            onChange(markdown);
          }
        });
      })
      .use(commonmark)
      .use(listener);
  }, [noteId]); // Re-create editor ONLY when noteId changes, matching reference

  return <Milkdown />;
}

export default function MilkdownEditor({ content, onChange, noteId }) {
    return (
        <div className="milkdown-workstation-container">
            <MilkdownProvider>
                <EditorInternal content={content} onChange={onChange} noteId={noteId} />
            </MilkdownProvider>
            
        </div>
    );
}
