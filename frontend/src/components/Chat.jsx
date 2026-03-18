import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const Chat = ({ messages, onSendMessage, isLoading }) => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  }, [input]);

  const handleSubmit = () => {
    if (!input.trim() || isLoading) return;
    onSendMessage(input);
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="chat-container">
      {/* Input at TOP */}
      <div className="chat-input-area">
        <div className="chat-input-wrapper">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask me about your database..."
            rows={1}
            id="chat-input"
            disabled={isLoading}
          />
          <button
            className="send-btn"
            onClick={handleSubmit}
            disabled={!input.trim() || isLoading}
            id="send-btn"
            title="Send message"
          >
            ▲
          </button>
        </div>
      </div>

      {/* Messages below, scrolling down */}
      <div className="chat-messages" id="chat-messages">
        {messages.length === 0 && !isLoading && (
          <div className="welcome-state">
            <h2>QueryGenie</h2>
            <p>
              Your AI-powered database assistant. Ask me to create schemas,
              run queries, manage tables, or anything PostgreSQL related.
            </p>
          </div>
        )}

        {messages.map((msg, idx) => (
          <div key={idx} className={`message-row ${msg.role}`}>
            {msg.role === 'user' ? (
              /* User message: right-aligned bubble */
              <div className="user-bubble">
                {msg.content}
              </div>
            ) : (
              /* Bot message: full-width left-aligned like ChatGPT */
              <div className="bot-message">
                <div className="bot-avatar">🤖</div>
                <div className="bot-content">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {msg.content}
                  </ReactMarkdown>
                </div>
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="message-row bot">
            <div className="bot-message">
              <div className="bot-avatar">🤖</div>
              <div className="loading-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};

export default Chat;
