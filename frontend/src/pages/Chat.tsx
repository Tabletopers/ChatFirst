import { useState, useEffect, useRef } from 'react';
import { api } from '../lib/api';
import { Send, Trash2, AlertCircle } from 'lucide-react';

export default function Chat() {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadHistory();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadHistory = async () => {
    try {
      const history = await api.getChatHistory();
      setMessages(history);
    } catch (err: any) {
      console.error('Failed to load chat history:', err);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    setError(null);

    try {
      const response = await api.sendChatMessage(input);
      setMessages((prev) => [...prev, { role: 'assistant', content: response.content, created_at: response.created_at }]);
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to send message';
      setError(errorMsg);
      console.error('Failed to send message:', err);
    } finally {
      setLoading(false);
    }
  };

  const clearHistory = async () => {
    try {
      await api.clearChatHistory();
      setMessages([]);
      setError(null);
    } catch (err: any) {
      console.error('Failed to clear history:', err);
    }
  };

  return (
    <div className="h-[calc(100vh-6rem)] md:h-[calc(100vh-8rem)] flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-gray-900">Chat</h1>
        <button
          onClick={clearHistory}
          className="flex items-center gap-2 text-red-600 hover:text-red-700 text-sm"
        >
          <Trash2 className="w-4 h-4" />
          Clear History
        </button>
      </div>

      <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
          {messages.length === 0 && !error && (
            <div className="text-center text-gray-500 mt-20">
              <p className="text-lg font-medium">Start a conversation</p>
              <p className="text-sm mt-1">Chat with your AI companion about your goals, habits, and plans.</p>
            </div>
          )}

          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[80%] md:max-w-[70%] p-3 md:p-4 ${
                  msg.role === 'user' ? 'chat-bubble-user' : 'chat-bubble-assistant'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="chat-bubble-assistant p-4">
                <div className="flex space-x-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="flex justify-start">
              <div className="bg-red-50 text-red-700 p-3 rounded-lg flex items-center gap-2 max-w-[80%]">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <p className="text-sm">{error}</p>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={sendMessage} className="p-3 md:p-4 border-t border-gray-100">
          <div className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="bg-primary-600 text-white p-3 rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
