import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { useInternetIdentity } from './useInternetIdentity';
import type { BirdData, Coordinate, LocationData, TeamMember, TeamGroup, FileReference, UserRole, UserProfile } from '../backend';
import { toast } from 'sonner';
import { Principal } from '@icp-sdk/core/principal';
import { useEffect } from 'react';

// OPTIMIZED: Balanced refresh interval for unlimited datasets - 10 seconds
const AUTO_REFRESH_INTERVAL = 10000;

// OPTIMIZED: Enable smart caching with 5-second stale time for unlimited datasets
const STALE_TIME = 5000;
const GC_TIME = 60000; // Keep unused data for 60 seconds for unlimited datasets

// Helper function to invalidate all bird-related queries
const invalidateAllBirdQueries = (queryClient: ReturnType<typeof useQueryClient>) => {
  queryClient.invalidateQueries({ queryKey: ['birds'] });
  queryClient.invalidateQueries({ queryKey: ['birdNames'] });
  queryClient.invalidateQueries({ queryKey: ['allBirdData'] });
  queryClient.invalidateQueries({ queryKey: ['birdDetails'] });
  queryClient.invalidateQueries({ queryKey: ['birdLocations'] });
  queryClient.invalidateQueries({ queryKey: ['allLocations'] });
  queryClient.invalidateQueries({ queryKey: ['locationCount'] });
  queryClient.invalidateQueries({ queryKey: ['totalBirdCount'] });
  queryClient.invalidateQueries({ queryKey: ['totalLocationCount'] });
  queryClient.invalidateQueries({ queryKey: ['subImages'] });
  queryClient.invalidateQueries({ queryKey: ['audioFile'] });
  queryClient.invalidateQueries({ queryKey: ['hasAudioFile'] });
  queryClient.invalidateQueries({ queryKey: ['normalizedBirdNames'] });
  queryClient.invalidateQueries({ queryKey: ['fileReferences'] });
  queryClient.invalidateQueries({ queryKey: ['allBirdDetails'] });
  queryClient.invalidateQueries({ queryKey: ['allLocationsForMap'] });
  queryClient.invalidateQueries({ queryKey: ['birdExists'] });
};

// Helper function to completely clear all bird-related cache
const clearAllBirdCache = (queryClient: ReturnType<typeof useQueryClient>) => {
  queryClient.removeQueries({ queryKey: ['birds'] });
  queryClient.removeQueries({ queryKey: ['birdNames'] });
  queryClient.removeQueries({ queryKey: ['allBirdData'] });
  queryClient.removeQueries({ queryKey: ['birdDetails'] });
  queryClient.removeQueries({ queryKey: ['birdLocations'] });
  queryClient.removeQueries({ queryKey: ['allLocations'] });
  queryClient.removeQueries({ queryKey: ['locationCount'] });
  queryClient.removeQueries({ queryKey: ['totalBirdCount'] });
  queryClient.removeQueries({ queryKey: ['totalLocationCount'] });
  queryClient.removeQueries({ queryKey: ['subImages'] });
  queryClient.removeQueries({ queryKey: ['audioFile'] });
  queryClient.removeQueries({ queryKey: ['hasAudioFile'] });
  queryClient.removeQueries({ queryKey: ['normalizedBirdNames'] });
  queryClient.removeQueries({ queryKey: ['fileReferences'] });
  queryClient.removeQueries({ queryKey: ['allBirdDetails'] });
  queryClient.removeQueries({ queryKey: ['allLocationsForMap'] });
  queryClient.removeQueries({ queryKey: ['birdExists'] });
};

// Custom hook for forced initial data synchronization - clears cache on mount
export function useForcedDataSync() {
  const queryClient = useQueryClient();
  const { actor, isFetching } = useActor();

  useEffect(() => {
    if (actor && !isFetching) {
      // Clear all cached bird data completely on mount
      clearAllBirdCache(queryClient);
      
      // Force immediate refetch of all bird data
      setTimeout(() => {
        invalidateAllBirdQueries(queryClient);
      }, 100);
    }
  }, [actor, isFetching, queryClient]);
}

// Hook to manually invalidate bird data
export function useInvalidateBirdData() {
  const queryClient = useQueryClient();
  
  return () => {
    clearAllBirdCache(queryClient);
    setTimeout(() => {
      invalidateAllBirdQueries(queryClient);
    }, 100);
  };
}

// New hook for manual data refresh with user feedback and retry logic
export function useManualDataRefresh() {
  const queryClient = useQueryClient();
  const { actor } = useActor();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error('الخادم غير متاح حالياً');
      
      return true;
    },
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
    onMutate: () => {
      toast.info('🔄 جاري تحديث البيانات...', {
        description: 'يتم الآن تحديث جميع البيانات من الخادم',
        duration: 2000,
        position: 'bottom-center',
      });
    },
    onSuccess: () => {
      // Clear all cache completely
      clearAllBirdCache(queryClient);
      
      // Force immediate refetch
      setTimeout(() => {
        invalidateAllBirdQueries(queryClient);
      }, 100);
      
      toast.success('✅ تم تحديث البيانات بنجاح', {
        description: 'تم تحديث جميع الصفحات بأحدث البيانات من قاعدة البيانات',
        duration: 3000,
        position: 'bottom-center',
      });
    },
    onError: (error: any) => {
      console.error('Manual refresh error:', error);
      
      if (error?.message?.includes('fetch') || error?.message?.includes('network') || error?.message?.includes('متاح')) {
        toast.error('⚠️ فشل الاتصال بالخادم', {
          description: 'تعذر الاتصال بالخادم. يرجى التحقق من الاتصال بالإنترنت والمحاولة مرة أخرى.',
          duration: 5000,
          position: 'bottom-center',
          action: {
            label: 'إعادة المحاولة',
            onClick: () => window.location.reload(),
          },
        });
      } else {
        toast.error('❌ فشل تحديث البيانات', {
          description: 'حدث خطأ أثناء تحديث البيانات. يرجى المحاولة مرة أخرى.',
          duration: 4000,
          position: 'bottom-center',
        });
      }
    },
  });
}

// OPTIMIZED: Enhanced query configuration with retry logic and error handling for unlimited datasets
const createOptimizedQuery = <T>(
  queryKey: any[],
  queryFn: () => Promise<T>,
  enabled: boolean,
  options?: {
    refetchInterval?: number;
    staleTime?: number;
    gcTime?: number;
  }
) => ({
  queryKey,
  queryFn,
  enabled,
  staleTime: options?.staleTime ?? STALE_TIME,
  gcTime: options?.gcTime ?? GC_TIME,
  refetchInterval: options?.refetchInterval ?? AUTO_REFRESH_INTERVAL,
  refetchOnMount: 'always' as const,
  refetchOnWindowFocus: true,
  refetchOnReconnect: true,
  retry: (failureCount: number, error: any) => {
    if (error?.message?.includes('Unauthorized') || error?.message?.includes('صلاحية')) {
      return false;
    }
    return failureCount < 3;
  },
  retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 10000),
});

export function useGetBirdNames() {
  const { actor, isFetching } = useActor();

  return useQuery<string[]>(
    createOptimizedQuery(
      ['birdNames'],
      async () => {
        if (!actor) return [];
        const data = await actor.getBirdNames();
        return data;
      },
      !!actor && !isFetching
    )
  );
}

export const useBirdNames = useGetBirdNames;

export function useGetBirdLocations(birdName: string) {
  const { actor, isFetching } = useActor();

  return useQuery<Coordinate[] | null>(
    createOptimizedQuery(
      ['birdLocations', birdName],
      async () => {
        if (!actor) return null;
        return actor.getBirdLocations(birdName);
      },
      !!actor && !isFetching && !!birdName
    )
  );
}

export const useBirdLocations = useGetBirdLocations;

export function useGetAllBirdData() {
  const { actor, isFetching } = useActor();

  return useQuery<[string, BirdData][]>(
    createOptimizedQuery(
      ['allBirdData'],
      async () => {
        if (!actor) return [];
        return actor.getAllBirdData();
      },
      !!actor && !isFetching
    )
  );
}

export const useAllBirdData = useGetAllBirdData;

export function useGetAllLocations() {
  const { actor, isFetching } = useActor();

  return useQuery<LocationData[]>(
    createOptimizedQuery(
      ['allLocations'],
      async () => {
        if (!actor) return [];
        return actor.getAllLocationsWithNames();
      },
      !!actor && !isFetching
    )
  );
}

export const useAllLocationsWithNames = useGetAllLocations;

export function useGetAllLocationsForMap(filter: string) {
  const { actor, isFetching } = useActor();

  return useQuery<LocationData[]>(
    createOptimizedQuery(
      ['allLocationsForMap', filter],
      async () => {
        if (!actor) return [];
        return actor.getAllLocationsForMap(filter);
      },
      !!actor && !isFetching
    )
  );
}

export function useGetLocationCountByBird() {
  const { actor, isFetching } = useActor();

  return useQuery<[string, bigint][]>(
    createOptimizedQuery(
      ['locationCount'],
      async () => {
        if (!actor) return [];
        return actor.getLocationCountByBird();
      },
      !!actor && !isFetching
    )
  );
}

export const useLocationCountByBird = useGetLocationCountByBird;

export function useGetTotalBirdCount() {
  const { actor, isFetching } = useActor();

  return useQuery<bigint>(
    createOptimizedQuery(
      ['totalBirdCount'],
      async () => {
        if (!actor) return BigInt(0);
        return actor.getTotalBirdCount();
      },
      !!actor && !isFetching
    )
  );
}

export function useGetTotalLocationCount() {
  const { actor, isFetching } = useActor();

  return useQuery<bigint>(
    createOptimizedQuery(
      ['totalLocationCount'],
      async () => {
        if (!actor) return BigInt(0);
        return actor.getTotalLocationCount();
      },
      !!actor && !isFetching
    )
  );
}

export function useTotalStatistics() {
  const totalBirds = useGetTotalBirdCount();
  const totalLocations = useGetTotalLocationCount();

  return {
    totalBirds: totalBirds.data || BigInt(0),
    totalLocations: totalLocations.data || BigInt(0),
    isLoading: totalBirds.isLoading || totalLocations.isLoading,
  };
}

export function useGetSubImages(birdName: string) {
  const { actor, isFetching } = useActor();

  return useQuery<string[] | null>(
    createOptimizedQuery(
      ['subImages', birdName],
      async () => {
        if (!actor) return null;
        return actor.getSubImages(birdName);
      },
      !!actor && !isFetching && !!birdName
    )
  );
}

export function useGetAudioFile(birdName: string) {
  const { actor, isFetching } = useActor();

  return useQuery<string | null>(
    createOptimizedQuery(
      ['audioFile', birdName],
      async () => {
        if (!actor) return null;
        return actor.getAudioFile(birdName);
      },
      !!actor && !isFetching && !!birdName
    )
  );
}

export const useBirdAudio = useGetAudioFile;

export function useHasAudioFile(birdName: string) {
  const { actor, isFetching } = useActor();

  return useQuery<boolean>(
    createOptimizedQuery(
      ['hasAudioFile', birdName],
      async () => {
        if (!actor) return false;
        return actor.hasAudioFile(birdName);
      },
      !!actor && !isFetching && !!birdName
    )
  );
}

export function useGetBirdDetails(birdName: string) {
  const { actor, isFetching } = useActor();

  return useQuery<BirdData | null>(
    createOptimizedQuery(
      ['birdDetails', birdName],
      async () => {
        if (!actor) return null;
        return actor.getBirdDetails(birdName);
      },
      !!actor && !isFetching && !!birdName
    )
  );
}

export const useBirdDetails = useGetBirdDetails;

export function useBirdExists(birdName: string) {
  const { actor, isFetching } = useActor();

  return useQuery<boolean>(
    createOptimizedQuery(
      ['birdExists', birdName],
      async () => {
        if (!actor) return false;
        return actor.birdExists(birdName);
      },
      !!actor && !isFetching && !!birdName
    )
  );
}

export function useGetAllBirdDetails() {
  const { actor, isFetching } = useActor();

  return useQuery<[string, BirdData][]>(
    createOptimizedQuery(
      ['allBirdDetails'],
      async () => {
        if (!actor) return [];
        const data = await actor.getAllBirdDetails();
        return [...data];
      },
      !!actor && !isFetching
    )
  );
}

export function useGetNormalizedBirdNames() {
  const { actor, isFetching } = useActor();

  return useQuery<string[]>(
    createOptimizedQuery(
      ['normalizedBirdNames'],
      async () => {
        if (!actor) return [];
        return actor.getAllNormalizedBirdNames();
      },
      !!actor && !isFetching
    )
  );
}

export function useGetTeamMembers() {
  const { actor, isFetching } = useActor();

  return useQuery<TeamMember[]>(
    createOptimizedQuery(
      ['teamMembers'],
      async () => {
        if (!actor) return [];
        return actor.getTeamMembers();
      },
      !!actor && !isFetching
    )
  );
}

export function useGetTeamGroups() {
  const { actor, isFetching } = useActor();

  return useQuery<TeamGroup>(
    createOptimizedQuery(
      ['teamGroups'],
      async () => {
        if (!actor) {
          return {
            projectManagers: [],
            designers: [],
            followers: [],
            members: [],
          };
        }
        return actor.getTeamGroups();
      },
      !!actor && !isFetching
    )
  );
}

export function useGetFileReferences() {
  const { actor, isFetching } = useActor();

  return useQuery<FileReference[]>(
    createOptimizedQuery(
      ['fileReferences'],
      async () => {
        if (!actor) return [];
        return actor.listFileReferences();
      },
      !!actor && !isFetching
    )
  );
}

export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();

  const query = useQuery<UserProfile | null>(
    createOptimizedQuery(
      ['currentUserProfile', identity?.getPrincipal().toString()],
      async () => {
        if (!actor) throw new Error('Actor not available');
        return actor.getCallerUserProfile();
      },
      !!actor && !actorFetching && !!identity,
      { refetchInterval: 30000, staleTime: 10000 }
    )
  );

  // Return custom state that properly reflects actor dependency
  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error('Actor not available');
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
      toast.success('✅ تم حفظ الملف الشخصي بنجاح', {
        duration: 2000,
        position: 'bottom-center',
      });
    },
    onError: (error: any) => {
      toast.error('❌ فشل حفظ الملف الشخصي', {
        description: error?.message || 'حدث خطأ أثناء حفظ الملف الشخصي',
        duration: 3000,
        position: 'bottom-center',
      });
    },
  });
}

export function useGetCallerUserRole() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<UserRole>(
    createOptimizedQuery(
      ['callerUserRole', identity?.getPrincipal().toString()],
      async () => {
        if (!actor) return 'guest' as UserRole;
        return actor.getCallerUserRole();
      },
      !!actor && !isFetching && !!identity,
      { refetchInterval: 5000, staleTime: 2000 }
    )
  );
}

export function useIsAppManager() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<boolean>(
    createOptimizedQuery(
      ['isAppManager', identity?.getPrincipal().toString()],
      async () => {
        if (!actor) return false;
        return actor.isCallerAdmin();
      },
      !!actor && !isFetching && !!identity,
      { refetchInterval: 5000, staleTime: 2000 }
    )
  );
}

export function useCanModifyData() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<boolean>(
    createOptimizedQuery(
      ['canModifyData', identity?.getPrincipal().toString()],
      async () => {
        if (!actor) return false;
        try {
          const result = await actor.canCallerModifyData();
          return result;
        } catch (error: any) {
          console.error('Permission check error:', error);
          // If error contains authorization message, user is not authorized
          if (error?.message?.includes('صلاحية') || error?.message?.includes('Unauthorized')) {
            return false;
          }
          // For other errors, return false to be safe
          return false;
        }
      },
      !!actor && !isFetching && !!identity,
      { refetchInterval: 5000, staleTime: 2000 }
    )
  );
}

export function useAssignCallerUserRole() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ user, role }: { user: Principal; role: UserRole }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.assignCallerUserRole(user, role);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['callerUserRole'] });
      queryClient.invalidateQueries({ queryKey: ['canModifyData'] });
      queryClient.invalidateQueries({ queryKey: ['isAppManager'] });
      toast.success('✅ تم تحديث الصلاحيات بنجاح', {
        duration: 2000,
        position: 'bottom-center',
      });
    },
    onError: (error: any) => {
      toast.error('❌ فشل تحديث الصلاحيات', {
        description: error?.message || 'حدث خطأ أثناء تحديث الصلاحيات',
        duration: 3000,
        position: 'bottom-center',
      });
    },
  });
}

export function useGetActiveMapReference() {
  const { actor, isFetching } = useActor();

  return useQuery<string | null>(
    createOptimizedQuery(
      ['activeMapReference'],
      async () => {
        if (!actor) return null;
        return actor.getActiveMapReference();
      },
      !!actor && !isFetching
    )
  );
}

export function useAddBirdData() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ birdName, latitude, longitude }: { birdName: string; latitude: number; longitude: number }) => {
      if (!actor) throw new Error('Actor not available');
      
      // Check if bird exists before adding
      const exists = await actor.birdExists(birdName);
      
      // Add the bird data (backend will merge locations if bird exists)
      await actor.addBirdData(birdName, latitude, longitude);
      
      // Return whether this was a merge or new addition
      return { exists, birdName };
    },
    retry: (failureCount, error: any) => {
      if (error?.message?.includes('Unauthorized') || error?.message?.includes('not authorized') || error?.message?.includes('صلاحية')) {
        toast.error('⚠️ لا تملك صلاحية لتنفيذ هذا الإجراء', {
          description: 'يرجى تسجيل الدخول أو الحصول على الصلاحيات المناسبة',
          duration: 4000,
          position: 'bottom-center',
        });
        return false;
      }
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    onSuccess: async (data) => {
      clearAllBirdCache(queryClient);
      
      setTimeout(() => {
        invalidateAllBirdQueries(queryClient);
      }, 100);
      
      if (data.exists) {
        toast.success('✅ تم إضافة الموقع بنجاح', {
          description: `تم إضافة موقع جديد للطائر: ${data.birdName}`,
          duration: 3000,
          position: 'bottom-center',
        });
      } else {
        toast.success('✅ تم إضافة الطائر بنجاح', {
          description: `تم إضافة طائر جديد: ${data.birdName}`,
          duration: 3000,
          position: 'bottom-center',
        });
      }
    },
    onError: (error: any) => {
      if (!error?.message?.includes('صلاحية') && !error?.message?.includes('Unauthorized')) {
        toast.error('❌ فشل إضافة البيانات', {
          description: error?.message || 'حدث خطأ أثناء إضافة البيانات',
          duration: 3000,
          position: 'bottom-center',
        });
      }
    },
  });
}

export function useAddBirdWithDetails() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      arabicName, 
      scientificName, 
      englishName, 
      description, 
      notes, 
      latitude, 
      longitude, 
      audioFilePath, 
      subImages 
    }: { 
      arabicName: string; 
      scientificName: string; 
      englishName: string; 
      description: string; 
      notes: string; 
      latitude: number; 
      longitude: number; 
      audioFilePath: string | null; 
      subImages: string[];
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addBirdWithDetails(arabicName, scientificName, englishName, description, notes, latitude, longitude, audioFilePath, subImages);
    },
    retry: (failureCount, error: any) => {
      if (error?.message?.includes('Unauthorized') || error?.message?.includes('not authorized') || error?.message?.includes('صلاحية')) {
        return false;
      }
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    onSuccess: () => {
      clearAllBirdCache(queryClient);
      
      setTimeout(() => {
        invalidateAllBirdQueries(queryClient);
      }, 100);
    },
    onError: (error: any) => {
      if (!error?.message?.includes('صلاحية') && !error?.message?.includes('Unauthorized')) {
        toast.error('❌ فشل إضافة البيانات', {
          description: error?.message || 'حدث خطأ أثناء إضافة البيانات',
          duration: 3000,
          position: 'bottom-center',
        });
      }
    },
  });
}

export function useAddSubImage() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ birdName, imagePath }: { birdName: string; imagePath: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addSubImage(birdName, imagePath);
    },
    retry: (failureCount, error: any) => {
      if (error?.message?.includes('Unauthorized') || error?.message?.includes('not authorized') || error?.message?.includes('صلاحية')) {
        toast.error('⚠️ لا تملك صلاحية لتنفيذ هذا الإجراء', {
          description: 'يرجى تسجيل الدخول أو الحصول على الصلاحيات المناسبة',
          duration: 4000,
          position: 'bottom-center',
        });
        return false;
      }
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    onSuccess: (message) => {
      clearAllBirdCache(queryClient);
      
      setTimeout(() => {
        invalidateAllBirdQueries(queryClient);
      }, 100);
      
      toast.success(message || '✅ تم إضافة الصورة بنجاح!', {
        duration: 3000,
        position: 'bottom-center',
      });
    },
    onError: (error: any) => {
      if (!error?.message?.includes('صلاحية') && !error?.message?.includes('Unauthorized')) {
        toast.error('❌ فشل إضافة الصورة', {
          description: error?.message || 'حدث خطأ أثناء إضافة الصورة',
          duration: 3000,
          position: 'bottom-center',
        });
      }
    },
  });
}

export function useAddAudioFile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ birdName, audioFilePath }: { birdName: string; audioFilePath: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addAudioFile(birdName, audioFilePath);
    },
    retry: (failureCount, error: any) => {
      if (error?.message?.includes('Unauthorized') || error?.message?.includes('not authorized') || error?.message?.includes('صلاحية')) {
        toast.error('⚠️ لا تملك صلاحية لتنفيذ هذا الإجراء', {
          description: 'يرجى تسجيل الدخول أو الحصول على الصلاحيات المناسبة',
          duration: 4000,
          position: 'bottom-center',
        });
        return false;
      }
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    onSuccess: (message) => {
      clearAllBirdCache(queryClient);
      
      setTimeout(() => {
        invalidateAllBirdQueries(queryClient);
      }, 100);
      
      toast.success(message || '✅ تم حفظ الملف بنجاح!', {
        duration: 3000,
        position: 'bottom-center',
      });
    },
    onError: (error: any) => {
      if (!error?.message?.includes('صلاحية') && !error?.message?.includes('Unauthorized')) {
        toast.error('❌ فشل إضافة الملف الصوتي', {
          description: error?.message || 'حدث خطأ أثناء إضافة الملف الصوتي',
          duration: 3000,
          position: 'bottom-center',
        });
      }
    },
  });
}

// Alias for useAddAudioFile
export const useUploadAudio = useAddAudioFile;

export function useUpdateBirdDetails() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      birdName, 
      arabicName, 
      scientificName, 
      englishName, 
      description, 
      notes 
    }: { 
      birdName: string; 
      arabicName: string; 
      scientificName: string; 
      englishName: string; 
      description: string; 
      notes: string;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateBirdDetails(birdName, arabicName, scientificName, englishName, description, notes);
    },
    retry: (failureCount, error: any) => {
      if (error?.message?.includes('Unauthorized') || error?.message?.includes('not authorized') || error?.message?.includes('صلاحية')) {
        toast.error('⚠️ لا تملك صلاحية لتنفيذ هذا الإجراء', {
          description: 'يرجى تسجيل الدخول أو الحصول على الصلاحيات المناسبة',
          duration: 4000,
          position: 'bottom-center',
        });
        return false;
      }
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    onSuccess: () => {
      clearAllBirdCache(queryClient);
      
      setTimeout(() => {
        invalidateAllBirdQueries(queryClient);
      }, 100);
      
      toast.success('✅ تم تحديث البيانات بنجاح', {
        duration: 2000,
        position: 'bottom-center',
      });
    },
    onError: (error: any) => {
      if (!error?.message?.includes('صلاحية') && !error?.message?.includes('Unauthorized')) {
        toast.error('❌ فشل تحديث البيانات', {
          description: error?.message || 'حدث خطأ أثناء تحديث البيانات',
          duration: 3000,
          position: 'bottom-center',
        });
      }
    },
  });
}

export function useUpdateDescriptionAndNotes() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ birdName, newDescription, newNotes }: { birdName: string; newDescription: string; newNotes: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateDescriptionAndNotes(birdName, newDescription, newNotes);
    },
    retry: (failureCount, error: any) => {
      if (error?.message?.includes('Unauthorized') || error?.message?.includes('not authorized') || error?.message?.includes('صلاحية')) {
        toast.error('⚠️ لا تملك صلاحية لتنفيذ هذا الإجراء', {
          description: 'يرجى تسجيل الدخول أو الحصول على الصلاحيات المناسبة',
          duration: 4000,
          position: 'bottom-center',
        });
        return false;
      }
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    onSuccess: () => {
      clearAllBirdCache(queryClient);
      
      setTimeout(() => {
        invalidateAllBirdQueries(queryClient);
      }, 100);
      
      toast.success('✅ تم تحديث الوصف والملاحظات بنجاح', {
        duration: 2000,
        position: 'bottom-center',
      });
    },
    onError: (error: any) => {
      if (!error?.message?.includes('صلاحية') && !error?.message?.includes('Unauthorized')) {
        toast.error('❌ فشل تحديث البيانات', {
          description: error?.message || 'حدث خطأ أثناء تحديث البيانات',
          duration: 3000,
          position: 'bottom-center',
        });
      }
    },
  });
}

export function useSaveChanges() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ birdName, updatedData }: { birdName: string; updatedData: BirdData }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.saveChanges(birdName, updatedData);
    },
    retry: (failureCount, error: any) => {
      if (error?.message?.includes('Unauthorized') || error?.message?.includes('not authorized') || error?.message?.includes('صلاحية')) {
        toast.error('⚠️ لا تملك صلاحية لتنفيذ هذا الإجراء', {
          description: 'يرجى تسجيل الدخول أو الحصول على الصلاحيات المناسبة',
          duration: 4000,
          position: 'bottom-center',
        });
        return false;
      }
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    onSuccess: () => {
      clearAllBirdCache(queryClient);
      
      setTimeout(() => {
        invalidateAllBirdQueries(queryClient);
      }, 100);
      
      toast.success('✅ تم حفظ التغييرات بنجاح', {
        duration: 2000,
        position: 'bottom-center',
      });
    },
    onError: (error: any) => {
      if (!error?.message?.includes('صلاحية') && !error?.message?.includes('Unauthorized')) {
        toast.error('❌ فشل حفظ التغييرات', {
          description: error?.message || 'حدث خطأ أثناء حفظ التغييرات',
          duration: 3000,
          position: 'bottom-center',
        });
      }
    },
  });
}

export function useSaveAllBirdData() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (birdDataArray: [string, BirdData][]) => {
      if (!actor) throw new Error('Actor not available');
      return actor.saveAllBirdData(birdDataArray);
    },
    retry: (failureCount, error: any) => {
      if (error?.message?.includes('Unauthorized') || error?.message?.includes('not authorized') || error?.message?.includes('صلاحية')) {
        toast.error('⚠️ لا تملك صلاحية لتنفيذ هذا الإجراء', {
          description: 'يُسمح فقط لمدير التطبيق بحفظ جميع البيانات',
          duration: 4000,
          position: 'bottom-center',
        });
        return false;
      }
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    onSuccess: () => {
      clearAllBirdCache(queryClient);
      
      setTimeout(() => {
        invalidateAllBirdQueries(queryClient);
      }, 100);
      
      toast.success('✅ تم حفظ جميع البيانات بنجاح', {
        duration: 2000,
        position: 'bottom-center',
      });
    },
    onError: (error: any) => {
      if (!error?.message?.includes('صلاحية') && !error?.message?.includes('Unauthorized')) {
        toast.error('❌ فشل حفظ البيانات', {
          description: error?.message || 'حدث خطأ أثناء حفظ البيانات',
          duration: 3000,
          position: 'bottom-center',
        });
      }
    },
  });
}

export function useDeleteBirdData() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (birdName: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteBirdData(birdName);
    },
    retry: (failureCount, error: any) => {
      if (error?.message?.includes('Unauthorized') || error?.message?.includes('not authorized') || error?.message?.includes('صلاحية')) {
        toast.error('⚠️ لا تملك صلاحية لتنفيذ هذا الإجراء', {
          description: 'يرجى تسجيل الدخول أو الحصول على الصلاحيات المناسبة',
          duration: 4000,
          position: 'bottom-center',
        });
        return false;
      }
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    onSuccess: () => {
      clearAllBirdCache(queryClient);
      
      setTimeout(() => {
        invalidateAllBirdQueries(queryClient);
      }, 100);
      
      toast.success('✅ تم حذف البيانات بنجاح', {
        duration: 2000,
        position: 'bottom-center',
      });
    },
    onError: (error: any) => {
      if (!error?.message?.includes('صلاحية') && !error?.message?.includes('Unauthorized')) {
        toast.error('❌ فشل حذف البيانات', {
          description: error?.message || 'حدث خطأ أثناء حذف البيانات',
          duration: 3000,
          position: 'bottom-center',
        });
      }
    },
  });
}

export function useDeleteSubImage() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ birdName, imagePath }: { birdName: string; imagePath: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteImageFromBirdAndRegistry(birdName, imagePath);
    },
    retry: (failureCount, error: any) => {
      if (error?.message?.includes('Unauthorized') || error?.message?.includes('not authorized') || error?.message?.includes('صلاحية')) {
        toast.error('⚠️ لا تملك صلاحية لتنفيذ هذا الإجراء', {
          description: 'يرجى تسجيل الدخول أو الحصول على الصلاحيات المناسبة',
          duration: 4000,
          position: 'bottom-center',
        });
        return false;
      }
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    onSuccess: () => {
      clearAllBirdCache(queryClient);
      queryClient.invalidateQueries({ queryKey: ['fileReferences'] });
      
      setTimeout(() => {
        invalidateAllBirdQueries(queryClient);
      }, 100);
      
      toast.success('✅ تم حذف الصورة بنجاح', {
        duration: 2000,
        position: 'bottom-center',
      });
    },
    onError: (error: any) => {
      if (!error?.message?.includes('صلاحية') && !error?.message?.includes('Unauthorized')) {
        toast.error('❌ فشل حذف الصورة', {
          description: error?.message || 'حدث خطأ أثناء حذف الصورة',
          duration: 3000,
          position: 'bottom-center',
        });
      }
    },
  });
}
