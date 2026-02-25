import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { BirdData, UserProfile, UserRole } from '../backend';
import { toast } from 'sonner';

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

// ---- Authorization Queries ----

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
      toast.success('تم حفظ الملف الشخصي بنجاح');
    },
    onError: (error) => {
      console.error('Error saving profile:', error);
      toast.error('حدث خطأ أثناء حفظ الملف الشخصي');
    },
  });
}

// ---- Bird Mutations ----

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
      return actor.addBirdWithDetails(
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
      queryClient.invalidateQueries({ queryKey: ['allBirdDetails'] });
      queryClient.invalidateQueries({ queryKey: ['birdNames'] });
      queryClient.invalidateQueries({ queryKey: ['totalBirdCount'] });
      toast.success('تم إضافة الطائر بنجاح');
    },
    onError: (error) => {
      console.error('Error adding bird:', error);
      toast.error('حدث خطأ أثناء إضافة الطائر');
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
      queryClient.invalidateQueries({ queryKey: ['birdDetails'] });
      toast.success('تم تحديث بيانات الطائر بنجاح');
    },
    onError: (error) => {
      console.error('Error updating bird:', error);
      toast.error('حدث خطأ أثناء تحديث بيانات الطائر');
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
      queryClient.invalidateQueries({ queryKey: ['totalBirdCount'] });
      toast.success('تم حذف الطائر بنجاح');
    },
    onError: (error) => {
      console.error('Error deleting bird:', error);
      toast.error('حدث خطأ أثناء حذف الطائر');
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
      queryClient.invalidateQueries({ queryKey: ['birdDetails'] });
      toast.success('تم حفظ التغييرات بنجاح');
    },
    onError: (error) => {
      console.error('Error saving changes:', error);
      toast.error('حدث خطأ أثناء حفظ التغييرات');
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
      queryClient.invalidateQueries({ queryKey: ['birdNames'] });
      toast.success('تم حفظ جميع البيانات بنجاح');
    },
    onError: (error) => {
      console.error('Error saving all bird data:', error);
      toast.error('حدث خطأ أثناء حفظ البيانات');
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
      queryClient.invalidateQueries({ queryKey: ['subImages'] });
      toast.success('تم إضافة الصورة بنجاح');
    },
    onError: (error) => {
      console.error('Error adding sub image:', error);
      toast.error('حدث خطأ أثناء إضافة الصورة');
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
      queryClient.invalidateQueries({ queryKey: ['audioFile'] });
      toast.success('تم إضافة الملف الصوتي بنجاح');
    },
    onError: (error) => {
      console.error('Error adding audio file:', error);
      toast.error('حدث خطأ أثناء إضافة الملف الصوتي');
    },
  });
}

export function useDeleteSubImage() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { birdName: string; imagePath: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteSubImage(params.birdName, params.imagePath);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allBirdData'] });
      queryClient.invalidateQueries({ queryKey: ['allBirdDetails'] });
      queryClient.invalidateQueries({ queryKey: ['subImages'] });
      toast.success('تم حذف الصورة بنجاح');
    },
    onError: (error) => {
      console.error('Error deleting sub image:', error);
      toast.error('حدث خطأ أثناء حذف الصورة');
    },
  });
}

export function useDeleteImageFromBirdAndRegistry() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { birdName: string; imagePath: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteImageFromBirdAndRegistry(params.birdName, params.imagePath);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allBirdData'] });
      queryClient.invalidateQueries({ queryKey: ['allBirdDetails'] });
      queryClient.invalidateQueries({ queryKey: ['subImages'] });
      toast.success('تم حذف الصورة بنجاح');
    },
    onError: (error) => {
      console.error('Error deleting image:', error);
      toast.error('حدث خطأ أثناء حذف الصورة');
    },
  });
}

export function useDeleteAudioFile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (birdName: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteAudioFile(birdName);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allBirdData'] });
      queryClient.invalidateQueries({ queryKey: ['audioFile'] });
      toast.success('تم حذف الملف الصوتي بنجاح');
    },
    onError: (error) => {
      console.error('Error deleting audio file:', error);
      toast.error('حدث خطأ أثناء حذف الملف الصوتي');
    },
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
      toast.success('تم رفع خريطة بنجاح');
    },
    onError: (error) => {
      console.error('Error uploading map:', error);
      toast.error('حدث خطأ أثناء رفع الخريطة');
    },
  });
}

// ---- Role Assignment Mutation ----

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
      queryClient.invalidateQueries({ queryKey: ['isCallerAdmin'] });
      queryClient.invalidateQueries({ queryKey: ['callerUserRole'] });
      toast.success('تم تعيين الدور بنجاح');
    },
    onError: (error) => {
      console.error('Error assigning role:', error);
      toast.error('حدث خطأ أثناء تعيين الدور');
    },
  });
}

export function useAddBirdData() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { birdName: string; latitude: number; longitude: number }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addBirdData(params.birdName, params.latitude, params.longitude);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allBirdData'] });
      queryClient.invalidateQueries({ queryKey: ['allBirdDetails'] });
      queryClient.invalidateQueries({ queryKey: ['birdNames'] });
      queryClient.invalidateQueries({ queryKey: ['totalBirdCount'] });
      toast.success('تم إضافة بيانات الطائر بنجاح');
    },
    onError: (error) => {
      console.error('Error adding bird data:', error);
      toast.error('حدث خطأ أثناء إضافة بيانات الطائر');
    },
  });
}
