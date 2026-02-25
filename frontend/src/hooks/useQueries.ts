import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { BirdData, UserProfile, UserRole } from '../backend';
import { Principal } from '@icp-sdk/core/principal';
import { toast } from 'sonner';

// ─── Bird Data Queries ───────────────────────────────────────────────────────

export function useGetAllBirdData() {
  const { actor, isFetching } = useActor();
  return useQuery<[string, BirdData][]>({
    queryKey: ['allBirdData'],
    queryFn: async () => {
      if (!actor) return [];
      const result = await actor.getAllBirdData();
      return result as [string, BirdData][];
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
      const result = await actor.getBirdDetails(birdName);
      return result ?? null;
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

export function useAllLocationsWithNames() {
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
      const result = await actor.getLocationCountByBird();
      return result as [string, bigint][];
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetSubImages(birdName: string) {
  const { actor, isFetching } = useActor();
  return useQuery<string[] | null>({
    queryKey: ['subImages', birdName],
    queryFn: async () => {
      if (!actor) return null;
      const result = await actor.getSubImages(birdName);
      return result ?? null;
    },
    enabled: !!actor && !isFetching && !!birdName,
  });
}

export function useGetAudioFile(birdName: string) {
  const { actor, isFetching } = useActor();
  return useQuery<string | null>({
    queryKey: ['audioFile', birdName],
    queryFn: async () => {
      if (!actor) return null;
      const result = await actor.getAudioFile(birdName);
      return result ?? null;
    },
    enabled: !!actor && !isFetching && !!birdName,
  });
}

// ─── Map Queries ─────────────────────────────────────────────────────────────

export function useGetActiveMapReference() {
  const { actor, isFetching } = useActor();
  return useQuery<string | null>({
    queryKey: ['activeMapReference'],
    queryFn: async () => {
      if (!actor) return null;
      const result = await actor.getActiveMapReference();
      return result ?? null;
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetBackupMapReference() {
  const { actor, isFetching } = useActor();
  return useQuery<string | null>({
    queryKey: ['backupMapReference'],
    queryFn: async () => {
      if (!actor) return null;
      const result = await actor.getBackupMapReference();
      return result ?? null;
    },
    enabled: !!actor && !isFetching,
  });
}

// ─── Auth / Role Queries ──────────────────────────────────────────────────────

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

export function useCanCallerModifyData() {
  const { actor, isFetching } = useActor();
  return useQuery<boolean>({
    queryKey: ['canCallerModifyData'],
    queryFn: async () => {
      if (!actor) return false;
      return actor.canCallerModifyData();
    },
    enabled: !!actor && !isFetching,
  });
}

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

// ─── User Profile Queries ─────────────────────────────────────────────────────

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

// ─── Team Queries ─────────────────────────────────────────────────────────────

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

// ─── Bird Mutations ───────────────────────────────────────────────────────────

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
      audioFilePath: string | null;
      subImages: string[];
    }) => {
      if (!actor) throw new Error('Actor not available');
      await actor.addBirdWithDetails(
        params.arabicName,
        params.scientificName,
        params.englishName,
        params.description,
        params.notes,
        params.latitude,
        params.longitude,
        params.audioFilePath,
        params.subImages
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allBirdData'] });
      queryClient.invalidateQueries({ queryKey: ['birdNames'] });
      queryClient.invalidateQueries({ queryKey: ['totalBirdCount'] });
    },
    onError: (error: any) => {
      toast.error(`فشل إضافة الطائر: ${error.message}`);
    },
  });
}

export function useDeleteBirdById() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (birdId: bigint) => {
      if (!actor) throw new Error('Actor not available');
      await actor.deleteBirdById(birdId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allBirdData'] });
      queryClient.invalidateQueries({ queryKey: ['birdNames'] });
      queryClient.invalidateQueries({ queryKey: ['totalBirdCount'] });
    },
    onError: (error: any) => {
      toast.error(`فشل حذف الطائر: ${error.message}`);
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
      await actor.updateBirdDetails(
        params.birdName,
        params.arabicName,
        params.scientificName,
        params.englishName,
        params.description,
        params.notes
      );
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['allBirdData'] });
      queryClient.invalidateQueries({ queryKey: ['birdDetails', variables.birdName] });
    },
    onError: (error: any) => {
      toast.error(`فشل تحديث البيانات: ${error.message}`);
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
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['allBirdData'] });
      queryClient.invalidateQueries({ queryKey: ['birdDetails', variables.birdName] });
      queryClient.invalidateQueries({ queryKey: ['subImages', variables.birdName] });
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
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['allBirdData'] });
      queryClient.invalidateQueries({ queryKey: ['birdDetails', variables.birdName] });
      queryClient.invalidateQueries({ queryKey: ['audioFile', variables.birdName] });
    },
  });
}

export function useDeleteBirdData() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (birdName: string) => {
      if (!actor) throw new Error('Actor not available');
      await actor.deleteBirdData(birdName);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allBirdData'] });
      queryClient.invalidateQueries({ queryKey: ['birdNames'] });
      queryClient.invalidateQueries({ queryKey: ['totalBirdCount'] });
    },
  });
}

export function useDeleteSubImage() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { birdName: string; imagePath: string }) => {
      if (!actor) throw new Error('Actor not available');
      await actor.deleteSubImage(params.birdName, params.imagePath);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['allBirdData'] });
      queryClient.invalidateQueries({ queryKey: ['birdDetails', variables.birdName] });
      queryClient.invalidateQueries({ queryKey: ['subImages', variables.birdName] });
    },
  });
}

export function useDeleteAudioFile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (birdName: string) => {
      if (!actor) throw new Error('Actor not available');
      await actor.deleteAudioFile(birdName);
    },
    onSuccess: (_, birdName) => {
      queryClient.invalidateQueries({ queryKey: ['allBirdData'] });
      queryClient.invalidateQueries({ queryKey: ['birdDetails', birdName] });
      queryClient.invalidateQueries({ queryKey: ['audioFile', birdName] });
    },
  });
}

export function useUploadMapImage() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (mapPath: string) => {
      if (!actor) throw new Error('Actor not available');
      await actor.uploadMapImage(mapPath);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activeMapReference'] });
      queryClient.invalidateQueries({ queryKey: ['backupMapReference'] });
    },
  });
}

export function useRestoreBackupMap() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error('Actor not available');
      await actor.restoreBackupMap();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activeMapReference'] });
      queryClient.invalidateQueries({ queryKey: ['backupMapReference'] });
    },
  });
}

// ─── Role Management Mutations ────────────────────────────────────────────────

export function useAssignCallerUserRole() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { user: string; role: UserRole }) => {
      if (!actor) throw new Error('Actor not available');
      const principal = Principal.fromText(params.user);
      await actor.assignCallerUserRole(principal, params.role);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['isCallerAdmin'] });
      queryClient.invalidateQueries({ queryKey: ['callerUserRole'] });
      queryClient.invalidateQueries({ queryKey: ['canCallerModifyData'] });
    },
    onError: (error: any) => {
      toast.error(`فشل تعيين الدور: ${error.message}`);
    },
  });
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error('Actor not available');
      await actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}
