import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Plus, Trash2 } from 'lucide-react';

export default function Goals() {
  const [goals, setGoals] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ title: '', description: '', deadline: '', priority: 'medium' });

  useEffect(() => {
    loadGoals();
  }, []);

  const loadGoals = async () => {
    try {
      const data = await api.getGoals('active');
      setGoals(data);
    } catch (error) {
      console.error('Failed to load goals:', error);
    }
  };

  const createGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createGoal(formData);
      setFormData({ title: '', description: '', deadline: '', priority: 'medium' });
      setShowForm(false);
      loadGoals();
    } catch (error) {
      console.error('Failed to create goal:', error);
    }
  };

  const deleteGoal = async (id: string) => {
    try {
      await api.deleteGoal(id);
      loadGoals();
    } catch (error) {
      console.error('Failed to delete goal:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Goals</h1>
          <p className="text-gray-500 mt-1">Track and manage your long-term goals.</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
        >
          <Plus className="w-4 h-4" />
          New Goal
        </button>
      </div>

      {showForm && (
        <form onSubmit={createGoal} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              rows={3}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Deadline</label>
              <input
                type="date"
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>
          <div className="flex gap-3">
            <button type="submit" className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700">
              Create Goal
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300">
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {goals.length === 0 ? (
          <div className="col-span-full text-center text-gray-500 py-12">
            <p className="text-lg font-medium">No goals yet</p>
            <p className="text-sm mt-1">Create your first goal to get started.</p>
          </div>
        ) : (
          goals.map((goal) => (
            <div key={goal.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">{goal.title}</h3>
                  {goal.description && <p className="text-sm text-gray-500 mt-1">{goal.description}</p>}
                </div>
                <button onClick={() => deleteGoal(goal.id)} className="text-red-600 hover:text-red-700">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="mt-4 flex items-center gap-2">
                <span className={`px-2 py-1 text-xs rounded-full ${
                  goal.priority === 'high' ? 'bg-red-100 text-red-700' :
                  goal.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {goal.priority}
                </span>
                {goal.deadline && (
                  <span className="text-xs text-gray-500">Due: {new Date(goal.deadline).toLocaleDateString()}</span>
                )}
              </div>
              {goal.progress > 0 && (
                <div className="mt-3">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-primary-600 h-2 rounded-full" style={{ width: `${goal.progress}%` }}></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{goal.progress}% complete</p>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
