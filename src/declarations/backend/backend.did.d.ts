import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export interface BirdData {
  'name' : string,
  'audioFile' : [] | [string],
  'locations' : Array<Coordinate>,
}
export interface Coordinate { 'latitude' : number, 'longitude' : number }
export interface FileReference { 'hash' : string, 'path' : string }
export interface LocationData { 'birdName' : string, 'coordinate' : Coordinate }
export interface TeamMember {
  'residence' : string,
  'fullNameTribe' : string,
  'university' : string,
  'number' : bigint,
  'timestamp' : bigint,
  'specialization' : string,
  'contactNumber' : string,
}
export interface UserProfile { 'name' : string }
export type UserRole = { 'admin' : null } |
  { 'user' : null } |
  { 'guest' : null };
export interface _SERVICE {
  'addAudioFile' : ActorMethod<[string, string], undefined>,
  'addBirdData' : ActorMethod<[string, number, number], undefined>,
  'addTeamMember' : ActorMethod<
    [string, string, string, string, string, bigint],
    undefined
  >,
  'assignCallerUserRole' : ActorMethod<[Principal, UserRole], undefined>,
  'dropFileReference' : ActorMethod<[string], undefined>,
  'getAllBirdData' : ActorMethod<[], Array<[string, BirdData]>>,
  'getAllCoordinates' : ActorMethod<[], Array<Coordinate>>,
  'getAllLocationsForMap' : ActorMethod<[string], Array<LocationData>>,
  'getAllLocationsWithNames' : ActorMethod<[], Array<LocationData>>,
  'getAudioFile' : ActorMethod<[string], [] | [string]>,
  'getBirdLocations' : ActorMethod<[string], [] | [Array<Coordinate>]>,
  'getBirdNames' : ActorMethod<[], Array<string>>,
  'getCallerUserProfile' : ActorMethod<[], [] | [UserProfile]>,
  'getCallerUserRole' : ActorMethod<[], UserRole>,
  'getFileReference' : ActorMethod<[string], FileReference>,
  'getLocationCountByBird' : ActorMethod<[], Array<[string, bigint]>>,
  'getTeamMembers' : ActorMethod<[], Array<TeamMember>>,
  'getTotalBirdCount' : ActorMethod<[], bigint>,
  'getTotalLocationCount' : ActorMethod<[], bigint>,
  'getUserProfile' : ActorMethod<[Principal], [] | [UserProfile]>,
  'initializeAccessControl' : ActorMethod<[], undefined>,
  'isCallerAdmin' : ActorMethod<[], boolean>,
  'listFileReferences' : ActorMethod<[], Array<FileReference>>,
  'registerFileReference' : ActorMethod<[string, string], undefined>,
  'saveCallerUserProfile' : ActorMethod<[UserProfile], undefined>,
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
