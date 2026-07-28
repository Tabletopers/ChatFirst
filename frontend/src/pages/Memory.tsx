import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Plus, Trash2, Search } from 'lucide-react';

export default function Memory() {
  const [memories, setMemories] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [formData, setFormData] = useState({ content: '', category: 'general', importance: 5 });

  useEffect(() => {
    loadMemories();
  }, [search]);

  const loadMemories = async () => {
    try {
      const data = await api.getMemories(search ? { search } : undefined);
      setMemories(data);
    } catch (error) {
      console.error('Failed to load memories:', error);
    }
  };

  const createMemory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createMemory(formData);
      setFormData({ content: '', category: 'general', importance: 5 });
      setShowForm(false);
      loadMemories();
    } catch (error) {
      console.error('Failed to create memory:', error);
    }
  };

  const deleteMemory = async (id: string) => {
    try {
      await api.deleteMemory(id);
      loadMemories();
    } catch (error) {
      console.error('Failed to delete memory:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Long-Term Memory</h1>
          <p className="text-gray-500 mt-1">Your AI's persistent memory across all conversations.</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
        >
          <Plus className="w-4 h-4" />
          Add Memory
        </button>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search memories..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      {showForm && (
        <form onSubmit={createMemory} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Memory Content</label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              rows={3}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value="general">General</option>
                <option value="preferences">Preferences</option>
                <option value="context">Context</option>
                <option value="goals">Goals</option>
                <option value="habits">Habits</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Importance (1-10)</label>
              <input
                type="number"
                min="1"
                max="10"
                value={formData.importance}
                onChange={(e) => setFormData({ ...formData, importance: Number(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
          <div className="flex gap-3">
            <button type="submit" className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700">
              Save Memory
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300">
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {memories.length === 0 ? (
          <div className="col-span-full text-center text-gray-500 py-12">
            <p className="text-lg font-medium">No memories yet</p>
            <p className="text-sm mt-1">Add memories to help your AI companion remember important details.</p>
          </div>
        ) : (
          memories.map((memory) => (
            <div key={memory.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-start justify-between">
                <span className="text-xs font-medium text-primary-600 bg-primary-50 px-2 py-1 rounded-full">
                  {memory.category}
                </span>
                <button onClick={() => deleteMemory(memory.id)} className="text-red-600 hover:text-red-700">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <p className="mt-3 text-gray-800 text-sm">{memory.content}</p>
              <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                <span>Importance: {memory.importance}/10</span>
                <span>{new Date(memory.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
