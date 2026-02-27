import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { BirdData, LocationEntry, UserProfile, UserRole } from '../backend';

// ─── Bird Data Queries ─────────────────────────────────────────────────────────

export function useGetAllBirdData() {
  const { actor, isFetching } = useActor();
  return useQuery<Array<[string, BirdData]>>({
    queryKey: ['allBirdData'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllBirdData();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetAllBirdDetails() {
  const { actor, isFetching } = useActor();
  return useQuery<Array<[string, BirdData]>>({
    queryKey: ['allBirdDetails'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllBirdDetails();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetBirdDetails(birdName: string) {
  const { actor, isFetching } = useActor();
  return useQuery<BirdData | null>({
    queryKey: ['birdDetails', birdName],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getBirdDetails(birdName);
    },
    enabled: !!actor && !isFetching && !!birdName,
  });
}

export function useGetBirdNames() {
  const { actor, isFetching } = useActor();
  return useQuery<string[]>({
    queryKey: ['birdNames'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getBirdNames();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetBirdLocations(birdName: string) {
  const { actor, isFetching } = useActor();
  return useQuery<LocationEntry[] | null>({
    queryKey: ['birdLocations', birdName],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getBirdLocations(birdName);
    },
    enabled: !!actor && !isFetching && !!birdName,
  });
}

export function useGetAllLocationsWithNames() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ['allLocationsWithNames'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllLocationsWithNames();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetAllLocationsForMap(filter: string) {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ['allLocationsForMap', filter],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllLocationsForMap(filter);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetLocationCountByBird() {
  const { actor, isFetching } = useActor();
  return useQuery<Array<[string, bigint]>>({
    queryKey: ['locationCountByBird'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getLocationCountByBird();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetTotalLocationCount() {
  const { actor, isFetching } = useActor();
  return useQuery<bigint>({
    queryKey: ['totalLocationCount'],
    queryFn: async () => {
      if (!actor) return BigInt(0);
      return actor.getTotalLocationCount();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetTotalBirdCount() {
  const { actor, isFetching } = useActor();
  return useQuery<bigint>({
    queryKey: ['totalBirdCount'],
    queryFn: async () => {
      if (!actor) return BigInt(0);
      return actor.getTotalBirdCount();
    },
    enabled: !!actor && !isFetching,
  });
}

// ─── Bird Data Mutations ───────────────────────────────────────────────────────

export function useSaveBirdData() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (birdData: BirdData) => {
      if (!actor) throw new Error('Actor not available');
      return actor.saveBirdData(birdData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allBirdData'] });
      queryClient.invalidateQueries({ queryKey: ['allBirdDetails'] });
      queryClient.invalidateQueries({ queryKey: ['birdNames'] });
    },
  });
}

export function useDeleteBirdById() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (birdId: bigint) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteBirdById(birdId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allBirdData'] });
      queryClient.invalidateQueries({ queryKey: ['allBirdDetails'] });
      queryClient.invalidateQueries({ queryKey: ['birdNames'] });
    },
  });
}

export function useAddBirdWithDetails() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      arabicName: string;
      scientificName: string;
      englishName: string;
      description: string;
      notes: string;
      latitude: number;
      longitude: number;
      mountainName: string;
      valleyName: string;
      governorate: string;
      locationDesc: string;
      audioFilePath: string | null;
      subImages: string[];
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addBirdWithDetails(
        params.arabicName,
        params.scientificName,
        params.englishName,
        params.description,
        params.notes,
        params.latitude,
        params.longitude,
        params.mountainName,
        params.valleyName,
        params.governorate,
        params.locationDesc,
        params.audioFilePath,
        params.subImages,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allBirdData'] });
      queryClient.invalidateQueries({ queryKey: ['allBirdDetails'] });
      queryClient.invalidateQueries({ queryKey: ['birdNames'] });
    },
  });
}

export function useAddBirdData() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      birdName: string;
      latitude: number;
      longitude: number;
      mountainName: string;
      valleyName: string;
      governorate: string;
      notes: string;
      locationDesc: string;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addBirdData(
        params.birdName,
        params.latitude,
        params.longitude,
        params.mountainName,
        params.valleyName,
        params.governorate,
        params.notes,
        params.locationDesc,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allBirdData'] });
      queryClient.invalidateQueries({ queryKey: ['allBirdDetails'] });
      queryClient.invalidateQueries({ queryKey: ['birdNames'] });
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allBirdData'] });
      queryClient.invalidateQueries({ queryKey: ['allBirdDetails'] });
      queryClient.invalidateQueries({ queryKey: ['birdNames'] });
    },
  });
}

export function useUpdateBirdDetails() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      birdName: string;
      arabicName: string;
      scientificName: string;
      englishName: string;
      description: string;
      notes: string;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateBirdDetails(
        params.birdName,
        params.arabicName,
        params.scientificName,
        params.englishName,
        params.description,
        params.notes,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allBirdData'] });
      queryClient.invalidateQueries({ queryKey: ['allBirdDetails'] });
    },
  });
}

export function useSaveAllBirdData() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (birdDataArray: Array<[string, BirdData]>) => {
      if (!actor) throw new Error('Actor not available');
      return actor.saveAllBirdData(birdDataArray);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allBirdData'] });
      queryClient.invalidateQueries({ queryKey: ['allBirdDetails'] });
    },
  });
}

// ─── Map Image Queries ─────────────────────────────────────────────────────────

export function useGetActiveMapReference() {
  const { actor, isFetching } = useActor();
  return useQuery<string | null>({
    queryKey: ['activeMapReference'],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getActiveMapReference();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useUploadMapImage() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (mapPath: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.uploadMapImage(mapPath);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activeMapReference'] });
    },
  });
}

// ─── Authorization Queries ─────────────────────────────────────────────────────

export function useGetCallerUserRole() {
  const { actor, isFetching } = useActor();
  return useQuery<UserRole>({
    queryKey: ['callerUserRole'],
    queryFn: async () => {
      if (!actor) return UserRole.guest;
      return actor.getCallerUserRole();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useIsCallerAdmin() {
  const { actor, isFetching } = useActor();
  return useQuery<boolean>({
    queryKey: ['isCallerAdmin'],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAssignCallerUserRole() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: { user: string; role: UserRole }) => {
      if (!actor) throw new Error('Actor not available');
      const { Principal } = await import('@dfinity/principal');
      const principalObj = Principal.fromText(params.user);
      return actor.assignCallerUserRole(principalObj as any, params.role);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['callerUserRole'] });
      queryClient.invalidateQueries({ queryKey: ['isCallerAdmin'] });
    },
  });
}

// ─── User Profile Queries ──────────────────────────────────────────────────────

export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();
  const query = useQuery<UserProfile | null>({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });

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
    },
  });
}

// ─── File Reference Queries ────────────────────────────────────────────────────

export function useListFileReferences() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ['fileReferences'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listFileReferences();
    },
    enabled: !!actor && !isFetching,
  });
}

// ─── Statistics Queries ────────────────────────────────────────────────────────

export function useGetStatistics() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ['statistics'],
    queryFn: async () => {
      if (!actor) return { totalBirds: BigInt(0), totalLocations: BigInt(0), locationsByBird: [] };
      const [totalBirds, totalLocations, locationsByBird] = await Promise.all([
        actor.getTotalBirdCount(),
        actor.getTotalLocationCount(),
        actor.getLocationCountByBird(),
      ]);
      return { totalBirds, totalLocations, locationsByBird };
    },
    enabled: !!actor && !isFetching,
  });
}

// ─── Audio File Queries ────────────────────────────────────────────────────────

export function useGetAudioFile(birdName: string) {
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

export function useGetSubImages(birdName: string) {
  const { actor, isFetching } = useActor();
  return useQuery<string[] | null>({
    queryKey: ['subImages', birdName],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getSubImages(birdName);
    },
    enabled: !!actor && !isFetching && !!birdName,
  });
}
