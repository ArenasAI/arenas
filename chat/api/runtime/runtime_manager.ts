import { NextApiRequest, NextApiResponse } from 'next';
import pythonHandler from './python_handler';
import rHandler from './r_handler';
import juliaHandler from './julia_handler';
import WebSocket from 'ws';

type RuntimeType = 'python' | 'r' | 'julia';

interface RuntimeConfig {
  maxConcurrentJobs: number;
  timeoutSeconds: number;
  maxMemoryMB: number;
}

class RuntimeManager {
  private runtimeConfigs: Map<RuntimeType, RuntimeConfig>;
  private activeJobs: Map<string, {
    runtime: RuntimeType;
    startTime: Date;
    sessionId: string;
  }>;

  constructor() {
    this.runtimeConfigs = new Map([
      ['python', { maxConcurrentJobs: 10, timeoutSeconds: 300, maxMemoryMB: 1024 }],
      ['r', { maxConcurrentJobs: 10, timeoutSeconds: 300, maxMemoryMB: 1024 }],
      ['julia', { maxConcurrentJobs: 10, timeoutSeconds: 300, maxMemoryMB: 1024 }]
    ]);
    this.activeJobs = new Map();
  }

  async handleRequest(req: NextApiRequest, res: NextApiResponse) {
    const { runtime, ...requestData } = req.body;

    if (!this.isValidRuntime(runtime)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid runtime specified'
      });
    }

    if (!this.canAcceptNewJob(runtime)) {
      return res.status(429).json({
        status: 'error',
        message: 'Runtime at maximum capacity'
      });
    }

    try {
      const sessionId = this.generateSessionId();
      
      // Register job
      this.activeJobs.set(sessionId, {
        runtime,
        startTime: new Date(),
        sessionId
      });

      // Route to appropriate handler
      switch (runtime) {
        case 'python':
          await pythonHandler.handleRequest(req, res);
          break;
        case 'r':
          await rHandler.handleRequest(req, res);
          break;
        case 'julia':
          await juliaHandler.handleRequest(req, res);
          break;
      }

      // Start timeout monitor
      this.monitorJobTimeout(sessionId);

    } catch (error) {
      console.error('Runtime manager error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Failed to process request',
        error: error.message
      });
    }
  }

  public registerWebSocket(runtime: RuntimeType, sessionId: string, ws: WebSocket) {
    switch (runtime) {
      case 'python':
        pythonHandler.registerWebSocket(sessionId, ws);
        break;
      case 'r':
        rHandler.registerWebSocket(sessionId, ws);
        break;
      case 'julia':
        juliaHandler.registerWebSocket(sessionId, ws);
        break;
    }
  }

  private isValidRuntime(runtime: string): runtime is RuntimeType {
    return ['python', 'r', 'julia'].includes(runtime);
  }

  private canAcceptNewJob(runtime: RuntimeType): boolean {
    const config = this.runtimeConfigs.get(runtime)!;
    const currentJobs = Array.from(this.activeJobs.values())
      .filter(job => job.runtime === runtime).length;
    return currentJobs < config.maxConcurrentJobs;
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private monitorJobTimeout(sessionId: string) {
    const job = this.activeJobs.get(sessionId);
    if (!job) return;

    const config = this.runtimeConfigs.get(job.runtime)!;
    setTimeout(() => {
      if (this.activeJobs.has(sessionId)) {
        // Handle timeout
        this.terminateJob(sessionId);
      }
    }, config.timeoutSeconds * 1000);
  }

  private terminateJob(sessionId: string) {
    const job = this.activeJobs.get(sessionId);
    if (!job) return;

    // Clean up resources
    this.activeJobs.delete(sessionId);

    // Notify client
    switch (job.runtime) {
      case 'python':
        pythonHandler.sendResult(sessionId, { status: 'timeout' });
        break;
      case 'r':
        rHandler.sendResult(sessionId, { status: 'timeout' });
        break;
      case 'julia':
        juliaHandler.sendResult(sessionId, { status: 'timeout' });
        break;
    }
  }
}

export default new RuntimeManager();
