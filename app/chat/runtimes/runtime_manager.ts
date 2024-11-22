import { spawn } from 'child_process';

export interface RuntimeResult {
  output: string;
  visualization?: string;
  error?: string;
}

class RuntimeManager {
  async execute(code: string, runtime: string): Promise<RuntimeResult> {
    switch (runtime) {
      case 'python':
        return this.executePython(code);
      case 'r':
        return this.executeR(code);
      case 'julia':
        return this.executeJulia(code);
      default:
        throw new Error(`Unsupported runtime: ${runtime}`);
    }
  }

  private async executePython(code: string): Promise<RuntimeResult> {
    return new Promise((resolve, reject) => {
      const process = spawn('python', ['-c', code]);
      let output = '';
      let error = '';

      process.stdout.on('data', (data) => {
        output += data.toString();
      });

      process.stderr.on('data', (data) => {
        error += data.toString();
      });

      process.on('close', (code) => {
        if (code === 0) {
          resolve({ output });
        } else {
          reject({ error: error || 'Python execution failed' });
        }
      });
    });
  }

  private async executeR(code: string): Promise<RuntimeResult> {
    // Similar implementation for R
    return new Promise((resolve) => {
      resolve({ output: 'R execution not implemented yet' });
    });
  }

  private async executeJulia(code: string): Promise<RuntimeResult> {
    // Similar implementation for Julia
    return new Promise((resolve) => {
      resolve({ output: 'Julia execution not implemented yet' });
    });
  }
}

export const runtimeManager = new RuntimeManager();
