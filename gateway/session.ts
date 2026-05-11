// ============================================
// 💬 SESSION MANAGER - Tracks conversations
// ============================================

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

export class Session {
  public userId: string;
  public userName: string;
  public createdAt: Date;
  public lastActivity: Date;
  private history: Message[] = [];

  constructor(userId: string, userName: string) {
    this.userId = userId;
    this.userName = userName;
    this.createdAt = new Date();
    this.lastActivity = new Date();
  }

  addMessage(role: 'user' | 'assistant', content: string) {
    this.history.push({
      role,
      content,
      timestamp: new Date()
    });
    this.lastActivity = new Date();

    // Keep only last 50 messages to save memory
    if (this.history.length > 50) {
      this.history = this.history.slice(-50);
    }
  }

  getHistory(): Message[] {
    return this.history;
  }

  clearHistory() {
    this.history = [];
  }
}

export class SessionManager {
  private sessions: Map<string, Session> = new Map();

  getOrCreate(userId: string, userName: string): Session {
    let session = this.sessions.get(userId);
    
    if (!session) {
      session = new Session(userId, userName);
      this.sessions.set(userId, session);
      console.log(`📝 Created new session for ${userName} (${userId})`);
    }
    
    return session;
  }

  get(userId: string): Session | undefined {
    return this.sessions.get(userId);
  }

  // Remove sessions inactive for more than 24 hours
  cleanupOldSessions() {
    const now = new Date();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours

    for (const [userId, session] of this.sessions) {
      const age = now.getTime() - session.lastActivity.getTime();
      if (age > maxAge) {
        this.sessions.delete(userId);
        console.log(`🧹 Cleaned up old session for ${userId}`);
      }
    }
  }
}
