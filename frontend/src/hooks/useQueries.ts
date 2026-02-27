import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { BirdData, UserProfile, UserRole } from '../backend';

// ---- Bird Data Queries ----

export function useGetAllBirdData() {
  const { actor, isFetching } = useActor();
  return useQuery<[string, BirdData][]>({
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
  return useQuery<[string, BirdData][]>({
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

export function useGetLocationCountByBird() {
  const { actor, isFetching } = useActor();
  return useQuery<[string, bigint][]>({
    queryKey: ['locationCountByBird'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getLocationCountByBird();
    },
    enabled: !!actor && !isFetching,
  });
}

// ---- Bird Data Mutations ----

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
        params.locationDesc
      );
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
        params.subImages
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
        params.notes
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allBirdData'] });
      queryClient.invalidateQueries({ queryKey: ['allBirdDetails'] });
    },
  });
}

export function useSaveChanges() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: { birdName: string; updatedData: BirdData }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.saveChanges(params.birdName, params.updatedData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allBirdData'] });
      queryClient.invalidateQueries({ queryKey: ['allBirdDetails'] });
    },
  });
}

export function useAddAudioFile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: { birdName: string; audioFilePath: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addAudioFile(params.birdName, params.audioFilePath);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allBirdData'] });
      queryClient.invalidateQueries({ queryKey: ['allBirdDetails'] });
    },
  });
}

export function useAddSubImage() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: { birdName: string; imagePath: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addSubImage(params.birdName, params.imagePath);
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
    mutationFn: async (birdDataArray: [string, BirdData][]) => {
      if (!actor) throw new Error('Actor not available');
      return actor.saveAllBirdData(birdDataArray);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allBirdData'] });
      queryClient.invalidateQueries({ queryKey: ['allBirdDetails'] });
    },
  });
}

// ---- User Profile Queries ----

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

// ---- Access Control ----

export function useGetCallerUserRole() {
  const { actor, isFetching } = useActor();
  return useQuery<UserRole>({
    queryKey: ['callerUserRole'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
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

// ---- Map ----

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

// ---- Team ----

export function useGetTeamGroups() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ['teamGroups'],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getTeamGroups();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetTeamMembers() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ['teamMembers'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getTeamMembers();
    },
    enabled: !!actor && !isFetching,
  });
}
