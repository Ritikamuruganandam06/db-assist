import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

function ToolCallBlock({ name, args }) {
  const [open, setOpen] = useState(false);

  let display = '';
  if (name === 'sql_query_execution_tool' && args.query) {
    display = args.query;
  } else if (name === 'write_markdown_schema_tool' && args.markdown_schema) {
    display = args.markdown_schema;
  } else {
    display = JSON.stringify(args, null, 2);
  }

  return (
    <div className="tool-call-block">
      <div className="tool-call-header" onClick={() => setOpen(!open)}>
        <span className="tool-toggle">{open ? '▾' : '▸'}</span>
        <span>calling</span>
        <span className="tool-name">{name}</span>
      </div>
      {open && <div className="tool-call-content">{display}</div>}
    </div>
  );
}

function ToolResultBlock({ name, content }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="tool-result-block">
      <div className="tool-result-header" onClick={() => setOpen(!open)}>
        <span className="tool-toggle">{open ? '▾' : '▸'}</span>
        <span>{name} result</span>
      </div>
      {open && <div className="tool-result-content">{content}</div>}
    </div>
  );
}

function MessageContent({ items }) {
  return items.map((item, i) => {
    if (item.type === 'text') {
      return (
        <ReactMarkdown key={i} remarkPlugins={[remarkGfm]}>
          {item.content}
        </ReactMarkdown>
      );
    }
    if (item.type === 'tool_call') {
      return <ToolCallBlock key={i} name={item.name} args={item.args} />;
    }
    if (item.type === 'tool_result') {
      return <ToolResultBlock key={i} name={item.name} content={item.content} />;
    }
    return null;
  });
}

const Chat = ({ messages, onSendMessage, isLoading }) => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading]);

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
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="chat-container">
      <div className="chat-messages">
        {messages.length === 0 && !isLoading && (
          <div className="welcome-state">
            <h2>QueryGenie</h2>
            <p>Ask me to create schemas, run queries, manage tables, or anything PostgreSQL related.</p>
          </div>
        )}

        {messages.map((msg, idx) => (
          <div key={idx} className={`message-row ${msg.role === 'user' ? 'user' : 'bot'}`}>
            {msg.role === 'user' ? (
              <div className="user-bubble">{msg.content}</div>
            ) : (
              <div className="bot-message">
                <div className="bot-avatar">Q</div>
                <div className="bot-content">
                  {msg.items ? (
                    <>
                      <MessageContent items={msg.items} />
                      {msg.streaming && (
                        <div className="streaming-status">
                          <span>processing...</span>
                        </div>
                      )}
                    </>
                  ) : (
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {msg.content}
                    </ReactMarkdown>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}

        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-area">
        <div className="chat-input-wrapper">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask me about your database..."
            rows={1}
            disabled={isLoading}
          />
          <button
            className="send-btn"
            onClick={handleSubmit}
            disabled={!input.trim() || isLoading}
          >
            ↑
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chat;
