// ============================================
// 🧠 MODEL MANAGER - Connects to AI
// ============================================

import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { Message } from '../gateway/session';

export class ModelManager {
  private provider: 'openai' | 'anthropic';
  private openai: OpenAI | null = null;
  private anthropic: Anthropic | null = null;

  constructor() {
    // Determine which provider to use
    this.provider = (process.env.AI_PROVIDER as 'openai' | 'anthropic') || 'openai';

    // Initialize OpenAI
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
      });
      console.log('✅ OpenAI initialized');
    }

    // Initialize Anthropic (Claude)
    if (process.env.ANTHROPIC_API_KEY) {
      this.anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY
      });
      console.log('✅ Anthropic (Claude) initialized');
    }

    // Check if at least one provider is available
    if (!this.openai && !this.anthropic) {
      console.warn('⚠️ No AI provider configured! Set OPENAI_API_KEY or ANTHROPIC_API_KEY');
    }

    console.log(`🧠 Using AI provider: ${this.provider}`);
  }

  async generateResponse(
    systemPrompt: string,
    history: Message[]
  ): Promise<string> {
    
    try {
      if (this.provider === 'anthropic' && this.anthropic) {
        return await this.generateWithClaude(systemPrompt, history);
      } else if (this.openai) {
        return await this.generateWithOpenAI(systemPrompt, history);
      } else {
        return '❌ No AI provider configured. Please set API keys in .env file.';
      }
    } catch (error) {
      console.error('❌ AI generation error:', error);
      
      // Try fallback provider
      if (this.provider === 'openai' && this.anthropic) {
        console.log('🔄 Trying fallback to Claude...');
        return await this.generateWithClaude(systemPrompt, history);
      } else if (this.provider === 'anthropic' && this.openai) {
        console.log('🔄 Trying fallback to OpenAI...');
        return await this.generateWithOpenAI(systemPrompt, history);
      }
      
      return '❌ Sorry, I encountered an error. Please try again.';
    }
  }

  private async generateWithOpenAI(
    systemPrompt: string,
    history: Message[]
  ): Promise<string> {
    
    if (!this.openai) throw new Error('OpenAI not initialized');

    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
      ...history.map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content
      }))
    ];

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini', // Fast and cheap, upgrade to 'gpt-4o' for better quality
      messages,
      max_tokens: 1000,
      temperature: 0.7
    });

    return response.choices[0]?.message?.content || 'No response generated.';
  }

  private async generateWithClaude(
    systemPrompt: string,
    history: Message[]
  ): Promise<string> {
    
    if (!this.anthropic) throw new Error('Anthropic not initialized');

    const messages: Anthropic.MessageParam[] = history.map(msg => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content
    }));

    const response = await this.anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022', // Best balance of speed/quality
      max_tokens: 1000,
      system: systemPrompt,
      messages
    });

    const textBlock = response.content.find(block => block.type === 'text');
    return textBlock?.type === 'text' ? textBlock.text : 'No response generated.';
  }
}
