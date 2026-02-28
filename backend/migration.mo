import OrderedMap "mo:base/OrderedMap";
import Text "mo:base/Text";
import Nat "mo:base/Nat";
import Int "mo:base/Int";
import Principal "mo:base/Principal";
import Array "mo:base/Array";

module {
    type OldCoordinate = {
        latitude : Float;
        longitude : Float;
    };

    type OldLocationEntry = {
        coordinate : OldCoordinate;
        mountainName : Text;
        valleyName : Text;
        governorate : Text;
        notes : Text;
        location : Text;
    };

    type OldBirdData = {
        id : Nat;
        arabicName : Text;
        scientificName : Text;
        englishName : Text;
        description : Text;
        locations : [OldLocationEntry];
        audioFile : ?Text;
        subImages : [Text];
        notes : Text;
        localName : Text;
    };

    type OldLocationData = {
        birdName : Text;
        coordinate : OldCoordinate;
    };

    type OldUserProfile = {
        name : Text;
        role : Text;
    };

    type OldTeamMember = {
        timestamp : Int;
        fullNameTribe : Text;
        university : Text;
        specialization : Text;
        residence : Text;
        contactNumber : Text;
        number : Int;
    };

    type OldTeamGroup = {
        projectManagers : [Text];
        designers : [Text];
        followers : [Text];
        members : [Text];
    };

    type OldSecurityQuestion = {
        question : Text;
        answer : Text;
    };

    type OldContactData = {
        sectionName : Text;
        content : Text;
    };

    type OldContactReference = {
        name : Text;
        phoneNumber : Text;
        preferredContactMethod : Text;
    };

    type OldActor = {
        birdLocations : OrderedMap.Map<Text, OldBirdData>;
        userProfiles : OrderedMap.Map<Principal, OldUserProfile>;
        activeMapReference : ?Text;
        backupMapReference : ?Text;
        nextBirdId : Nat;
        lastModified : Int;
        teamMembers : OrderedMap.Map<Int, OldTeamMember>;
        securityQuestions : [OldSecurityQuestion];
        contactData : [OldContactData];
        emergencyContacts : [OldContactReference];
    };

    type NewCoordinate = {
        latitude : Float;
        longitude : Float;
    };

    type NewLocationEntry = {
        coordinate : NewCoordinate;
        mountainName : Text;
        valleyName : Text;
        governorate : Text;
        notes : Text;
        location : Text;
    };

    type NewBirdData = {
        id : Nat;
        arabicName : Text;
        scientificName : Text;
        englishName : Text;
        description : Text;
        locations : [NewLocationEntry];
        audioFile : ?Text;
        subImages : [Text];
        notes : Text;
        localName : Text;
        mainImage : ?Text;
    };

    type NewLocationData = {
        birdName : Text;
        coordinate : NewCoordinate;
    };

    type NewUserProfile = {
        name : Text;
        role : Text;
    };

    type NewTeamMember = {
        timestamp : Int;
        fullNameTribe : Text;
        university : Text;
        specialization : Text;
        residence : Text;
        contactNumber : Text;
        number : Int;
    };

    type NewTeamGroup = {
        projectManagers : [Text];
        designers : [Text];
        followers : [Text];
        members : [Text];
    };

    type NewSecurityQuestion = {
        question : Text;
        answer : Text;
    };

    type NewContactData = {
        sectionName : Text;
        content : Text;
    };

    type NewContactReference = {
        name : Text;
        phoneNumber : Text;
        preferredContactMethod : Text;
    };

    type NewActor = {
        birdLocations : OrderedMap.Map<Text, NewBirdData>;
        userProfiles : OrderedMap.Map<Principal, NewUserProfile>;
        activeMapReference : ?Text;
        backupMapReference : ?Text;
        nextBirdId : Nat;
        lastModified : Int;
        teamMembers : OrderedMap.Map<Int, NewTeamMember>;
        securityQuestions : [NewSecurityQuestion];
        contactData : [NewContactData];
        emergencyContacts : [NewContactReference];
    };

    public func run(old : OldActor) : NewActor {
        let textMap = OrderedMap.Make<Text>(Text.compare);
        let principalMap = OrderedMap.Make<Principal>(Principal.compare);
        let teamMap = OrderedMap.Make<Int>(Int.compare);

        let birdLocations = textMap.map<OldBirdData, NewBirdData>(
            old.birdLocations,
            func(_key, oldBirdData) {
                {
                    oldBirdData with
                    mainImage = null;
                };
            },
        );

        var emergencyContacts = old.emergencyContacts;
        let newContact : NewContactReference = {
            name = "سعيد البحري";
            phoneNumber = "+968 9123 4501";
            preferredContactMethod = "اتصال مباشر";
        };
        emergencyContacts := Array.append(emergencyContacts, [newContact]);

        let teamMembers = teamMap.map<OldTeamMember, NewTeamMember>(
            old.teamMembers,
            func(_k, v) { v },
        );
        let userProfiles = principalMap.map<OldUserProfile, NewUserProfile>(
            old.userProfiles,
            func(_k, v) { v },
        );

        {
            birdLocations;
            userProfiles;
            activeMapReference = old.activeMapReference;
            backupMapReference = old.backupMapReference;
            nextBirdId = old.nextBirdId;
            lastModified = old.lastModified;
            teamMembers;
            securityQuestions = old.securityQuestions;
            contactData = old.contactData;
            emergencyContacts;
        };
    };
};

