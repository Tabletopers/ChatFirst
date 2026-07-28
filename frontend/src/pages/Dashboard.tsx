import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Calendar, Target, Flame, Bell } from 'lucide-react';

export default function Dashboard() {
  const [stats, setStats] = useState<any>(null);
  const [goals, setGoals] = useState<any[]>([]);
  const [commitments, setCommitments] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [statsData, goalsData, commitmentsData, notificationsData] = await Promise.all([
        api.getAccountabilityStats(),
        api.getGoals('active'),
        api.getCommitments('active'),
        api.getNotifications(true),
      ]);
      setStats(statsData);
      setGoals(goalsData);
      setCommitments(commitmentsData);
      setNotifications(notificationsData);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Welcome back! Here's your overview.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Active Goals</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats?.activeCommitments || 0}</p>
            </div>
            <Target className="w-8 h-8 text-primary-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Completed</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats?.totalCompleted || 0}</p>
            </div>
            <Flame className="w-8 h-8 text-orange-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Best Streak</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats?.bestStreak || 0} days</p>
            </div>
            <Calendar className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Notifications</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{notifications.length}</p>
            </div>
            <Bell className="w-8 h-8 text-blue-500" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">Active Goals</h2>
          </div>
          <div className="p-6">
            {goals.length === 0 ? (
              <p className="text-gray-500 text-sm">No active goals yet. Create your first goal!</p>
            ) : (
              <div className="space-y-3">
                {goals.slice(0, 5).map((goal) => (
                  <div key={goal.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{goal.title}</p>
                      <p className="text-sm text-gray-500">{goal.category}</p>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      goal.priority === 'high' ? 'bg-red-100 text-red-700' :
                      goal.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {goal.priority}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">Active Commitments</h2>
          </div>
          <div className="p-6">
            {commitments.length === 0 ? (
              <p className="text-gray-500 text-sm">No active commitments. Add one to stay accountable!</p>
            ) : (
              <div className="space-y-3">
                {commitments.slice(0, 5).map((commitment) => (
                  <div key={commitment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{commitment.description}</p>
                      <p className="text-sm text-gray-500">{commitment.frequency} &middot; Streak: {commitment.streak || 0}</p>
                    </div>
                    <span className="text-orange-600 font-semibold">{commitment.streak || 0} day streak</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {notifications.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-blue-900 mb-3">Recent Notifications</h2>
          <div className="space-y-2">
            {notifications.slice(0, 3).map((notification) => (
              <div key={notification.id} className="bg-white p-4 rounded-lg shadow-sm">
                <p className="font-medium text-gray-900">{notification.title}</p>
                <p className="text-sm text-gray-600 mt-1">{notification.body}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
