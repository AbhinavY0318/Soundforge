import { env } from '../config/env.js';
import { MusicProvider } from './types.js';
import { MockMusicProvider } from './mockProvider.js';
import { ElevenLabsMusicProvider } from './elevenLabsProvider.js';

let activeProvider: MusicProvider | null = null;

export function getMusicProvider(): MusicProvider {
  if (activeProvider) {
    return activeProvider;
  }

  if (env.MUSIC_PROVIDER === 'elevenlabs' && env.ELEVENLABS_API_KEY) {
    activeProvider = new ElevenLabsMusicProvider();
  } else {
    activeProvider = new MockMusicProvider();
  }

  return activeProvider;
}

export function setMusicProvider(provider: MusicProvider): void {
  activeProvider = provider;
}

export * from './types.js';
export * from './mockProvider.js';
export * from './elevenLabsProvider.js';
