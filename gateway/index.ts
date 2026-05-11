// ============================================
// 🚀 MAIN GATEWAY - Entry Point
// ============================================

import dotenv from 'dotenv';
import { TelegramChannel } from '../channels/telegram';
import { ModelManager } from '../brain/models';
import { MemoryManager } from '../memory/manager';
import { SessionManager, Session } from './session';

// Load environment variables
dotenv.config();

class AgentGateway {
  private sessions: SessionManager;
  private models: ModelManager;
  private memory: MemoryManager;
  private telegram: TelegramChannel | null = null;

  constructor() {
    console.log('🤖 Initializing AI Agent Gateway...');
    
    this.sessions = new SessionManager();
    this.models = new ModelManager();
    this.memory = new MemoryManager();
  }

  async start() {
    console.log('🚀 Starting Gateway...');

    // Start Telegram channel
    if (process.env.TELEGRAM_BOT_TOKEN) {
      this.telegram = new TelegramChannel(this);
      console.log('✅ Telegram channel connected!');
    } else {
      console.log('⚠️ No TELEGRAM_BOT_TOKEN found. Telegram disabled.');
    }

    // Start heartbeat for scheduled tasks
    this.startHeartbeat();

    console.log('');
    console.log('============================================');
    console.log('🎉 AI AGENT IS RUNNING!');
    console.log('============================================');
    console.log('');
    console.log('📱 Open Telegram and message your bot!');
    console.log('');
  }

  // Handle incoming messages from any channel
  async handleMessage(
    channel: string,
    userId: string,
    userName: string,
    message: string
  ): Promise<string> {
    
    console.log(`📨 [${channel}] ${userName}: ${message}`);

    // Security check - only allow your user ID
    const allowedUserId = process.env.ALLOWED_USER_ID;
    if (allowedUserId && userId !== allowedUserId) {
      console.log(`🚫 Blocked message from unauthorized user: ${userId}`);
      return '🚫 Sorry, this bot is private.';
    }

    // Get or create session for this user
    const session = this.sessions.getOrCreate(userId, userName);

    // Load memory context
    const longTermMemory = this.memory.getLongTermMemory();
    const todayLog = this.memory.getTodayLog();

    // Build context for AI
    const systemPrompt = this.buildSystemPrompt(session, longTermMemory, todayLog);

    // Add message to session history
    session.addMessage('user', message);

    // Get AI response
    const response = await this.models.generateResponse(
      systemPrompt,
      session.getHistory()
    );

    // Save response to session
    session.addMessage('assistant', response);

    // Log to daily memory
    this.memory.appendToLog(`**${userName}:** ${message}`);
    this.memory.appendToLog(`**Agent:** ${response}`);
    this.memory.appendToLog('---');

    console.log(`🤖 [${channel}] Agent: ${response.substring(0, 100)}...`);

    return response;
  }

  private buildSystemPrompt(
    session: Session,
    longTermMemory: string,
    todayLog: string
  ): string {
    const now = new Date().toLocaleString();
    
    return `You are a helpful personal AI assistant.

## YOUR PERSONALITY
- Friendly, helpful, and concise
- You remember past conversations
- You help with tasks, answer questions, and have casual chats

## CURRENT TIME
${now}

## LONG-TERM MEMORY (Things you remember about the user)
${longTermMemory || 'No long-term memories yet.'}

## TODAY'S CONVERSATION LOG
${todayLog || 'This is the start of today\'s conversation.'}

## RULES
1. Be helpful and friendly
2. Keep responses concise unless asked for detail
3. If you learn something important about the user, mention you'll remember it
4. If you don't know something, say so honestly
`;
  }

  // Heartbeat runs every minute for scheduled tasks
  private startHeartbeat() {
    setInterval(() => {
      // Future: run scheduled tasks, reminders, etc.
      this.sessions.cleanupOldSessions();
    }, 60000);
  }
}

// ============================================
// 🏁 START THE AGENT
// ============================================

const gateway = new AgentGateway();
gateway.start().catch(console.error);

export { AgentGateway };
