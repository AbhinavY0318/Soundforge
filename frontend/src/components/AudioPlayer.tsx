import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Download, Volume2, VolumeX, Music2 } from 'lucide-react';

interface AudioPlayerProps {
  src: string;
  title?: string;
  durationSec?: number;
  className?: string;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  src,
  title,
  durationSec = 60,
  className = '',
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(durationSec);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // Generate pseudo-random deterministic waveform bar heights
  const waveformBars = [
    30, 45, 60, 25, 75, 90, 55, 80, 40, 65, 85, 30, 95, 70, 50, 80, 40, 60, 90,
    35, 75, 85, 60, 45, 95, 70, 40, 80, 60, 30, 75, 90, 50, 40, 65, 85,
  ];

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => {
      if (audio.duration && !isNaN(audio.duration)) {
        setDuration(audio.duration);
      }
    };
    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  const handleSeek = (newProgress: number) => {
    const newTime = newProgress * (duration || 1);
    setCurrentTime(newTime);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    audioRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const progressRatio = duration > 0 ? currentTime / duration : 0;

  return (
    <div
      className={`bg-elevated/70 border border-white/8 rounded-xl p-3.5 backdrop-blur-md flex flex-col gap-2.5 transition-all hover:border-white/15 ${className}`}
    >
      <audio ref={audioRef} src={src} preload="metadata" />

      {title && (
        <div className="flex items-center justify-between text-xs text-text-secondary">
          <div className="flex items-center gap-1.5 truncate">
            <Music2 className="w-3.5 h-3.5 text-accent-cyan flex-shrink-0" />
            <span className="font-mono truncate">{title}</span>
          </div>
          <span className="text-[11px] font-mono text-text-muted tabular-nums">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
        </div>
      )}

      {/* Futuristic Waveform Equalizer Display */}
      <div
        className="relative h-9 flex items-center justify-between gap-1 cursor-pointer group px-1 py-1 bg-[#08090D]/50 rounded-lg overflow-hidden border border-white/5"
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const clickX = e.clientX - rect.left;
          const ratio = Math.max(0, Math.min(1, clickX / rect.width));
          handleSeek(ratio);
        }}
      >
        {/* Waveform Bars */}
        {waveformBars.map((barHeight, idx) => {
          const barRatio = idx / waveformBars.length;
          const isPassed = barRatio <= progressRatio;
          const isCurrent = Math.abs(barRatio - progressRatio) < 0.03;

          return (
            <div
              key={idx}
              className="flex-1 flex items-center justify-center h-full"
            >
              <div
                className={`w-full rounded-full transition-all duration-150 ${
                  isPassed
                    ? 'bg-gradient-to-t from-accent-indigo to-accent-cyan'
                    : 'bg-white/10 group-hover:bg-white/20'
                } ${isPlaying && isCurrent ? 'animate-pulse scale-y-125' : ''}`}
                style={{
                  height: `${barHeight}%`,
                  minHeight: '4px',
                }}
              />
            </div>
          );
        })}

        {/* Playhead position line */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-accent-cyan shadow-glow-cyan pointer-events-none transition-all duration-75"
          style={{ left: `${progressRatio * 100}%` }}
        />
      </div>

      {/* Control Buttons */}
      <div className="flex items-center justify-between gap-3 pt-0.5">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={togglePlay}
            className="w-8 h-8 rounded-full bg-gradient-to-r from-accent-violet to-accent-indigo hover:from-accent-violet/90 hover:to-accent-indigo/90 text-white flex items-center justify-center transition shadow-glow-sm flex-shrink-0"
            aria-label={isPlaying ? 'Pause audio' : 'Play audio'}
          >
            {isPlaying ? (
              <Pause className="w-3.5 h-3.5 fill-current" />
            ) : (
              <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
            )}
          </button>

          <button
            type="button"
            onClick={toggleMute}
            className="p-1.5 rounded-lg text-text-muted hover:text-white hover:bg-white/5 transition-colors"
            aria-label={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-accent-rose" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>

        <a
          href={src}
          download
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs text-text-secondary hover:text-white bg-white/5 hover:bg-white/10 border border-white/8 rounded-lg transition-colors font-medium"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Download WAV</span>
        </a>
      </div>
    </div>
  );
};
