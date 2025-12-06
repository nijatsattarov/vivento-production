import React from 'react';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getRoot, $createParagraphNode, $createTextNode } from 'lexical';

// Plugin to set initial content
function InitialContentPlugin({ content }) {
  const [editor] = useLexicalComposerContext();

  React.useEffect(() => {
    if (content) {
      editor.update(() => {
        const root = $getRoot();
        root.clear();
        
        // Parse HTML and create nodes
        const div = document.createElement('div');
        div.innerHTML = content;
        const textContent = div.textContent || div.innerText || '';
        
        const paragraph = $createParagraphNode();
        const textNode = $createTextNode(textContent);
        paragraph.append(textNode);
        root.append(paragraph);
      });
    }
  }, []);

  return null;
}

const LexicalEditor = ({ value, onChange, placeholder }) => {
  const initialConfig = {
    namespace: 'AdminPagesEditor',
    theme: {
      paragraph: 'lexical-paragraph',
      text: {
        bold: 'lexical-bold',
        italic: 'lexical-italic',
        underline: 'lexical-underline',
      },
    },
    onError: (error) => {
      console.error('Lexical error:', error);
    },
  };

  const handleChange = (editorState) => {
    editorState.read(() => {
      const root = $getRoot();
      const textContent = root.getTextContent();
      
      // For now, just send plain text
      // TODO: Add proper HTML serialization if needed
      onChange(textContent);
    });
  };

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <div className="lexical-editor-container bg-white rounded-lg border">
        <RichTextPlugin
          contentEditable={
            <ContentEditable
              className="lexical-editor-input min-h-[400px] p-4 focus:outline-none"
              aria-label={placeholder || "Text editor"}
            />
          }
          placeholder={
            <div className="lexical-editor-placeholder absolute top-4 left-4 text-gray-400 pointer-events-none">
              {placeholder || 'Məzmun daxil edin...'}
            </div>
          }
          ErrorBoundary={LexicalErrorBoundary}
        />
        <HistoryPlugin />
        <OnChangePlugin onChange={handleChange} />
        <InitialContentPlugin content={value} />
      </div>
    </LexicalComposer>
  );
};

export default LexicalEditor;
