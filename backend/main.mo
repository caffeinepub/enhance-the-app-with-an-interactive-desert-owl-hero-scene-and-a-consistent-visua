import OrderedMap "mo:base/OrderedMap";
import Text "mo:base/Text";
import Iter "mo:base/Iter";
import Float "mo:base/Float";
import List "mo:base/List";
import Array "mo:base/Array";
import Int "mo:base/Int";
import Registry "blob-storage/registry";
import BlobStorage "blob-storage/Mixin";
import AccessControl "authorization/access-control";
import Principal "mo:base/Principal";
import Debug "mo:base/Debug";



actor {
    type Coordinate = {
        latitude : Float;
        longitude : Float;
    };

    type LocationEntry = {
        coordinate : Coordinate;
        mountainName : Text;
        valleyName : Text;
        governorate : Text;
        notes : Text;
        location : Text;
    };

    type BirdData = {
        id : Nat;
        arabicName : Text;
        scientificName : Text;
        englishName : Text;
        description : Text;
        locations : [LocationEntry];
        audioFile : ?Text;
        subImages : [Text];
        notes : Text;
        localName : Text;
    };

    type LocationData = {
        birdName : Text;
        coordinate : Coordinate;
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

    type TeamGroup = {
        projectManagers : [Text];
        designers : [Text];
        followers : [Text];
        members : [Text];
    };

    type SecurityQuestion = {
        question : Text;
        answer : Text;
    };

    type ContactData = {
        sectionName : Text;
        content : Text;
    };

    type ContactReference = {
        name : Text;
        phoneNumber : Text;
        preferredContactMethod : Text;
    };

    let registry = Registry.new();
    let accessControlState = AccessControl.initState();

    transient let textMap = OrderedMap.Make<Text>(Text.compare);
    var birdLocationsSnapshot : OrderedMap.Map<Text, BirdData> = textMap.empty();
    var birdLocationsBackup : OrderedMap.Map<Text, BirdData> = textMap.empty();
    var isBackupInProgress : Bool = false;

    transient let principalMap = OrderedMap.Make<Principal>(Principal.compare);
    var userProfiles : OrderedMap.Map<Principal, UserProfile> = principalMap.empty();

    var activeMapReference : ?Text = null;
    var backupMapReference : ?Text = null;

    var nextBirdId : Nat = 1;

    var lastModified : Int = 0;

    transient let teamMap = OrderedMap.Make<Int>(Int.compare);
    var teamMembers : OrderedMap.Map<Int, TeamMember> = teamMap.empty();

    include BlobStorage(registry);

    var securityQuestions : [SecurityQuestion] = [
        { question = "ما هو لون سيارتك الأولى؟"; answer = "أبيض" },
        { question = "ما هو اسم صديق طفولتك المقرب؟"; answer = "خالد" },
    ];

    var contactData : [ContactData] = [
        { sectionName = "البريد الإلكتروني"; content = "info@omancrowdfunding.com" },
        { sectionName = "الرقم الواتساب"; content = "+968 9477 8566" },
    ];

    var emergencyContacts : [ContactReference] = [
        {
            name = "محمد العلوي";
            phoneNumber = "+968 9939 1088";
            preferredContactMethod = "واتساب";
        },
        {
            name = "خالد البلوشي";
            phoneNumber = "+968 9321 4421";
            preferredContactMethod = "اتصال مباشر";
        },
    ];

    // --- Access Control ---
    public shared ({ caller }) func initializeAccessControl() : async () {
        AccessControl.initialize(accessControlState, caller);
    };

    public query ({ caller }) func getCallerUserRole() : async AccessControl.UserRole {
        AccessControl.getUserRole(accessControlState, caller);
    };

    public shared ({ caller }) func assignCallerUserRole(user : Principal, role : AccessControl.UserRole) : async () {
        AccessControl.assignRole(accessControlState, caller, user, role);
    };

    public query ({ caller }) func isCallerAdmin() : async Bool {
        AccessControl.isAdmin(accessControlState, caller);
    };

    public query ({ caller }) func isCallerAuthorizedUser() : async Bool {
        AccessControl.hasPermission(accessControlState, caller, #user);
    };

    public query ({ caller }) func canCallerModifyData() : async Bool {
        AccessControl.isAdmin(accessControlState, caller);
    };

    // --- User Profile Management ---
    public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
        if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
            Debug.trap("Unauthorized: Only users can view profiles");
        };
        principalMap.get(userProfiles, caller);
    };

    public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
        if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
            Debug.trap("Unauthorized: Can only view your own profile");
        };
        principalMap.get(userProfiles, user);
    };

    public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
        if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
            Debug.trap("Unauthorized: Only users can save profiles");
        };
        userProfiles := principalMap.put(userProfiles, caller, profile);
    };

    // --- File Reference Management ---
    public shared ({ caller }) func registerFileReference(path : Text, hash : Text) : async () {
        if (not AccessControl.isAdmin(accessControlState, caller)) {
            Debug.trap("Unauthorized: Only admins can register file references");
        };
        Registry.add(registry, path, hash);
    };

    public query func getFileReference(path : Text) : async Registry.FileReference {
        Registry.get(registry, path);
    };

    public query func listFileReferences() : async [Registry.FileReference] {
        Registry.list(registry);
    };

    public shared ({ caller }) func dropFileReference(path : Text) : async () {
        if (not AccessControl.isAdmin(accessControlState, caller)) {
            Debug.trap("Unauthorized: Only admins can remove file references");
        };
        Registry.remove(registry, path);
    };

    // --- Map Image Management ---
    public shared ({ caller }) func uploadMapImage(mapPath : Text) : async () {
        if (not AccessControl.isAdmin(accessControlState, caller)) {
            Debug.trap("Unauthorized: Only admins can upload map images");
        };

        switch (activeMapReference) {
            case (null) {};
            case (?currentMap) {
                backupMapReference := ?currentMap;
            };
        };

        activeMapReference := ?mapPath;
    };

    public query func getActiveMapReference() : async ?Text {
        activeMapReference;
    };

    public query func getBackupMapReference() : async ?Text {
        backupMapReference;
    };

    public shared ({ caller }) func restoreBackupMap() : async () {
        if (not AccessControl.isAdmin(accessControlState, caller)) {
            Debug.trap("Unauthorized: Only admins can restore backup maps");
        };

        switch (backupMapReference) {
            case (null) { Debug.trap("No backup map available") };
            case (?backupMap) {
                let currentActive = activeMapReference;
                activeMapReference := ?backupMap;
                backupMapReference := currentActive;
            };
        };
    };

    // --- Bird Data Retrieval ---
    public query func getBirdNames() : async [Text] {
        let birdNames = Iter.toArray(textMap.keys(birdLocationsSnapshot));
        let normalizedNames = Array.map<Text, Text>(birdNames, func(name) { normalizeBirdName(name) });
        normalizedNames;
    };

    public query func getBirdLocations(birdName : Text) : async ?[LocationEntry] {
        switch (textMap.get(birdLocationsSnapshot, birdName)) {
            case (null) { null };
            case (?birdData) { ?birdData.locations };
        };
    };

    public query func getAllBirdData() : async [(Text, BirdData)] {
        let result = Iter.toArray(textMap.entries(birdLocationsSnapshot));
        Debug.print("getAllBirdData: returning " # debug_show(result.size()) # " records");
        for ((name, bd) in result.vals()) {
            Debug.print("Bird: " # name # " subImages count: " # debug_show(bd.subImages.size()) # " audioFile: " # debug_show(bd.audioFile));
        };
        result;
    };

    public query func getAllCoordinates() : async [Coordinate] {
        var allCoordinates = List.nil<Coordinate>();
        for ((_, birdData) in textMap.entries(birdLocationsSnapshot)) {
            for (loc in birdData.locations.vals()) {
                allCoordinates := List.push(loc.coordinate, allCoordinates);
            };
        };
        List.toArray(allCoordinates);
    };

    public query func getAllLocationsWithNames() : async [LocationData] {
        var allLocations = List.nil<LocationData>();
        for ((birdName, birdData) in textMap.entries(birdLocationsSnapshot)) {
            for (loc in birdData.locations.vals()) {
                allLocations := List.push({ birdName; coordinate = loc.coordinate }, allLocations);
            };
        };
        List.toArray(allLocations);
    };

    public query func getLocationCountByBird() : async [(Text, Int)] {
        var counts = List.nil<(Text, Int)>();
        for ((birdName, birdData) in textMap.entries(birdLocationsSnapshot)) {
            counts := List.push((birdName, Array.size(birdData.locations)), counts);
        };
        List.toArray(counts);
    };

    public query func getTotalLocationCount() : async Int {
        var total = 0;
        for ((_, birdData) in textMap.entries(birdLocationsSnapshot)) {
            total += Array.size(birdData.locations);
        };
        total;
    };

    public query func getTotalBirdCount() : async Int {
        Int.abs(textMap.size(birdLocationsSnapshot));
    };

    public query func getAllLocationsForMap(filter : Text) : async [LocationData] {
        var allLocations = List.nil<LocationData>();
        for ((birdName, birdData) in textMap.entries(birdLocationsSnapshot)) {
            if (filter == "all") {
                for (loc in birdData.locations.vals()) {
                    allLocations := List.push({ birdName; coordinate = loc.coordinate }, allLocations);
                };
            } else if (birdName == filter) {
                for (loc in birdData.locations.vals()) {
                    allLocations := List.push({ birdName; coordinate = loc.coordinate }, allLocations);
                };
            };
        };
        List.toArray(allLocations);
    };

    // --- Media File Management for Birds ---
    public query func getSubImages(birdName : Text) : async ?[Text] {
        let normalizedBirdName = normalizeBirdName(birdName);

        switch (findBirdByNormalizedName(normalizedBirdName)) {
            case (null) { null };
            case (?(_, birdData)) { ?birdData.subImages };
        };
    };

    public query func getAudioFile(birdName : Text) : async ?Text {
        let normalizedBirdName = normalizeBirdName(birdName);

        switch (findBirdByNormalizedName(normalizedBirdName)) {
            case (null) { null };
            case (?(_, birdData)) { birdData.audioFile };
        };
    };

    public query func hasAudioFile(birdName : Text) : async Bool {
        let normalizedBirdName = normalizeBirdName(birdName);

        switch (findBirdByNormalizedName(normalizedBirdName)) {
            case (null) { false };
            case (?(_, birdData)) {
                switch (birdData.audioFile) {
                    case (null) { false };
                    case (?_) { true };
                };
            };
        };
    };

    // --- Bird Data Existence and Details ---
    public query func birdExists(birdName : Text) : async Bool {
        let normalizedBirdName = normalizeBirdName(birdName);
        switch (findBirdByNormalizedName(normalizedBirdName)) {
            case (null) { false };
            case (?_) { true };
        };
    };

    public query func getBirdDetails(birdName : Text) : async ?BirdData {
        let normalizedBirdName = normalizeBirdName(birdName);
        switch (findBirdByNormalizedName(normalizedBirdName)) {
            case (null) { null };
            case (?(_, birdData)) {
                Debug.print("getBirdDetails for " # birdName # ": subImages=" # debug_show(birdData.subImages.size()) # " audioFile=" # debug_show(birdData.audioFile));
                ?birdData;
            };
        };
    };

    public query func getAllBirdDetails() : async [(Text, BirdData)] {
        let result = Iter.toArray(textMap.entries(birdLocationsSnapshot));
        Debug.print("getAllBirdDetails: returning " # debug_show(result.size()) # " records");
        for ((name, bd) in result.vals()) {
            Debug.print("Bird: " # name # " subImages=" # debug_show(bd.subImages.size()) # " audioFile=" # debug_show(bd.audioFile) # " locations=" # debug_show(bd.locations.size()));
        };
        result;
    };

    public query func getAllNormalizedBirdNames() : async [Text] {
        let birdNames = Iter.toArray(textMap.keys(birdLocationsSnapshot));
        let normalizedNames = Array.map<Text, Text>(birdNames, func(name) { normalizeBirdName(name) });
        normalizedNames;
    };

    // --- Team Management ---
    public query func getTeamMembers() : async [TeamMember] {
        Iter.toArray(teamMap.vals(teamMembers));
    };

    public query func getTeamGroups() : async TeamGroup {
        {
            projectManagers = ["Mohammed Al Balushi"];
            designers = ["Nabila Al Jabri"];
            followers = ["Nasser Al Yaqoubi", "Salem Al Maskari", "Hazza Al Maamari", "Fatima Al Jabri"];
            members = ["Youssef Al Alawi", "Hilal Al Shamsi", "Marwan Al Zaidi", "Ahlam Al Maqbali", "Amina Al Kindi"];
        };
    };

    // --- Name Normalization and Lookup ---
    func normalizeBirdName(birdName : Text) : Text {
        let trimmed = Text.trim(birdName, #char ' ');
        let noTashkeel = Text.map(trimmed, func c { if (c == '\u{0640}') { ' ' } else { c } });
        let noSpaces = Text.replace(noTashkeel, #text " ", "");
        let noDashes = Text.replace(noSpaces, #text "-", "");
        let noSub = if (Text.endsWith(noDashes, #text "sub")) {
            let len = Text.size(noDashes);
            if (len > 3) {
                Text.trimEnd(noDashes, #text "sub");
            } else {
                noDashes;
            };
        } else {
            noDashes;
        };
        noSub;
    };

    func findBirdByNormalizedName(normalizedBirdName : Text) : ?(Text, BirdData) {
        for ((key, value) in textMap.entries(birdLocationsSnapshot)) {
            if (normalizeBirdName(key) == normalizedBirdName) {
                return ?(key, value);
            };
        };
        null;
    };

    // --- CRUD Operations for Birds (Admin-only) ---
    public shared ({ caller }) func addBirdData(birdName : Text, latitude : Float, longitude : Float, mountainName : Text, valleyName : Text, governorate : Text, notes : Text, locationDesc : Text) : async () {
        if (not AccessControl.isAdmin(accessControlState, caller)) {
            Debug.trap("Unauthorized: Only admins can add bird data");
        };

        let coordinate = { latitude; longitude };
        let locationEntry = {
            coordinate;
            mountainName;
            valleyName;
            governorate;
            notes;
            location = locationDesc;
        };
        let normalizedBirdName = normalizeBirdName(birdName);

        switch (findBirdByNormalizedName(normalizedBirdName)) {
            case (null) {
                let newBirdData = {
                    id = nextBirdId;
                    arabicName = birdName;
                    scientificName = "";
                    englishName = "";
                    description = "";
                    locations = [locationEntry];
                    audioFile = null;
                    subImages = [];
                    notes = "";
                    localName = "";
                };
                birdLocationsSnapshot := textMap.put(birdLocationsSnapshot, normalizedBirdName, newBirdData);
                nextBirdId += 1;
            };
            case (?(originalName, birdData)) {
                let updatedLocations = Array.append(birdData.locations, [locationEntry]);
                let updatedBirdData = { birdData with locations = updatedLocations };
                birdLocationsSnapshot := textMap.put(birdLocationsSnapshot, originalName, updatedBirdData);
            };
        };
    };

    public shared ({ caller }) func addBirdWithDetails(arabicName : Text, scientificName : Text, englishName : Text, description : Text, notes : Text, latitude : Float, longitude : Float, mountainName : Text, valleyName : Text, governorate : Text, locationDesc : Text, audioFilePath : ?Text, subImages : [Text]) : async () {
        if (not AccessControl.isAdmin(accessControlState, caller)) {
            Debug.trap("Unauthorized: Only admins can add bird data");
        };

        let coordinate = { latitude; longitude };
        let locationEntry = {
            coordinate;
            mountainName;
            valleyName;
            governorate;
            notes;
            location = locationDesc;
        };
        let normalizedBirdName = normalizeBirdName(arabicName);

        switch (findBirdByNormalizedName(normalizedBirdName)) {
            case (null) {
                let newBirdData = {
                    id = nextBirdId;
                    arabicName;
                    scientificName;
                    englishName;
                    description;
                    locations = [locationEntry];
                    audioFile = audioFilePath;
                    subImages;
                    notes;
                    localName = "";
                };
                birdLocationsSnapshot := textMap.put(birdLocationsSnapshot, normalizedBirdName, newBirdData);
                nextBirdId += 1;
            };
            case (?(originalName, birdData)) {
                let updatedLocations = Array.append(birdData.locations, [locationEntry]);
                let updatedBirdData = { birdData with locations = updatedLocations };
                birdLocationsSnapshot := textMap.put(birdLocationsSnapshot, originalName, updatedBirdData);
            };
        };
    };

    public shared ({ caller }) func addOrUpdateBird(arabicName : Text, scientificName : Text, englishName : Text, description : Text, notes : Text, latitude : Float, longitude : Float, mountainName : Text, valleyName : Text, governorate : Text, locationDesc : Text, audioFilePath : ?Text, subImages : [Text]) : async () {
        if (not AccessControl.isAdmin(accessControlState, caller)) {
            Debug.trap("Unauthorized: Only admins can add or update bird data");
        };

        let coordinate = { latitude; longitude };
        let locationEntry = {
            coordinate;
            mountainName;
            valleyName;
            governorate;
            notes;
            location = locationDesc;
        };
        let normalizedBirdName = normalizeBirdName(arabicName);

        switch (findBirdByNormalizedName(normalizedBirdName)) {
            case (null) {
                let newBirdData = {
                    id = nextBirdId;
                    arabicName;
                    scientificName;
                    englishName;
                    description;
                    locations = [locationEntry];
                    audioFile = audioFilePath;
                    subImages;
                    notes;
                    localName = "";
                };
                birdLocationsSnapshot := textMap.put(birdLocationsSnapshot, normalizedBirdName, newBirdData);
                nextBirdId += 1;
            };
            case (?(originalName, birdData)) {
                let updatedLocations = Array.append(birdData.locations, [locationEntry]);
                let updatedBirdData = { birdData with locations = updatedLocations };
                birdLocationsSnapshot := textMap.put(birdLocationsSnapshot, originalName, updatedBirdData);
            };
        };
    };

    public shared ({ caller }) func addAudioFile(birdName : Text, audioFilePath : Text) : async Text {
        if (not AccessControl.isAdmin(accessControlState, caller)) {
            Debug.trap("Unauthorized: Only admins can add audio files");
        };

        let normalizedBirdName = normalizeBirdName(birdName);

        switch (findBirdByNormalizedName(normalizedBirdName)) {
            case (null) {
                let newBirdData = {
                    id = nextBirdId;
                    arabicName = birdName;
                    scientificName = "";
                    englishName = "";
                    description = "";
                    locations = [];
                    audioFile = ?audioFilePath;
                    subImages = [];
                    notes = "";
                    localName = "";
                };
                birdLocationsSnapshot := textMap.put(birdLocationsSnapshot, normalizedBirdName, newBirdData);
                nextBirdId += 1;
            };
            case (?(originalName, birdData)) {
                let updatedBirdData = { birdData with audioFile = ?audioFilePath };
                birdLocationsSnapshot := textMap.put(birdLocationsSnapshot, originalName, updatedBirdData);
            };
        };

        "✅ تم حفظ الملف بنجاح!";
    };

    public shared ({ caller }) func addSubImage(birdName : Text, imagePath : Text) : async Text {
        if (not AccessControl.isAdmin(accessControlState, caller)) {
            Debug.trap("Unauthorized: Only admins can add sub images");
        };

        let normalizedBirdName = normalizeBirdName(birdName);

        switch (findBirdByNormalizedName(normalizedBirdName)) {
            case (null) {
                let newBirdData = {
                    id = nextBirdId;
                    arabicName = birdName;
                    scientificName = "";
                    englishName = "";
                    description = "";
                    locations = [];
                    audioFile = null;
                    subImages = [imagePath];
                    notes = "";
                    localName = "";
                };
                birdLocationsSnapshot := textMap.put(birdLocationsSnapshot, normalizedBirdName, newBirdData);
                nextBirdId += 1;
            };
            case (?(originalName, birdData)) {
                let updatedSubImages = Array.append(birdData.subImages, [imagePath]);
                let updatedBirdData = { birdData with subImages = updatedSubImages };
                birdLocationsSnapshot := textMap.put(birdLocationsSnapshot, originalName, updatedBirdData);
            };
        };

        "✅ تم إضافة الصورة بنجاح إلى المعرض!";
    };

    // --- Team Member Management ---
    public shared ({ caller }) func addTeamMember(fullNameTribe : Text, university : Text, specialization : Text, residence : Text, contactNumber : Text, number : Int) : async () {
        if (not AccessControl.isAdmin(accessControlState, caller)) {
            Debug.trap("Unauthorized: Only admins can add team members");
        };

        let timestamp = 0;
        let newMember = {
            timestamp;
            fullNameTribe;
            university;
            specialization;
            residence;
            contactNumber;
            number;
        };
        teamMembers := teamMap.put(teamMembers, timestamp, newMember);
    };

    // --- Update and Delete Bird Data (Admin-only) ---
    public shared ({ caller }) func updateDescriptionAndNotes(birdName : Text, newDescription : Text, newNotes : Text) : async () {
        if (not AccessControl.isAdmin(accessControlState, caller)) {
            Debug.trap("Unauthorized: Only admins can update bird data");
        };

        let normalizedBirdName = normalizeBirdName(birdName);

        switch (findBirdByNormalizedName(normalizedBirdName)) {
            case (null) { Debug.trap("Bird not found: " # birdName) };
            case (?(originalName, birdData)) {
                let updatedBirdData = { birdData with description = newDescription; notes = newNotes };
                birdLocationsSnapshot := textMap.put(birdLocationsSnapshot, originalName, updatedBirdData);
            };
        };
    };

    public shared ({ caller }) func updateBirdDetails(birdName : Text, arabicName : Text, scientificName : Text, englishName : Text, description : Text, notes : Text) : async () {
        if (not AccessControl.isAdmin(accessControlState, caller)) {
            Debug.trap("Unauthorized: Only admins can update bird details");
        };

        let normalizedBirdName = normalizeBirdName(birdName);

        switch (findBirdByNormalizedName(normalizedBirdName)) {
            case (null) { Debug.trap("Bird not found: " # birdName) };
            case (?(originalName, birdData)) {
                let updatedBirdData = {
                    birdData with arabicName; scientificName; englishName; description; notes
                };
                birdLocationsSnapshot := textMap.put(birdLocationsSnapshot, originalName, updatedBirdData);
            };
        };
    };

    public shared ({ caller }) func deleteBirdData(birdName : Text) : async () {
        if (not AccessControl.isAdmin(accessControlState, caller)) {
            Debug.trap("Unauthorized: Only admins can delete bird data");
        };

        let normalizedBirdName = normalizeBirdName(birdName);
        switch (findBirdByNormalizedName(normalizedBirdName)) {
            case (null) { Debug.trap("Bird not found: " # birdName) };
            case (?(originalName, _)) {
                birdLocationsSnapshot := textMap.delete(birdLocationsSnapshot, originalName);
            };
        };
    };

    public shared ({ caller }) func deleteSubImage(birdName : Text, imagePath : Text) : async () {
        if (not AccessControl.isAdmin(accessControlState, caller)) {
            Debug.trap("Unauthorized: Only admins can delete sub images");
        };

        let normalizedBirdName = normalizeBirdName(birdName);

        switch (findBirdByNormalizedName(normalizedBirdName)) {
            case (null) { Debug.trap("Bird not found: " # birdName) };
            case (?(originalName, birdData)) {
                let updatedSubImages = Array.filter<Text>(birdData.subImages, func(img) { img != imagePath });
                let updatedBirdData = { birdData with subImages = updatedSubImages };
                birdLocationsSnapshot := textMap.put(birdLocationsSnapshot, originalName, updatedBirdData);
            };
        };
    };

    public shared ({ caller }) func deleteAudioFile(birdName : Text) : async () {
        if (not AccessControl.isAdmin(accessControlState, caller)) {
            Debug.trap("Unauthorized: Only admins can delete audio files");
        };

        let normalizedBirdName = normalizeBirdName(birdName);

        switch (findBirdByNormalizedName(normalizedBirdName)) {
            case (null) { Debug.trap("Bird not found: " # birdName) };
            case (?(originalName, birdData)) {
                let updatedBirdData = { birdData with audioFile = null };
                birdLocationsSnapshot := textMap.put(birdLocationsSnapshot, originalName, updatedBirdData);
            };
        };
    };

    public shared ({ caller }) func deleteImageFromBirdAndRegistry(birdName : Text, imagePath : Text) : async () {
        if (not AccessControl.isAdmin(accessControlState, caller)) {
            Debug.trap("Unauthorized: Only admins can delete images");
        };

        let normalizedBirdName = normalizeBirdName(birdName);

        switch (findBirdByNormalizedName(normalizedBirdName)) {
            case (null) { Debug.trap("Bird not found: " # birdName) };
            case (?(originalName, birdData)) {
                let updatedSubImages = Array.filter<Text>(birdData.subImages, func(img) { img != imagePath });
                let updatedBirdData = { birdData with subImages = updatedSubImages };
                birdLocationsSnapshot := textMap.put(birdLocationsSnapshot, originalName, updatedBirdData);

                Registry.remove(registry, imagePath);
            };
        };
    };

    public shared ({ caller }) func deleteImageFromGallery(imagePath : Text) : async () {
        if (not AccessControl.isAdmin(accessControlState, caller)) {
            Debug.trap("Unauthorized: Only admins can delete images from gallery");
        };

        Registry.remove(registry, imagePath);
    };

    public shared ({ caller }) func deleteImageFromGalleryAndBirds(imagePath : Text) : async () {
        if (not AccessControl.isAdmin(accessControlState, caller)) {
            Debug.trap("Unauthorized: Only admins can delete images from gallery");
        };

        Registry.remove(registry, imagePath);

        for ((birdName, birdData) in textMap.entries(birdLocationsSnapshot)) {
            let updatedSubImages = Array.filter<Text>(birdData.subImages, func(img) { img != imagePath });
            if (Array.size(updatedSubImages) != Array.size(birdData.subImages)) {
                let updatedBirdData = { birdData with subImages = updatedSubImages };
                birdLocationsSnapshot := textMap.put(birdLocationsSnapshot, birdName, updatedBirdData);
            };
        };
    };

    // --- Bulk Operations (Admin-only) ---
    public shared ({ caller }) func saveAllBirdData(birdDataArray : [(Text, BirdData)]) : async () {
        if (not AccessControl.isAdmin(accessControlState, caller)) {
            Debug.trap("Unauthorized: Only admins can bulk save all bird data");
        };

        birdLocationsSnapshot := textMap.empty();

        for ((birdName, birdData) in birdDataArray.vals()) {
            let normalizedBirdName = normalizeBirdName(birdName);
            birdLocationsSnapshot := textMap.put(birdLocationsSnapshot, normalizedBirdName, birdData);
        };
    };

    public shared ({ caller }) func saveChanges(birdName : Text, updatedData : BirdData) : async () {
        if (not AccessControl.isAdmin(accessControlState, caller)) {
            Debug.trap("Unauthorized: Only admins can save changes");
        };

        let normalizedBirdName = normalizeBirdName(birdName);

        switch (findBirdByNormalizedName(normalizedBirdName)) {
            case (null) { Debug.trap("Bird not found: " # birdName) };
            case (?(originalName, _)) {
                birdLocationsSnapshot := textMap.put(birdLocationsSnapshot, originalName, updatedData);
            };
        };
    };

    public shared ({ caller }) func saveBirdData(birdData : BirdData) : async () {
        if (not AccessControl.isAdmin(accessControlState, caller)) {
            Debug.trap("Unauthorized: Only admins can save bird data");
        };

        let normalizedBirdName = normalizeBirdName(birdData.arabicName);
        birdLocationsSnapshot := textMap.put(birdLocationsSnapshot, normalizedBirdName, birdData);
    };

    public shared ({ caller }) func deleteBirdById(birdId : Nat) : async () {
        if (not AccessControl.isAdmin(accessControlState, caller)) {
            Debug.trap("Unauthorized: Only admins can delete bird data");
        };

        var found = false;
        for ((_, birdData) in textMap.entries(birdLocationsSnapshot)) {
            if (birdData.id == birdId) {
                birdLocationsSnapshot := textMap.delete(birdLocationsSnapshot, normalizeBirdName(birdData.arabicName));
                found := true;
            };
        };

        if (not found) {
            Debug.trap("Bird with id " # debug_show(birdId) # " not found");
        };
    };

    public shared ({ caller }) func saveBirdDataArray(birdDataArray : [BirdData]) : async () {
        if (not AccessControl.isAdmin(accessControlState, caller)) {
            Debug.trap("Unauthorized: Only admins can bulk save bird data array");
        };

        birdLocationsSnapshot := textMap.empty();

        for (birdData in birdDataArray.vals()) {
            let normalizedBirdName = normalizeBirdName(birdData.arabicName);
            birdLocationsSnapshot := textMap.put(birdLocationsSnapshot, normalizedBirdName, birdData);
        };
    };

    // --- Utility Functions ---
    func createSnapshot() : OrderedMap.Map<Text, BirdData> {
        textMap.map<BirdData, BirdData>(birdLocationsSnapshot, func(_, b) = b);
    };

    public shared ({ caller }) func takeSnapshot() : async () {
        if (not AccessControl.isAdmin(accessControlState, caller)) {
            Debug.trap("Unauthorized: Only admins can take snapshots");
        };
        let snapshot = createSnapshot();
        birdLocationsSnapshot := snapshot;
    };

    public query func getSnapshotDetails() : async Text {
        let size = textMap.size(birdLocationsSnapshot);
        "عدد السجلات في اللقطة الحالية: " # debug_show(size);
    };

    public shared ({ caller }) func conditionalDrop() : async () {
        if (not AccessControl.isAdmin(accessControlState, caller)) {
            Debug.trap("Unauthorized: Only admins can perform conditional drop");
        };

        let now : Int = 0;

        if (isSnapshotOneDayOld(birdLocationsSnapshot, now)) {
            birdLocationsSnapshot := createSnapshot();
        };
    };

    func isSnapshotOneDayOld(snapshot : OrderedMap.Map<Text, BirdData>, now : Int) : Bool {
        let oneDayInNanos = 24 * 60 * 60 * 1_000_000_000;
        let snapshotTime = getSnapshotTime(snapshot);
        now - snapshotTime > oneDayInNanos;
    };

    func getSnapshotTime(_snapshot : OrderedMap.Map<Text, BirdData>) : Int {
        0;
    };

    // Start and Complete Backup Process (Admin-only)
    public shared ({ caller }) func startBackupProcess() : async () {
        if (not AccessControl.isAdmin(accessControlState, caller)) {
            Debug.trap("Unauthorized: Only admins can start backup process");
        };
        isBackupInProgress := true;
    };

    public shared ({ caller }) func completeBackupProcess(updatedData : [(Text, BirdData)]) : async () {
        if (not AccessControl.isAdmin(accessControlState, caller)) {
            Debug.trap("Unauthorized: Only admins can complete backup process");
        };
        isBackupInProgress := false;
        birdLocationsBackup := textMap.empty();
        for ((name, data) in updatedData.vals()) {
            birdLocationsBackup := textMap.put(birdLocationsBackup, name, data);
        };
    };

    public shared ({ caller }) func restoreSnapshot() : async () {
        if (not AccessControl.isAdmin(accessControlState, caller)) {
            Debug.trap("Unauthorized: Only admins can restore snapshots");
        };
        birdLocationsSnapshot := createSnapshot();
    };

    public query ({ caller }) func isBackupProcessActive() : async Bool {
        if (not AccessControl.isAdmin(accessControlState, caller)) {
            Debug.trap("Unauthorized: Only admins can check backup process status");
        };
        isBackupInProgress;
    };
};

