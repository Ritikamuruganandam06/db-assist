import React, { useState, useEffect, useCallback } from 'react';
import Chat from './components/Chat';
import Sidebar from './components/Sidebar';
import SchemaDisplay from './components/SchemaDisplay';
import './App.css';

const API = 'http://localhost:8000';

function buildMessagesFromHistory(raw) {
  const messages = [];
  let currentBot = null;

  for (const msg of raw) {
    if (msg.role === 'user') {
      if (currentBot) {
        messages.push({ role: 'bot', items: currentBot });
        currentBot = null;
      }
      messages.push({ role: 'user', content: msg.content });
    } else if (msg.role === 'assistant') {
      if (!currentBot) currentBot = [];
      if (msg.tool_calls && msg.tool_calls.length > 0) {
        for (const tc of msg.tool_calls) {
          currentBot.push({ type: 'tool_call', name: tc.name, args: tc.args });
        }
      }
      if (msg.content) {
        currentBot.push({ type: 'text', content: msg.content });
      }
    } else if (msg.role === 'tool') {
      if (!currentBot) currentBot = [];
      currentBot.push({ type: 'tool_result', name: msg.name, content: msg.content });
    }
  }

  if (currentBot) {
    messages.push({ role: 'bot', items: currentBot });
  }

  return messages;
}

function applyTheme(theme) {
  const root = document.documentElement;
  if (theme === 'system') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    root.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
  } else {
    root.setAttribute('data-theme', theme);
  }
}

function App() {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [schema, setSchema] = useState(null);
  const [threads, setThreads] = useState([]);
  const [activeThreadId, setActiveThreadId] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'system');

  useEffect(() => {
    applyTheme(theme);
    localStorage.setItem('theme', theme);
    if (theme === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = () => applyTheme('system');
      mq.addEventListener('change', handler);
      return () => mq.removeEventListener('change', handler);
    }
  }, [theme]);

  const fetchSchema = useCallback(async () => {
    try {
      const res = await fetch(`${API}/schema`);
      const data = await res.json();
      setSchema(data.schema || null);
    } catch (e) {
      console.error('Failed to fetch schema:', e);
    }
  }, []);

  const fetchThreads = useCallback(async () => {
    try {
      const res = await fetch(`${API}/threads`);
      const data = await res.json();
      setThreads(data.threads || []);
    } catch (e) {
      console.error('Failed to fetch threads:', e);
    }
  }, []);

  const loadThreadMessages = useCallback(async (threadId) => {
    try {
      const res = await fetch(`${API}/threads/${threadId}/messages`);
      const data = await res.json();
      setMessages(buildMessagesFromHistory(data.messages || []));
    } catch (e) {
      console.error('Failed to load messages:', e);
      setMessages([]);
    }
  }, []);

  useEffect(() => {
    fetchSchema();
    fetchThreads();
  }, [fetchSchema, fetchThreads]);

  const handleNewChat = async () => {
    const threadId = crypto.randomUUID();
    try {
      await fetch(`${API}/threads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ thread_id: threadId }),
      });
      await fetchThreads();
      setActiveThreadId(threadId);
      setMessages([]);
    } catch (e) {
      console.error('Failed to create thread:', e);
    }
  };

  const handleSelectThread = async (threadId) => {
    setActiveThreadId(threadId);
    await loadThreadMessages(threadId);
  };

  const handleDeleteThread = async (threadId) => {
    try {
      await fetch(`${API}/threads/${threadId}`, { method: 'DELETE' });
      await fetchThreads();
      if (threadId === activeThreadId) {
        setActiveThreadId(null);
        setMessages([]);
      }
    } catch (e) {
      console.error('Failed to delete thread:', e);
    }
  };

  const handleSendMessage = async (text) => {
    if (!activeThreadId) {
      const threadId = crypto.randomUUID();
      try {
        await fetch(`${API}/threads`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ thread_id: threadId }),
        });
        setActiveThreadId(threadId);
        await streamChat(text, threadId);
        await fetchThreads();
      } catch (e) {
        console.error('Failed to create thread:', e);
      }
      return;
    }
    const isFirstMessage = messages.length === 0;
    await streamChat(text, activeThreadId);
    if (isFirstMessage) await fetchThreads();
  };

  const streamChat = async (text, threadId) => {
    const userMsg = { role: 'user', content: text };
    const botMsg = { role: 'bot', items: [], streaming: true };

    setMessages(prev => [...prev, userMsg, botMsg]);
    setIsLoading(true);

    const items = [];

    const updateBotMessage = () => {
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = { role: 'bot', items: [...items], streaming: true };
        return updated;
      });
    };

    try {
      const res = await fetch(`${API}/chat/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_query: text, thread_id: threadId }),
      });

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let eventType = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop();

        for (const line of lines) {
          if (line.startsWith('event: ')) {
            eventType = line.slice(7);
          } else if (line.startsWith('data: ') && eventType) {
            const data = JSON.parse(line.slice(6));

            if (eventType === 'tool_call') {
              items.push({ type: 'tool_call', name: data.name, args: data.args });
              updateBotMessage();
            } else if (eventType === 'tool_result') {
              items.push({ type: 'tool_result', name: data.name, content: data.content });
              updateBotMessage();
              fetchSchema();
            } else if (eventType === 'response') {
              items.push({ type: 'text', content: data.content });
              updateBotMessage();
            } else if (eventType === 'error') {
              items.push({ type: 'text', content: `Error: ${data.message}` });
              updateBotMessage();
            }
            eventType = null;
          }
        }
      }

      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = { role: 'bot', items: [...items] };
        return updated;
      });
      await fetchSchema();
    } catch (e) {
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = { role: 'bot', items: [{ type: 'text', content: `Error: ${e.message}` }] };
        return updated;
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="app-layout">
      <Sidebar
        threads={threads}
        activeThreadId={activeThreadId}
        onNewChat={handleNewChat}
        onSelectThread={handleSelectThread}
        onDeleteThread={handleDeleteThread}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        theme={theme}
        onThemeChange={setTheme}
      />
      <main className={`main-content ${sidebarOpen ? '' : 'sidebar-closed'}`}>
        <Chat
          messages={messages}
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
        />
      </main>
      <SchemaDisplay schema={schema} onRefresh={fetchSchema} />
    </div>
  );
}

export default App;
