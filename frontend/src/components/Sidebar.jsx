import React from 'react';

const Sidebar = ({
  threads,
  activeThreadId,
  onNewChat,
  onSelectThread,
  onDeleteThread,
  isOpen,
  onToggle,
  theme,
  onThemeChange,
}) => {
  return (
    <>
      {!isOpen && (
        <button className="sidebar-toggle-btn" onClick={onToggle}>
          ☰
        </button>
      )}

      <aside className={`sidebar ${isOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <h2 className="sidebar-title">QueryGenie</h2>
          <button className="sidebar-close-btn" onClick={onToggle}>
            ✕
          </button>
        </div>

        <button className="new-chat-btn" onClick={onNewChat}>
          + New Chat
        </button>

        <div className="chat-history-list">
          {threads.map((thread) => (
            <div
              key={thread.id}
              className={`chat-history-item ${thread.id === activeThreadId ? 'active' : ''}`}
              onClick={() => onSelectThread(thread.id)}
            >
              <span className="chat-title">{thread.name}</span>
              <button
                className="delete-chat-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteThread(thread.id);
                }}
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        <div className="theme-switcher">
          {['system', 'light', 'dark'].map((t) => (
            <button
              key={t}
              className={`theme-btn ${theme === t ? 'active' : ''}`}
              onClick={() => onThemeChange(t)}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
