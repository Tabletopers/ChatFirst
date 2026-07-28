import { useState, useEffect } from 'react';
import { api } from '../lib/api';

export default function Settings() {
  const [persona, setPersona] = useState('supportive');
  const [notifications, setNotifications] = useState({ in_app: true, email: false });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const user = await api.getMe();
      setPersona(user.persona_tone || 'supportive');
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const savePersona = async () => {
    try {
      await api.updatePersona({ persona_tone: persona, preferences: notifications });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 mt-1">Customize your ChatFirst experience.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">AI Persona</h2>
          <p className="text-sm text-gray-500 mb-4">Choose how your AI companion communicates with you.</p>
          <div className="grid grid-cols-1 gap-3">
            {[
              { value: 'supportive', label: 'Supportive', desc: 'Warm, encouraging, and gentle but firm' },
              { value: 'strict', label: 'Strict', desc: 'Direct, concise, and focused on results' },
              { value: 'gentle', label: 'Gentle', desc: 'Kind and patient, no pressure' },
              { value: 'professional', label: 'Professional', desc: 'Formal, efficient, organized' },
              { value: 'casual', label: 'Casual', desc: 'Friendly peer, light and supportive' },
            ].map((option) => (
              <label
                key={option.value}
                className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${
                  persona === option.value ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="persona"
                  value={option.value}
                  checked={persona === option.value}
                  onChange={(e) => setPersona(e.target.value)}
                  className="w-4 h-4 text-primary-600"
                />
                <div className="ml-3">
                  <p className="font-medium text-gray-900">{option.label}</p>
                  <p className="text-sm text-gray-500">{option.desc}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div className="border-t border-gray-100 pt-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Notifications</h2>
          <div className="space-y-3">
            <label className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">In-App Notifications</p>
                <p className="text-sm text-gray-500">Receive proactive check-ins in the app</p>
              </div>
              <input
                type="checkbox"
                checked={notifications.in_app}
                onChange={(e) => setNotifications({ ...notifications, in_app: e.target.checked })}
                className="w-5 h-5 text-primary-600 rounded"
              />
            </label>
            <label className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Email Notifications</p>
                <p className="text-sm text-gray-500">Receive check-ins via email</p>
              </div>
              <input
                type="checkbox"
                checked={notifications.email}
                onChange={(e) => setNotifications({ ...notifications, email: e.target.checked })}
                className="w-5 h-5 text-primary-600 rounded"
              />
            </label>
          </div>
        </div>

        <div className="border-t border-gray-100 pt-6">
          <button
            onClick={savePersona}
            className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700"
          >
            {saved ? 'Saved!' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
}
