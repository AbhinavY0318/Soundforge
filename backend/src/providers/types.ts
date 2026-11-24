import { LicenseType } from '../models/Plan.js';

export interface GenerateMusicOptions {
  generationId: string;
  prompt: string;
  durationSec: number;
  license: LicenseType;
  instrumental: boolean;
  metadata?: Record<string, unknown>;
}

export interface GenerateMusicResult {
  audioBuffer: Buffer;
  contentType: string;
  provider: string;
  model: string;
  durationSec: number;
  metadata?: Record<string, unknown>;
}

export interface MusicProvider {
  name: string;
  defaultModel: string;
  generateMusic(options: GenerateMusicOptions): Promise<GenerateMusicResult>;
  cancelGeneration?(externalJobId: string): Promise<boolean>;
}
