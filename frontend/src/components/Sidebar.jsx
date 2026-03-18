import React from 'react';

const Sidebar = ({
  chatHistory,
  activeChatId,
  onNewChat,
  onSelectChat,
  onDeleteChat,
  isOpen,
  onToggle,
}) => {
  return (
    <>
      {/* Toggle button visible when sidebar is closed */}
      {!isOpen && (
        <button className="sidebar-toggle-btn open-btn" onClick={onToggle} title="Open sidebar">
          ☰
        </button>
      )}

      <aside className={`sidebar ${isOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <h2 className="sidebar-title">
             QueryGenie
          </h2>
          <button className="sidebar-close-btn" onClick={onToggle} title="Close sidebar">
            ✕
          </button>
        </div>

        <button className="new-chat-btn" onClick={onNewChat} id="new-chat-btn">
          <span className="plus-icon">+</span> New Chat
        </button>

        <div className="chat-history-list">
          {chatHistory.map((chat) => (
            <div
              key={chat.id}
              className={`chat-history-item ${chat.id === activeChatId ? 'active' : ''}`}
              onClick={() => onSelectChat(chat.id)}
            >
              <span className="chat-icon">💬</span>
              <span className="chat-title">{chat.title}</span>
              <button
                className="delete-chat-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteChat(chat.id);
                }}
                title="Delete chat"
              >
                🗑
              </button>
            </div>
          ))}
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
