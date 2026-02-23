import OrderedMap "mo:base/OrderedMap";
import Text "mo:base/Text";
import Principal "mo:base/Principal";
import Int "mo:base/Int";
import Registry "blob-storage/registry";
import AccessControl "authorization/access-control";

module {
    type BirdData = {
        id : Nat;
        arabicName : Text;
        scientificName : Text;
        englishName : Text;
        description : Text;
        locations : [{
            latitude : Float;
            longitude : Float;
        }];
        audioFile : ?Text;
        subImages : [Text];
        notes : Text;
    };

    type UserProfile = {
        name : Text;
        role : Text;
    };

    type TeamMember = {
        timestamp : Int;
        fullNameTribe : Text;
        university : Text;
        specialization : Text;
        residence : Text;
        contactNumber : Text;
        number : Int;
    };

    type OldActor = {
        nextBirdId : Nat;
        birdLocations : OrderedMap.Map<Text, BirdData>;
        teamMembers : OrderedMap.Map<Int, TeamMember>;
        userProfiles : OrderedMap.Map<Principal, UserProfile>;
        registry : Registry.Registry; // Fixed type here
        accessControlState : AccessControl.AccessControlState;
        activeMapReference : ?Text;
        backupMapReference : ?Text;
    };

    type NewActor = {
        nextBirdId : Nat;
        birdLocations : OrderedMap.Map<Text, BirdData>;
        teamMembers : OrderedMap.Map<Int, TeamMember>;
        userProfiles : OrderedMap.Map<Principal, UserProfile>;
        registry : Registry.Registry;
        accessControlState : AccessControl.AccessControlState;
        activeMapReference : ?Text;
        backupMapReference : ?Text;
    };

    public func run(old : OldActor) : NewActor {
        {
            nextBirdId = old.nextBirdId;
            birdLocations = old.birdLocations;
            teamMembers = old.teamMembers;
            userProfiles = old.userProfiles;
            registry = old.registry;
            accessControlState = old.accessControlState;
            activeMapReference = old.activeMapReference;
            backupMapReference = old.backupMapReference;
        };
    };
};

