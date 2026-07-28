const API_BASE = '/api';

class ApiClient {
  private accessToken: string | null = null;

  setToken(token: string | null) {
    this.accessToken = token;
    if (token) {
      localStorage.setItem('chatfirst_token', token);
    } else {
      localStorage.removeItem('chatfirst_token');
    }
  }

  getToken(): string | null {
    if (!this.accessToken) {
      this.accessToken = localStorage.getItem('chatfirst_token');
    }
    return this.accessToken;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = this.getToken();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    };

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      this.setToken(null);
      window.location.href = '/login';
      throw new Error('Unauthorized');
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || 'Request failed');
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return response.json();
  }

  // Auth
  async register(data: { email: string; password: string; name: string }) {
    const result = await this.request<{ user: any; accessToken: string; refreshToken: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    this.setToken(result.accessToken);
    return result;
  }

  async login(data: { email: string; password: string }) {
    const result = await this.request<{ user: any; accessToken: string; refreshToken: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    this.setToken(result.accessToken);
    return result;
  }

  async refresh(token: string) {
    const result = await this.request<{ accessToken: string }>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken: token }),
    });
    this.setToken(result.accessToken);
    return result;
  }

  // User
  async getMe() {
    return this.request<any>('/users/me');
  }

  async updatePersona(data: { persona_tone: string; preferences?: Record<string, any> }) {
    return this.request<any>('/users/persona', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Memory
  async getMemories(params?: { category?: string; search?: string }) {
    const query = new URLSearchParams(params as any).toString();
    return this.request<any[]>(`/memory?${query}`);
  }

  async createMemory(data: { content: string; category?: string; importance?: number }) {
    return this.request<any>('/memory', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async deleteMemory(id: string) {
    return this.request<any>(`/memory/${id}`, { method: 'DELETE' });
  }

  // Goals
  async getGoals(status?: string) {
    const query = status ? `?status=${status}` : '';
    return this.request<any[]>(`/goals${query}`);
  }

  async createGoal(data: { title: string; description?: string; deadline?: string; priority?: string }) {
    return this.request<any>('/goals', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateGoal(id: string, data: any) {
    return this.request<any>(`/goals/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteGoal(id: string) {
    return this.request<any>(`/goals/${id}`, { method: 'DELETE' });
  }

  // Accountability
  async getCommitments(status?: string) {
    const query = status ? `?status=${status}` : '';
    return this.request<any[]>(`/accountability/commitments${query}`);
  }

  async createCommitment(data: { description: string; goal_id?: string; frequency?: string }) {
    return this.request<any>('/accountability/commitments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async createCheckin(data: { commitment_id: string; note?: string; completed: boolean }) {
    return this.request<any>('/accountability/checkins', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getCheckins(commitmentId?: string) {
    const query = commitmentId ? `?commitment_id=${commitmentId}` : '';
    return this.request<any[]>(`/accountability/checkins${query}`);
  }

  async getAccountabilityStats() {
    return this.request<any>('/accountability/stats');
  }

  // Calendar
  async getCalendarEvents(start?: string, end?: string) {
    const params = new URLSearchParams();
    if (start) params.set('start', start);
    if (end) params.set('end', end);
    const query = params.toString();
    return this.request<any[]>(`/calendar/events?${query}`);
  }

  async createCalendarEvent(data: { title: string; start_time: string; end_time: string; metadata?: any }) {
    return this.request<any>('/calendar/events', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async deleteCalendarEvent(id: string) {
    return this.request<any>(`/calendar/events/${id}`, { method: 'DELETE' });
  }

  // Chat
  async getChatHistory() {
    return this.request<any[]>('/chat/history');
  }

  async sendChatMessage(message: string, context?: any) {
    return this.request<any>('/chat/message', {
      method: 'POST',
      body: JSON.stringify({ message, context }),
    });
  }

  async clearChatHistory() {
    return this.request<any>('/chat/history', { method: 'DELETE' });
  }

  // Bots
  async getBotGroups() {
    return this.request<any[]>('/bots/groups');
  }

  async createBotGroup(data: { name: string; description?: string }) {
    return this.request<any>('/bots/groups', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getBotMessages(groupId: string) {
    return this.request<any[]>(`/bots/groups/${groupId}/messages`);
  }

  async sendBotMessage(groupId: string, message: string) {
    return this.request<any>(`/bots/groups/${groupId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
  }

  // Proactive
  async getNotifications(unreadOnly = false) {
    const query = unreadOnly ? '?unread_only=true' : '';
    return this.request<any[]>(`/proactive/notifications${query}`);
  }

  async triggerProactiveCheckin() {
    return this.request<any>('/proactive/send-checkin', { method: 'POST' });
  }

  async markNotificationRead(id: string) {
    return this.request<any>(`/proactive/notifications/${id}/read`, { method: 'PATCH' });
  }
}

export const api = new ApiClient();
