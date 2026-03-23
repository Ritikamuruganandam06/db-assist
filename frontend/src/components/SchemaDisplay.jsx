import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const SchemaDisplay = ({ schema, recentSchemas = [], onRefresh }) => {
  const [spinning, setSpinning] = useState(false);
  const [expandedId, setExpandedId] = useState(null);

  const handleRefresh = async () => {
    setSpinning(true);
    await onRefresh();
    setTimeout(() => setSpinning(false), 800);
  };

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="schema-panel">
      <div className="schema-header">
        <h2>
          <span className="icon">🗄️</span>
          Schema
        </h2>
        <button
          className={`refresh-btn ${spinning ? 'spinning' : ''}`}
          onClick={handleRefresh}
          id="refresh-schema-btn"
        >
          <span className="refresh-icon">↻</span>
          Refresh
        </button>
      </div>

      <div className="schema-content">
        {/* Current schema from db.json */}
        {schema && (
          <div className="schema-current">
            <div className="schema-section-title">Current Schema</div>
            <div className="schema-markdown">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {schema}
              </ReactMarkdown>
            </div>
          </div>
        )}

        {/* Recent schemas */}
        {recentSchemas.length > 0 && (
          <div className="schema-recent">
            <div className="schema-section-title">Recently Used</div>
            {recentSchemas.map((item) => (
              <div
                key={item.id}
                className={`recent-schema-item ${expandedId === item.id ? 'expanded' : ''}`}
              >
                <div
                  className="recent-schema-header"
                  onClick={() => toggleExpand(item.id)}
                >
                  <div className="recent-schema-info">
                    <span className="recent-schema-icon">📄</span>
                    <span className="recent-schema-query">{item.query}</span>
                  </div>
                  <span className="recent-schema-time">{item.time}</span>
                </div>
                {expandedId === item.id && (
                  <div className="recent-schema-content">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {item.content}
                    </ReactMarkdown>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!schema && recentSchemas.length === 0 && (
          <div className="schema-empty">
            <div className="empty-icon">📋</div>
            <p>No schema available yet.</p>
            <p>Start a conversation to create your database schema.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SchemaDisplay;
