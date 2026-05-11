// ============================================
// 📱 TELEGRAM CHANNEL
// ============================================

import TelegramBot from 'node-telegram-bot-api';
import { AgentGateway } from '../gateway/index';

export class TelegramChannel {
  private bot: TelegramBot;
  private gateway: AgentGateway;

  constructor(gateway: AgentGateway) {
    this.gateway = gateway;

    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) {
      throw new Error('TELEGRAM_BOT_TOKEN is not set!');
    }

    // Create bot with polling (listens for messages)
    this.bot = new TelegramBot(token, { polling: true });

    // Handle incoming messages
    this.bot.on('message', this.handleMessage.bind(this));

    // Handle /start command
    this.bot.onText(/\/start/, (msg) => {
      const chatId = msg.chat.id;
      const userName = msg.from?.first_name || 'User';
      
      this.bot.sendMessage(chatId, 
        `👋 Hello ${userName}!\n\n` +
        `I'm your personal AI assistant.\n\n` +
        `Just send me a message and I'll help you!\n\n` +
        `Your User ID: \`${msg.from?.id}\`\n` +
        `(Save this for the ALLOWED_USER_ID setting)`,
        { parse_mode: 'Markdown' }
      );
    });

    // Handle /clear command - clears conversation history
    this.bot.onText(/\/clear/, (msg) => {
      const chatId = msg.chat.id;
      this.bot.sendMessage(chatId, '🧹 Conversation cleared! Starting fresh.');
    });

    console.log('📱 Telegram bot started!');
  }

  private async handleMessage(msg: TelegramBot.Message) {
    // Ignore commands (start with /)
    if (msg.text?.startsWith('/')) return;

    const chatId = msg.chat.id;
    const userId = String(msg.from?.id || chatId);
    const userName = msg.from?.first_name || 'User';
    const text = msg.text || '';

    // Ignore empty messages
    if (!text.trim()) return;

    // Show "typing" indicator
    this.bot.sendChatAction(chatId, 'typing');

    try {
      // Get response from gateway
      const response = await this.gateway.handleMessage(
        'telegram',
        userId,
        userName,
        text
      );

      // Send response (split if too long)
      await this.sendLongMessage(chatId, response);

    } catch (error) {
      console.error('❌ Error handling message:', error);
      this.bot.sendMessage(chatId, '❌ Sorry, something went wrong. Please try again.');
    }
  }

  // Telegram has 4096 character limit, so split long messages
  private async sendLongMessage(chatId: number, text: string) {
    const MAX_LENGTH = 4000;

    if (text.length <= MAX_LENGTH) {
      await this.bot.sendMessage(chatId, text);
      return;
    }

    // Split into chunks
    const chunks = [];
    let remaining = text;

    while (remaining.length > 0) {
      if (remaining.length <= MAX_LENGTH) {
        chunks.push(remaining);
        break;
      }

      // Try to split at a newline
      let splitIndex = remaining.lastIndexOf('\n', MAX_LENGTH);
      if (splitIndex === -1 || splitIndex < MAX_LENGTH / 2) {
        splitIndex = MAX_LENGTH;
      }

      chunks.push(remaining.substring(0, splitIndex));
      remaining = remaining.substring(splitIndex).trim();
    }

    // Send each chunk
    for (const chunk of chunks) {
      await this.bot.sendMessage(chatId, chunk);
    }
  }
}
