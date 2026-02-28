import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface FileReference {
    hash: string;
    path: string;
}
export interface BirdData {
    id: bigint;
    subImages: Array<string>;
    localName: string;
    description: string;
    audioFile?: string;
    arabicName: string;
    englishName: string;
    notes: string;
    scientificName: string;
    locations: Array<LocationEntry>;
    mainImage?: string;
}
export interface TeamGroup {
    members: Array<string>;
    projectManagers: Array<string>;
    designers: Array<string>;
    followers: Array<string>;
}
export interface TeamMember {
    residence: string;
    fullNameTribe: string;
    university: string;
    number: bigint;
    timestamp: bigint;
    specialization: string;
    contactNumber: string;
}
export interface Coordinate {
    latitude: number;
    longitude: number;
}
export interface LocationData {
    birdName: string;
    coordinate: Coordinate;
}
export interface LocationEntry {
    valleyName: string;
    mountainName: string;
    notes: string;
    governorate: string;
    coordinate: Coordinate;
    location: string;
}
export interface UserProfile {
    name: string;
    role: string;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addAudioFile(birdName: string, audioFilePath: string): Promise<string>;
    addBirdData(birdName: string, latitude: number, longitude: number, mountainName: string, valleyName: string, governorate: string, notes: string, locationDesc: string): Promise<void>;
    addBirdWithDetails(arabicName: string, scientificName: string, englishName: string, description: string, notes: string, latitude: number, longitude: number, mountainName: string, valleyName: string, governorate: string, locationDesc: string, audioFilePath: string | null, subImages: Array<string>, mainImageFile: string | null): Promise<void>;
    addOrUpdateBird(arabicName: string, scientificName: string, englishName: string, description: string, notes: string, latitude: number, longitude: number, mountainName: string, valleyName: string, governorate: string, locationDesc: string, audioFilePath: string | null, subImages: Array<string>, mainImageFile: string | null): Promise<void>;
    addTeamMember(fullNameTribe: string, university: string, specialization: string, residence: string, contactNumber: string, number: bigint): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    birdExists(birdName: string): Promise<boolean>;
    canCallerModifyData(): Promise<boolean>;
    deleteAudioFile(birdName: string): Promise<void>;
    deleteBirdById(birdId: bigint): Promise<void>;
    deleteBirdData(birdName: string): Promise<void>;
    deleteImageFromBirdAndRegistry(birdName: string, imagePath: string): Promise<void>;
    deleteImageFromGallery(imagePath: string): Promise<void>;
    deleteImageFromGalleryAndBirds(imagePath: string): Promise<void>;
    deleteMainImageForBird(birdName: string): Promise<void>;
    deleteSubImage(birdName: string, imagePath: string): Promise<void>;
    dropFileReference(path: string): Promise<void>;
    getActiveMapReference(): Promise<string | null>;
    getAllBirdData(): Promise<Array<[string, BirdData]>>;
    getAllBirdDetails(): Promise<Array<[string, BirdData]>>;
    getAllCoordinates(): Promise<Array<Coordinate>>;
    getAllLocationsForMap(filter: string): Promise<Array<LocationData>>;
    getAllLocationsWithNames(): Promise<Array<LocationData>>;
    getAllNormalizedBirdNames(): Promise<Array<string>>;
    getAudioFile(birdName: string): Promise<string | null>;
    getBackupMapReference(): Promise<string | null>;
    getBirdDetails(birdName: string): Promise<BirdData | null>;
    getBirdLocations(birdName: string): Promise<Array<LocationEntry> | null>;
    getBirdNames(): Promise<Array<string>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getFileReference(path: string): Promise<FileReference>;
    getLocationCountByBird(): Promise<Array<[string, bigint]>>;
    getMainImage(birdName: string): Promise<string | null>;
    getSubImages(birdName: string): Promise<Array<string> | null>;
    getTeamGroups(): Promise<TeamGroup>;
    getTeamMembers(): Promise<Array<TeamMember>>;
    getTotalBirdCount(): Promise<bigint>;
    getTotalLocationCount(): Promise<bigint>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    hasAudioFile(birdName: string): Promise<boolean>;
    initializeAccessControl(): Promise<void>;
    isCallerAdmin(): Promise<boolean>;
    isCallerAuthorizedUser(): Promise<boolean>;
    listFileReferences(): Promise<Array<FileReference>>;
    registerFileReference(path: string, hash: string): Promise<void>;
    restoreBackupMap(): Promise<void>;
    saveAllBirdData(birdDataArray: Array<[string, BirdData]>): Promise<void>;
    saveBirdData(birdData: BirdData): Promise<void>;
    saveBirdDataArray(birdDataArray: Array<BirdData>): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    saveChanges(birdName: string, updatedData: BirdData): Promise<void>;
    setMainImage(birdName: string, imagePath: string): Promise<string>;
    updateBirdDetails(birdName: string, arabicName: string, scientificName: string, englishName: string, description: string, notes: string): Promise<void>;
    updateDescriptionAndNotes(birdName: string, newDescription: string, newNotes: string): Promise<void>;
    uploadMapImage(mapPath: string): Promise<void>;
}
