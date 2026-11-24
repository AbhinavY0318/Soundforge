import { MusicProvider, GenerateMusicOptions, GenerateMusicResult } from './types.js';
import { env } from '../config/env.js';
import { Errors } from '../utils/errors.js';

export class MockMusicProvider implements MusicProvider {
  public readonly name = 'mock';
  public readonly defaultModel = 'soundforge-mock-v1';

  private latencyMs: number;
  private failureRate: number;
  private timeoutMs: number;

  constructor(options?: { latencyMs?: number; failureRate?: number; timeoutMs?: number }) {
    this.latencyMs = options?.latencyMs ?? (process.env.NODE_ENV === 'test' ? 0 : env.MOCK_PROVIDER_LATENCY_MS);
    this.failureRate = options?.failureRate ?? env.MOCK_PROVIDER_FAILURE_RATE;
    this.timeoutMs = options?.timeoutMs ?? env.MOCK_PROVIDER_TIMEOUT_MS;
  }

  setLatency(ms: number) {
    this.latencyMs = ms;
  }

  setFailureRate(rate: number) {
    this.failureRate = rate;
  }

  setTimeout(ms: number) {
    this.timeoutMs = ms;
  }

  /**
   * Generates a valid 16-bit mono PCM WAV audio buffer with a gentle sine wave tone.
   */
  private createSyntheticWav(durationSec: number): Buffer {
    const sampleRate = 44100;
    const numChannels = 1;
    const bitsPerSample = 16;
    const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
    const blockAlign = (numChannels * bitsPerSample) / 8;
    const numSamples = Math.min(durationSec * sampleRate, 44100 * 5);
    const dataSize = numSamples * blockAlign;
    const buffer = Buffer.alloc(44 + dataSize);

    // RIFF chunk descriptor
    buffer.write('RIFF', 0);
    buffer.writeUInt32LE(36 + dataSize, 4);
    buffer.write('WAVE', 8);

    // fmt sub-chunk
    buffer.write('fmt ', 12);
    buffer.writeUInt32LE(16, 16);
    buffer.writeUInt16LE(1, 20);
    buffer.writeUInt16LE(numChannels, 22);
    buffer.writeUInt32LE(sampleRate, 24);
    buffer.writeUInt32LE(byteRate, 28);
    buffer.writeUInt16LE(blockAlign, 32);
    buffer.writeUInt16LE(bitsPerSample, 34);

    // data sub-chunk
    buffer.write('data', 36);
    buffer.writeUInt32LE(dataSize, 40);

    const frequency = 440.0;
    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;
      const sample = Math.sin(2 * Math.PI * frequency * t) * 0.3 * Math.exp(-t * 0.5);
      const intSample = Math.max(-32768, Math.min(32767, Math.floor(sample * 32767)));
      buffer.writeInt16LE(intSample, 44 + i * 2);
    }

    return buffer;
  }

  async generateMusic(options: GenerateMusicOptions): Promise<GenerateMusicResult> {
    if (this.latencyMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, this.latencyMs));
    }

    if (this.failureRate > 0 && Math.random() < this.failureRate) {
      throw Errors.providerError('Simulated mock provider failure during generation.', 'provider_internal_failure');
    }

    const audioBuffer = this.createSyntheticWav(options.durationSec);

    return {
      audioBuffer,
      contentType: 'audio/wav',
      provider: this.name,
      model: this.defaultModel,
      durationSec: options.durationSec,
      metadata: {
        prompt: options.prompt,
        simulated: true,
        generatedAt: new Date().toISOString(),
      },
    };
  }

  async cancelGeneration(): Promise<boolean> {
    return true;
  }
}
