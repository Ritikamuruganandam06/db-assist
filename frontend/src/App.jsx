import React, { useState, useEffect, useMemo } from 'react';
import Chat from './components/Chat';
import Sidebar from './components/Sidebar';
import SchemaDisplay from './components/SchemaDisplay';
import './App.css';

const API_URL = 'http://localhost:8000';

// Split full schema markdown into { tableName: markdownSection }
const parseSchemaIntoTables = (schemaMarkdown) => {
  if (!schemaMarkdown) return {};
  const sections = schemaMarkdown.split(/(?=###\s)/);
  const tables = {};
  for (const section of sections) {
    const nameMatch = section.match(/^###\s+(\w+)/);
    if (nameMatch) {
      tables[nameMatch[1].toLowerCase()] = section.trim();
    }
  }
  return tables;
};

// Build bidirectional relationship map from REFERENCES constraints
const buildRelationships = (tableMap) => {
  const relations = {};
  for (const [tableName, sectionMd] of Object.entries(tableMap)) {
    if (!relations[tableName]) relations[tableName] = new Set();
    for (const match of sectionMd.matchAll(/REFERENCES\s+(\w+)/gi)) {
      const ref = match[1].toLowerCase();
      if (!relations[ref]) relations[ref] = new Set();
      relations[tableName].add(ref);
      relations[ref].add(tableName);
    }
  }
  return relations;
};

function App() {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [fullSchema, setFullSchema] = useState(null);
  const [activeTables, setActiveTables] = useState(() => {
    const saved = localStorage.getItem('activeTables');
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });
  const [recentSchemas, setRecentSchemas] = useState([]);
  const [chatHistory, setChatHistory] = useState([
    { id: 1, title: 'New Chat', messages: [] }
  ]);
  const [activeChatId, setActiveChatId] = useState(1);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const tableMap = useMemo(() => parseSchemaIntoTables(fullSchema), [fullSchema]);
  const relations = useMemo(() => buildRelationships(tableMap), [tableMap]);

  // Filtered schema: active tables + their directly related tables
  // Falls back to full schema on initial load (no interaction yet)
  const schema = useMemo(() => {
    if (activeTables.size === 0) return fullSchema;
    const toShow = new Set(activeTables);
    for (const t of activeTables) {
      if (relations[t]) {
        for (const related of relations[t]) toShow.add(related);
      }
    }
    const sections = [...toShow].filter(t => tableMap[t]).map(t => tableMap[t]);
    return sections.length > 0 ? sections.join('\n\n') : null;
  }, [activeTables, tableMap, relations]);

  const handleSendMessage = async (text) => {
    const userMsg = { role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

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

      const content = data.content || '';

      // Re-fetch schema (agent may have created/altered tables)
      const schemaRes = await fetch(`${API_URL}/schema`);
      const schemaData = schemaRes.ok ? await schemaRes.json() : {};
      const latestSchema = schemaData.schema || null;
      if (latestSchema) setFullSchema(latestSchema);

      // Find which known tables are mentioned in the query + bot response
      const currentTableMap = parseSchemaIntoTables(latestSchema || fullSchema);
      const combinedText = text + ' ' + content;
      const mentioned = new Set();
      for (const tableName of Object.keys(currentTableMap)) {
        if (new RegExp(`\\b${tableName}\\b`, 'i').test(combinedText)) {
          mentioned.add(tableName);
        }
      }

      if (mentioned.size > 0) {
        setActiveTables(mentioned);
        localStorage.setItem('activeTables', JSON.stringify([...mentioned]));
      }

      // Track in recentSchemas
      const sqlBlockRegex = /```(?:sql)?\s*\n([\s\S]*?)\n```/gi;
      const schemaStatementRegex = /((?:CREATE|ALTER|DROP)\s+TABLE[\s\S]*?;)/gi;
      let schemaBlocks = [];
      let match;
      while ((match = sqlBlockRegex.exec(content)) !== null) {
        const block = match[1].trim();
        if (/CREATE\s+TABLE|ALTER\s+TABLE|DROP\s+TABLE/i.test(block)) {
          schemaBlocks.push(block);
        }
      }
      if (schemaBlocks.length === 0) {
        while ((match = schemaStatementRegex.exec(content)) !== null) {
          schemaBlocks.push(match[1].trim());
        }
      }
      if (schemaBlocks.length > 0) {
        const timestamp = new Date().toLocaleTimeString();
        setRecentSchemas(prev => [
          { id: Date.now(), content: schemaBlocks.join('\n\n'), query: text, time: timestamp },
          ...prev.slice(0, 9)
        ]);
      }

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
      const res = await fetch(`${API_URL}/schema`);
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const data = await res.json();
      const fetched = data.schema || null;
      setFullSchema(fetched);
    } catch (err) {
      console.error('Failed to fetch schema:', err);
    }
  };

  useEffect(() => {
    handleRefreshSchema();
  }, []);

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
      <SchemaDisplay schema={schema} recentSchemas={recentSchemas} />
    </div>
  );
}

export default App;
