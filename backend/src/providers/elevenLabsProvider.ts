import axios from 'axios';
import { MusicProvider, GenerateMusicOptions, GenerateMusicResult } from './types.js';
import { env } from '../config/env.js';
import { Errors } from '../utils/errors.js';
import { logger } from '../config/logger.js';

export class ElevenLabsMusicProvider implements MusicProvider {
  public readonly name = 'elevenlabs';
  public readonly defaultModel: string;
  private apiKey: string;

  constructor() {
    this.apiKey = env.ELEVENLABS_API_KEY || '';
    this.defaultModel = env.ELEVENLABS_MODEL_ID || 'music_v1';
  }

  async generateMusic(options: GenerateMusicOptions): Promise<GenerateMusicResult> {
    if (!this.apiKey) {
      throw Errors.providerError(
        'ElevenLabs API key is not configured on this server.',
        'provider_unconfigured',
        500
      );
    }

    try {
      logger.info('Calling ElevenLabs Music API', {
        prompt: options.prompt,
        duration: options.durationSec,
      });

      // Example ElevenLabs sound/music generation call
      const response = await axios.post(
        'https://api.elevenlabs.io/v1/sound-generation',
        {
          text: options.prompt,
          duration_seconds: options.durationSec,
          prompt_influence: 0.7,
        },
        {
          headers: {
            'xi-api-key': this.apiKey,
            'Content-Type': 'application/json',
          },
          responseType: 'arraybuffer',
          timeout: 45000,
        }
      );

      const audioBuffer = Buffer.from(response.data);

      return {
        audioBuffer,
        contentType: 'audio/mpeg',
        provider: this.name,
        model: this.defaultModel,
        durationSec: options.durationSec,
        metadata: {
          prompt: options.prompt,
          externalProvider: 'elevenlabs',
          modelId: this.defaultModel,
        },
      };
    } catch (err: any) {
      const status = err.response?.status || 502;
      const message = err.response?.data?.detail?.message || err.message || 'ElevenLabs API error';
      logger.error('ElevenLabs provider error', { status, message });
      throw Errors.providerError(`ElevenLabs generation failed: ${message}`, 'provider_api_error', status);
    }
  }

  async cancelGeneration(): Promise<boolean> {
    return true;
  }
}
