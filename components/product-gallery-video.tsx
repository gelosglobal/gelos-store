'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Pause, Play, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'

type ProductGalleryVideoProps = {
  src: string
  label: string
  className?: string
  variant?: 'default' | 'carousel'
}

export function ProductGalleryVideo({
  src,
  label,
  className,
  variant = 'default',
}: ProductGalleryVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const isCarousel = variant === 'carousel'

  const play = useCallback(() => {
    const video = videoRef.current
    if (!video) return
    void video.play()
  }, [])

  const pause = useCallback(() => {
    const video = videoRef.current
    if (!video) return
    video.pause()
  }, [])

  const restart = useCallback(() => {
    const video = videoRef.current
    if (!video) return
    video.currentTime = 0
    void video.play()
  }, [])

  const togglePlay = useCallback(() => {
    if (isPlaying) pause()
    else play()
  }, [isPlaying, pause, play])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const onPlay = () => setIsPlaying(true)
    const onPause = () => setIsPlaying(false)
    const onEnded = () => {
      const el = videoRef.current
      if (!el) return
      el.currentTime = 0
      void el.play()
    }

    video.addEventListener('play', onPlay)
    video.addEventListener('pause', onPause)
    video.addEventListener('ended', onEnded)

    return () => {
      video.removeEventListener('play', onPlay)
      video.removeEventListener('pause', onPause)
      video.removeEventListener('ended', onEnded)
    }
  }, [src])

  return (
    <div className={cn('relative h-full w-full bg-neutral-950', className)}>
      <video
        ref={videoRef}
        src={src}
        loop
        playsInline
        preload="metadata"
        className="absolute inset-0 h-full w-full object-cover object-center"
        aria-label={label}
        onClick={togglePlay}
      />

      <div
        className={cn(
          'pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/50 via-black/20 to-transparent',
          isCarousel ? 'h-16' : 'h-28',
        )}
      />

      {!isPlaying && (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation()
            play()
          }}
          className="absolute inset-0 z-10 flex items-center justify-center"
          aria-label={`Play ${label}`}
        >
          <span
            className={cn(
              'flex items-center justify-center rounded-full bg-white/85 shadow-[0_8px_30px_rgba(0,0,0,0.18)] backdrop-blur-sm transition-transform hover:scale-105',
              isCarousel
                ? 'h-14 w-14 sm:h-16 sm:w-16'
                : 'h-[4.5rem] w-[4.5rem] sm:h-20 sm:w-20',
            )}
          >
            <Play
              className={cn(
                'ml-0.5 fill-neutral-900 text-neutral-900',
                isCarousel
                  ? 'h-6 w-6 sm:h-7 sm:w-7'
                  : 'ml-1 h-8 w-8 sm:h-9 sm:w-9',
              )}
            />
          </span>
        </button>
      )}

      {!isCarousel && (
        <div className="absolute inset-x-0 bottom-0 z-10 flex items-end justify-between px-4 pb-4 sm:px-5 sm:pb-5">
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation()
            restart()
          }}
          className="flex h-10 w-10 items-center justify-center text-white transition-opacity hover:opacity-80"
          aria-label={`Replay ${label}`}
        >
          <RotateCcw className="h-5 w-5 sm:h-[1.35rem] sm:w-[1.35rem]" />
        </button>

        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation()
            togglePlay()
          }}
          className="flex h-10 w-10 items-center justify-center text-white transition-opacity hover:opacity-80"
          aria-label={isPlaying ? `Pause ${label}` : `Play ${label}`}
        >
          {isPlaying ? (
            <Pause className="h-5 w-5 fill-current sm:h-[1.35rem] sm:w-[1.35rem]" />
          ) : (
            <Play className="h-5 w-5 fill-current sm:h-[1.35rem] sm:w-[1.35rem]" />
          )}
        </button>
      </div>
      )}
    </div>
  )
}
