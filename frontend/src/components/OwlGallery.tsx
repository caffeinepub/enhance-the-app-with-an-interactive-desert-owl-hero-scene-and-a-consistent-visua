import React, { useState } from 'react';
import { Play, Pause, Volume2, Loader2 } from 'lucide-react';
import { useActor } from '../hooks/useActor';
import { useQuery } from '@tanstack/react-query';
import { useFileUrl } from '../blob-storage/FileStorage';

interface OwlGalleryProps {
  birdName: string;
}

function useGetAudioFile(birdName: string) {
  const { actor, isFetching } = useActor();
  return useQuery<string | null>({
    queryKey: ['audioFile', birdName],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getAudioFile(birdName);
    },
    enabled: !!actor && !isFetching && !!birdName,
  });
}

export default function OwlGallery({ birdName }: OwlGalleryProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);

  const { data: audioPath } = useGetAudioFile(birdName);
  const { data: audioUrl, isLoading: isLoadingAudio } = useFileUrl(audioPath || '');

  React.useEffect(() => {
    if (audioUrl) {
      const audioElement = new Audio(audioUrl);
      audioElement.addEventListener('ended', () => setIsPlaying(false));
      setAudio(audioElement);

      return () => {
        audioElement.pause();
        audioElement.removeEventListener('ended', () => setIsPlaying(false));
      };
    }
  }, [audioUrl]);

  const togglePlay = () => {
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play();
      setIsPlaying(true);
    }
  };

  if (isLoadingAudio) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
      </div>
    );
  }

  if (!audioUrl) {
    return (
      <div className="bg-muted rounded-lg p-8 text-center" dir="rtl">
        <Volume2 className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
        <p className="text-muted-foreground">لا يوجد ملف صوتي متاح</p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg p-6" dir="rtl">
      <button
        onClick={togglePlay}
        className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-4 px-6 rounded-lg flex items-center justify-center gap-3 transition-all"
      >
        {isPlaying ? (
          <>
            <Pause className="h-6 w-6" />
            <span>إيقاف الصوت</span>
          </>
        ) : (
          <>
            <Play className="h-6 w-6" />
            <span>تشغيل الصوت</span>
          </>
        )}
      </button>
    </div>
  );
}
