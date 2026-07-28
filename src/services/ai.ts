import OpenAI from 'openai';
import { env } from '../config';
import { logger } from '../utils/logger';

interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface AIServiceConfig {
  provider?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

class AIService {
  private client: OpenAI | null = null;
  private fallbackClient: OpenAI | null = null;

  constructor() {
    this.initializeClients();
  }

  private initializeClients() {
    if (env.OPENAI_API_KEY) {
      this.client = new OpenAI({ apiKey: env.OPENAI_API_KEY });
      logger.info('OpenAI client initialized');
    }

    if (env.GROQ_API_KEY) {
      this.fallbackClient = new OpenAI({
        apiKey: env.GROQ_API_KEY,
        baseURL: 'https://api.groq.com/openai/v1',
      });
      logger.info('Groq fallback client initialized');
    }
  }

  async chat(
    messages: AIMessage[],
    config: AIServiceConfig = {}
  ): Promise<string> {
    const provider = config.provider || env.AI_PROVIDER;
    const model = config.model || env.OPENAI_MODEL;
    const temperature = config.temperature ?? 0.7;
    const maxTokens = config.maxTokens ?? 1000;

    try {
      if (provider === 'groq' && this.fallbackClient) {
        const response = await this.fallbackClient.chat.completions.create({
          model: model,
          messages,
          temperature,
          max_tokens: maxTokens,
        });
        return response.choices[0]?.message?.content || 'I apologize, but I could not generate a response.';
      }

      if (this.client) {
        const response = await this.client.chat.completions.create({
          model,
          messages,
          temperature,
          max_tokens: maxTokens,
        });
        return response.choices[0]?.message?.content || 'I apologize, but I could not generate a response.';
      }

      throw new Error('No AI provider configured');
    } catch (error) {
      logger.error({ error, provider }, 'AI request failed');
      if (this.fallbackClient && provider !== 'groq') {
        logger.info('Falling back to Groq');
        return this.chat(messages, { ...config, provider: 'groq' });
      }
      throw new Error('AI service unavailable');
    }
  }

  async generateProactiveMessage(
    context: {
      userName: string;
      personaTone: string;
      pendingCommitments: string[];
      recentActivity: string;
      goals: string[];
    }
  ): Promise<string> {
    const systemPrompt = this.getPersonaSystemPrompt(context.personaTone);
    const userPrompt = `
User: ${context.userName}
Pending commitments: ${context.pendingCommitments.join(', ') || 'none'}
Recent activity: ${context.recentActivity || 'no recent activity'}
Current goals: ${context.goals.join(', ') || 'no active goals'}

Generate a brief, proactive check-in message (under 200 characters) that reaches out first.
Do not include the user's name unless it makes it sound natural.
Keep it concise and engaging.`;

    return this.chat([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ]);
  }

  private getPersonaSystemPrompt(tone: string): string {
    const prompts: Record<string, string> = {
      supportive: 'You are a warm, encouraging accountability coach. Be gentle but firm. Celebrate wins and offer support during struggles.',
      strict: 'You are a no-nonsense accountability partner. Be direct, concise, and focused on results. No excuses.',
      gentle: 'You are a kind, patient companion. Use soft language and avoid pressure. Focus on progress over perfection.',
      professional: 'You are a professional executive assistant. Be formal, efficient, and organized. Focus on productivity and outcomes.',
      casual: 'You are a friendly peer. Use casual language, emoji sparingly, and keep it light. Be like a supportive friend.',
    };
    return prompts[tone] || prompts.supportive;
  }
}

export const aiService = new AIService();
