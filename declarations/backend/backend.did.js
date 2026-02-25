export const idlFactory = ({ IDL }) => {
  const UserRole = IDL.Variant({
    'admin' : IDL.Null,
    'user' : IDL.Null,
    'guest' : IDL.Null,
  });
  const Coordinate = IDL.Record({
    'latitude' : IDL.Float64,
    'longitude' : IDL.Float64,
  });
  const BirdData = IDL.Record({
    'name' : IDL.Text,
    'audioFile' : IDL.Opt(IDL.Text),
    'locations' : IDL.Vec(Coordinate),
  });
  const LocationData = IDL.Record({
    'birdName' : IDL.Text,
    'coordinate' : Coordinate,
  });
  const UserProfile = IDL.Record({ 'name' : IDL.Text });
  const FileReference = IDL.Record({ 'hash' : IDL.Text, 'path' : IDL.Text });
  const TeamMember = IDL.Record({
    'residence' : IDL.Text,
    'fullNameTribe' : IDL.Text,
    'university' : IDL.Text,
    'number' : IDL.Int,
    'timestamp' : IDL.Int,
    'specialization' : IDL.Text,
    'contactNumber' : IDL.Text,
  });
  return IDL.Service({
    'addAudioFile' : IDL.Func([IDL.Text, IDL.Text], [], []),
    'addBirdData' : IDL.Func([IDL.Text, IDL.Float64, IDL.Float64], [], []),
    'addTeamMember' : IDL.Func(
        [IDL.Text, IDL.Text, IDL.Text, IDL.Text, IDL.Text, IDL.Int],
        [],
        [],
      ),
    'assignCallerUserRole' : IDL.Func([IDL.Principal, UserRole], [], []),
    'dropFileReference' : IDL.Func([IDL.Text], [], []),
    'getAllBirdData' : IDL.Func(
        [],
        [IDL.Vec(IDL.Tuple(IDL.Text, BirdData))],
        ['query'],
      ),
    'getAllCoordinates' : IDL.Func([], [IDL.Vec(Coordinate)], ['query']),
    'getAllLocationsForMap' : IDL.Func(
        [IDL.Text],
        [IDL.Vec(LocationData)],
        ['query'],
      ),
    'getAllLocationsWithNames' : IDL.Func(
        [],
        [IDL.Vec(LocationData)],
        ['query'],
      ),
    'getAudioFile' : IDL.Func([IDL.Text], [IDL.Opt(IDL.Text)], ['query']),
    'getBirdLocations' : IDL.Func(
        [IDL.Text],
        [IDL.Opt(IDL.Vec(Coordinate))],
        ['query'],
      ),
    'getBirdNames' : IDL.Func([], [IDL.Vec(IDL.Text)], ['query']),
    'getCallerUserProfile' : IDL.Func([], [IDL.Opt(UserProfile)], ['query']),
    'getCallerUserRole' : IDL.Func([], [UserRole], ['query']),
    'getFileReference' : IDL.Func([IDL.Text], [FileReference], ['query']),
    'getLocationCountByBird' : IDL.Func(
        [],
        [IDL.Vec(IDL.Tuple(IDL.Text, IDL.Int))],
        ['query'],
      ),
    'getTeamMembers' : IDL.Func([], [IDL.Vec(TeamMember)], ['query']),
    'getTotalBirdCount' : IDL.Func([], [IDL.Int], ['query']),
    'getTotalLocationCount' : IDL.Func([], [IDL.Int], ['query']),
    'getUserProfile' : IDL.Func(
        [IDL.Principal],
        [IDL.Opt(UserProfile)],
        ['query'],
      ),
    'initializeAccessControl' : IDL.Func([], [], []),
    'isCallerAdmin' : IDL.Func([], [IDL.Bool], ['query']),
    'listFileReferences' : IDL.Func([], [IDL.Vec(FileReference)], ['query']),
    'registerFileReference' : IDL.Func([IDL.Text, IDL.Text], [], []),
    'saveCallerUserProfile' : IDL.Func([UserProfile], [], []),
  });
};
export const init = ({ IDL }) => { return []; };
