import { createClient } from '@supabase/supabase-js'

interface AnalysisRequest {
  messages: any[];
  model?: string;
  forceRefresh?: boolean;
}

interface AnalysisResponse {
  status: string;
  result: any;
}

export class AIService {
  private baseUrl: string;
  private supabase;

  constructor() {
    this.baseUrl = process.env.ARENAS_SERVER_URL || 'http://localhost:8000';
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }

  async analyzeData(data: AnalysisRequest): Promise<AnalysisResponse> {
    const session = await this.supabase.auth.getSession();
    const token = session.data.session?.access_token;

    const response = await fetch(`${this.baseUrl}/chat/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        messages: data.messages,
        model: data.model || 'arenas',
        force_refresh: data.forceRefresh || false
      })
    });

    if (!response.ok) {
      throw new Error('Analysis failed');
    }

    return response.json();
  }
}

export const aiService = new AIService();