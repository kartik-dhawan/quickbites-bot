import axios from 'axios';

const BASE_URL = process.env.SIMULATOR_BASE_URL || 'https://simulator-75lk3meynq-el.a.run.app';
const TOKEN = process.env.CANDIDATE_TOKEN || 'boulder-silver-thunder-jaguar';

export interface SessionStartResponse {
  session_id: string;
  mode: 'dev' | 'prod';
  scenario_id: number;
  customer_message: string;
  max_turns: number;
}

export interface ReplyResponse {
  customer_message: string | null;
  done: boolean;
  close_reason: 'bot_closed' | 'customer_closed' | 'turn_cap' | null;
  score: any; // Only populated in prod mode
  turns_remaining: number;
}

export interface BotAction {
  type: 'issue_refund' | 'file_complaint' | 'escalate_to_human' | 'flag_abuse' | 'close';
  [key: string]: any; // Additional fields based on action type
}

export interface ReplyRequest {
  bot_message: string;
  actions: BotAction[];
}

class SimulatorAPI {
  private headers = {
    'Content-Type': 'application/json',
    'X-Candidate-Token': TOKEN
  };

  async healthCheck(): Promise<boolean> {
    try {
      const response = await axios.get(`${BASE_URL}/healthz`);
      return response.status === 200;
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  }

  async startSession(mode: 'dev' | 'prod' = 'dev', scenarioId?: number): Promise<SessionStartResponse> {
    try {
      const payload: any = { mode };
      if (mode === 'dev' && scenarioId) {
        payload.scenario_id = scenarioId;
      }

      const response = await axios.post(`${BASE_URL}/v1/session/start`, payload, {
        headers: this.headers
      });

      return response.data;
    } catch (error) {
      console.error('Failed to start session:', error);
      throw error;
    }
  }

  async sendReply(sessionId: string, botMessage: string, actions: BotAction[] = []): Promise<ReplyResponse> {
    try {
      const payload: ReplyRequest = {
        bot_message: botMessage,
        actions
      };

      const response = await axios.post(`${BASE_URL}/v1/session/${sessionId}/reply`, payload, {
        headers: this.headers
      });

      return response.data;
    } catch (error) {
      console.error('Failed to send reply:', error);
      throw error;
    }
  }

  async getTranscript(sessionId: string): Promise<any> {
    try {
      const response = await axios.get(`${BASE_URL}/v1/session/${sessionId}/transcript`, {
        headers: this.headers
      });

      return response.data;
    } catch (error) {
      console.error('Failed to get transcript:', error);
      throw error;
    }
  }

  async getCandidateSummary(): Promise<any> {
    try {
      const response = await axios.get(`${BASE_URL}/v1/candidate/summary`, {
        headers: this.headers
      });

      return response.data;
    } catch (error) {
      console.error('Failed to get candidate summary:', error);
      throw error;
    }
  }
}

export default new SimulatorAPI();
