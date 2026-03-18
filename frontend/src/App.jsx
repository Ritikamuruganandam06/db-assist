import React, { useState, useEffect } from 'react';
import Chat from './components/Chat';
import Sidebar from './components/Sidebar';
import SchemaDisplay from './components/SchemaDisplay';
import './App.css';

const API_URL = 'http://localhost:8000';

function App() {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [schema, setSchema] = useState(null);
  const [recentSchemas, setRecentSchemas] = useState([]);
  const [chatHistory, setChatHistory] = useState([
    { id: 1, title: 'New Chat', messages: [] }
  ]);
  const [activeChatId, setActiveChatId] = useState(1);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleSendMessage = async (text) => {
    const userMsg = { role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    // Update chat history title from first message
    setChatHistory(prev =>
      prev.map(chat =>
        chat.id === activeChatId && chat.messages.length === 0
          ? { ...chat, title: text.slice(0, 40) + (text.length > 40 ? '...' : '') }
          : chat
      )
    );

    try {
      const res = await fetch(`${API_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_query: text }),
      });

      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const data = await res.json();

      const botMsg = { role: 'bot', content: data.content || 'No response received.' };
      setMessages(prev => [...prev, botMsg]);

      // Extract only SQL schema blocks from bot response
      const content = data.content || '';
      const sqlBlockRegex = /```(?:sql)?\s*\n([\s\S]*?)\n```/gi;
      const schemaStatementRegex = /((?:CREATE|ALTER|DROP)\s+TABLE[\s\S]*?;)/gi;
      
      let schemaBlocks = [];
      // First try to extract from markdown code blocks
      let match;
      while ((match = sqlBlockRegex.exec(content)) !== null) {
        const block = match[1].trim();
        if (/CREATE\s+TABLE|ALTER\s+TABLE|DROP\s+TABLE/i.test(block)) {
          schemaBlocks.push(block);
        }
      }
      // If no code blocks found, try to extract raw SQL statements
      if (schemaBlocks.length === 0) {
        while ((match = schemaStatementRegex.exec(content)) !== null) {
          schemaBlocks.push(match[1].trim());
        }
      }

      if (schemaBlocks.length > 0) {
        const schemaOnly = schemaBlocks.join('\n\n');
        const timestamp = new Date().toLocaleTimeString();
        setRecentSchemas(prev => [
          { id: Date.now(), content: schemaOnly, query: text, time: timestamp },
          ...prev.slice(0, 9)
        ]);
        setSchema(schemaOnly);
      }

      // Update chat history
      setChatHistory(prev =>
        prev.map(chat =>
          chat.id === activeChatId
            ? { ...chat, messages: [...chat.messages, userMsg, botMsg] }
            : chat
        )
      );
    } catch (err) {
      const errorMsg = { role: 'bot', content: `⚠️ Error: ${err.message}` };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefreshSchema = async () => {
    try {
      const res = await fetch(`${API_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_query: 'Show me the current database schema in markdown format' }),
      });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const data = await res.json();
      setSchema(data.content || null);
    } catch (err) {
      console.error('Failed to refresh schema:', err);
    }
  };

  const handleNewChat = () => {
    const newId = Date.now();
    const newChat = { id: newId, title: 'New Chat', messages: [] };
    setChatHistory(prev => [newChat, ...prev]);
    setActiveChatId(newId);
    setMessages([]);
  };

  const handleSelectChat = (chatId) => {
    setActiveChatId(chatId);
    const chat = chatHistory.find(c => c.id === chatId);
    setMessages(chat ? chat.messages : []);
  };

  const handleDeleteChat = (chatId) => {
    setChatHistory(prev => {
      const updated = prev.filter(c => c.id !== chatId);
      if (updated.length === 0) {
        const newChat = { id: Date.now(), title: 'New Chat', messages: [] };
        setActiveChatId(newChat.id);
        setMessages([]);
        return [newChat];
      }
      if (chatId === activeChatId) {
        setActiveChatId(updated[0].id);
        setMessages(updated[0].messages);
      }
      return updated;
    });
  };

  return (
    <div className="app-layout">
      <Sidebar
        chatHistory={chatHistory}
        activeChatId={activeChatId}
        onNewChat={handleNewChat}
        onSelectChat={handleSelectChat}
        onDeleteChat={handleDeleteChat}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />
      <main className={`main-content ${sidebarOpen ? '' : 'sidebar-closed'}`}>
        <Chat
          messages={messages}
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
        />
      </main>
      <SchemaDisplay schema={schema} recentSchemas={recentSchemas} onRefresh={handleRefreshSchema} />
    </div>
  );
}

export default App;