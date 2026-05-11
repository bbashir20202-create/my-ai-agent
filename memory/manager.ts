// ============================================
// 🧠 MEMORY MANAGER - Stores conversations
// ============================================

import fs from 'fs';
import path from 'path';

export class MemoryManager {
  private memoryDir: string;
  private longTermFile: string;

  constructor() {
    // Create memory directory in user's home folder
    const homeDir = process.env.HOME || process.env.USERPROFILE || '.';
    this.memoryDir = path.join(homeDir, '.my-ai-agent', 'memory');
    this.longTermFile = path.join(homeDir, '.my-ai-agent', 'MEMORY.md');

    // Create directories if they don't exist
    this.ensureDirectories();
  }

  private ensureDirectories() {
    if (!fs.existsSync(this.memoryDir)) {
      fs.mkdirSync(this.memoryDir, { recursive: true });
      console.log(`📁 Created memory directory: ${this.memoryDir}`);
    }

    // Create MEMORY.md if it doesn't exist
    if (!fs.existsSync(this.longTermFile)) {
      const initialContent = `# Long-Term Memory

## About the User
- (Add things you learn about the user here)

## Preferences
- (User preferences go here)

## Important Dates
- (Birthdays, anniversaries, etc.)

## Notes
- (Other important notes)
`;
      fs.writeFileSync(this.longTermFile, initialContent);
      console.log(`📝 Created long-term memory file: ${this.longTermFile}`);
    }
  }

  // Get today's date as YYYY-MM-DD
  private getTodayDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  // Get path to today's log file
  private getTodayLogPath(): string {
    return path.join(this.memoryDir, `${this.getTodayDate()}.md`);
  }

  // Get today's conversation log
  getTodayLog(): string {
    const logPath = this.getTodayLogPath();
    
    if (fs.existsSync(logPath)) {
      return fs.readFileSync(logPath, 'utf-8');
    }
    
    return '';
  }

  // Append text to today's log
  appendToLog(content: string) {
    const logPath = this.getTodayLogPath();
    
    // Add header if file doesn't exist
    if (!fs.existsSync(logPath)) {
      const header = `# Conversation Log - ${this.getTodayDate()}\n\n`;
      fs.writeFileSync(logPath, header);
    }

    // Append content with timestamp
    const timestamp = new Date().toLocaleTimeString();
    const entry = `[${timestamp}] ${content}\n`;
    
    fs.appendFileSync(logPath, entry);
  }

  // Get long-term memory
  getLongTermMemory(): string {
    if (fs.existsSync(this.longTermFile)) {
      return fs.readFileSync(this.longTermFile, 'utf-8');
    }
    return '';
  }

  // Save to long-term memory
  saveToLongTermMemory(content: string) {
    const existing = this.getLongTermMemory();
    const updated = existing + '\n' + content;
    fs.writeFileSync(this.longTermFile, updated);
  }

  // Get recent logs (last N days)
  getRecentLogs(days: number = 7): string {
    const logs: string[] = [];
    
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const logPath = path.join(this.memoryDir, `${dateStr}.md`);
      
      if (fs.existsSync(logPath)) {
        logs.push(fs.readFileSync(logPath, 'utf-8'));
      }
    }
    
    return logs.join('\n\n---\n\n');
  }
}
