import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const SchemaDisplay = ({ schema, onRefresh }) => {
  return (
    <div className="schema-panel">
      <div className="schema-header">
        <h2>Schema</h2>
        <button className="refresh-btn" onClick={onRefresh}>
          Refresh
        </button>
      </div>

      <div className="schema-content">
        {schema ? (
          <div className="schema-markdown">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {schema}
            </ReactMarkdown>
          </div>
        ) : (
          <div className="schema-empty">
            <p>No schema yet.</p>
            <p>Start a conversation to create your database schema.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SchemaDisplay;
