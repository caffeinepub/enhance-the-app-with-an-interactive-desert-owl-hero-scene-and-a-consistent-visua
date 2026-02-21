import OrderedMap "mo:base/OrderedMap";
import Text "mo:base/Text";
import Iter "mo:base/Iter";
import Float "mo:base/Float";
import List "mo:base/List";
import Array "mo:base/Array";
import Int "mo:base/Int";
import AccessControl "authorization/access-control";
import Principal "mo:base/Principal";
import Time "mo:base/Time";
import Debug "mo:base/Debug";
import Registry "blob-storage/registry";
import BlobStorage "blob-storage/Mixin";

actor {
    type Coordinate = {
        latitude : Float;
        longitude : Float;
    };

    type BirdData = {
        id : Nat;
        arabicName : Text;
        scientificName : Text;
        englishName : Text;
        description : Text;
        locations : [Coordinate];
        audioFile : ?Text;
        subImages : [Text];
        notes : Text;
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

    let registry = Registry.new();
    let accessControlState = AccessControl.initState();

    transient let textMap = OrderedMap.Make<Text>(Text.compare);
    var birdLocations = textMap.empty<BirdData>();

    transient let principalMap = OrderedMap.Make<Principal>(Principal.compare);
    var userProfiles = principalMap.empty<UserProfile>();

    var activeMapReference : ?Text = null;
    var backupMapReference : ?Text = null;

    var nextBirdId : Nat = 1;

    transient let teamMap = OrderedMap.Make<Int>(Int.compare);
    var teamMembers = teamMap.empty<TeamMember>();

    include BlobStorage(registry);

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
        AccessControl.hasPermission(accessControlState, caller, #user);
    };

    public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
        if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
            Debug.trap("يجب تسجيل الدخول لعرض الملف الشخصي");
        };
        principalMap.get(userProfiles, caller);
    };

    public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
        if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
            Debug.trap("يمكنك فقط عرض ملفك الشخصي");
        };
        principalMap.get(userProfiles, user);
    };

    public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
        if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
            Debug.trap("يجب تسجيل الدخول لحفظ الملف الشخصي");
        };
        userProfiles := principalMap.put(userProfiles, caller, profile);
    };

    public shared ({ caller }) func registerFileReference(path : Text, hash : Text) : async () {
        if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
            Debug.trap("⚠️ لا تملك صلاحية لتنفيذ هذا الإجراء");
        };
        Registry.add(registry, path, hash);
    };

    public query ({ caller }) func getFileReference(path : Text) : async Registry.FileReference {
        Registry.get(registry, path);
    };

    public query ({ caller }) func listFileReferences() : async [Registry.FileReference] {
        Registry.list(registry);
    };

    public shared ({ caller }) func dropFileReference(path : Text) : async () {
        if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
            Debug.trap("⚠️ لا تملك صلاحية لتنفيذ هذا الإجراء");
        };
        Registry.remove(registry, path);
    };

    public shared ({ caller }) func uploadMapImage(mapPath : Text) : async () {
        if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
            Debug.trap("⚠️ لا تملك صلاحية لتنفيذ هذا الإجراء");
        };

        switch (activeMapReference) {
            case (null) {};
            case (?currentMap) {
                backupMapReference := ?currentMap;
            };
        };

        activeMapReference := ?mapPath;
    };

    public query ({ caller }) func getActiveMapReference() : async ?Text {
        activeMapReference;
    };

    public query ({ caller }) func getBackupMapReference() : async ?Text {
        backupMapReference;
    };

    public shared ({ caller }) func restoreBackupMap() : async () {
        if (not AccessControl.isAdmin(accessControlState, caller)) {
            Debug.trap("ليس لديك صلاحية لاستعادة نسخة الخريطة الاحتياطية - يُسمح فقط لمدير التطبيق");
        };

        switch (backupMapReference) {
            case (null) {
                Debug.trap("لا توجد نسخة احتياطية من الخريطة لاستعادتها");
            };
            case (?backupMap) {
                let currentActive = activeMapReference;
                activeMapReference := ?backupMap;
                backupMapReference := currentActive;
            };
        };
    };

    public query ({ caller }) func getBirdNames() : async [Text] {
        let birdNames = Iter.toArray(textMap.keys(birdLocations));
        let normalizedNames = Array.map<Text, Text>(birdNames, func(name) { normalizeBirdName(name) });
        normalizedNames;
    };

    public query ({ caller }) func getBirdLocations(birdName : Text) : async ?[Coordinate] {
        switch (textMap.get(birdLocations, birdName)) {
            case (null) { null };
            case (?birdData) { ?birdData.locations };
        };
    };

    public query ({ caller }) func getAllBirdData() : async [(Text, BirdData)] {
        Iter.toArray(textMap.entries(birdLocations));
    };

    public query ({ caller }) func getAllCoordinates() : async [Coordinate] {
        var allCoordinates = List.nil<Coordinate>();
        for ((_, birdData) in textMap.entries(birdLocations)) {
            for (coord in birdData.locations.vals()) {
                allCoordinates := List.push(coord, allCoordinates);
            };
        };
        List.toArray(allCoordinates);
    };

    public query ({ caller }) func getAllLocationsWithNames() : async [LocationData] {
        var allLocations = List.nil<LocationData>();
        for ((birdName, birdData) in textMap.entries(birdLocations)) {
            for (coord in birdData.locations.vals()) {
                allLocations := List.push({ birdName; coordinate = coord }, allLocations);
            };
        };
        List.toArray(allLocations);
    };

    public query ({ caller }) func getLocationCountByBird() : async [(Text, Int)] {
        var counts = List.nil<(Text, Int)>();
        for ((birdName, birdData) in textMap.entries(birdLocations)) {
            counts := List.push((birdName, Array.size(birdData.locations)), counts);
        };
        List.toArray(counts);
    };

    public query ({ caller }) func getTotalLocationCount() : async Int {
        var total = 0;
        for ((_, birdData) in textMap.entries(birdLocations)) {
            total += Array.size(birdData.locations);
        };
        total;
    };

    public query ({ caller }) func getTotalBirdCount() : async Int {
        Int.abs(textMap.size(birdLocations));
    };

    public query ({ caller }) func getAllLocationsForMap(filter : Text) : async [LocationData] {
        var allLocations = List.nil<LocationData>();
        for ((birdName, birdData) in textMap.entries(birdLocations)) {
            if (filter == "all") {
                for (coord in birdData.locations.vals()) {
                    allLocations := List.push({ birdName; coordinate = coord }, allLocations);
                };
            } else if (birdName == filter) {
                for (coord in birdData.locations.vals()) {
                    allLocations := List.push({ birdName; coordinate = coord }, allLocations);
                };
            };
        };
        List.toArray(allLocations);
    };

    public query ({ caller }) func getSubImages(birdName : Text) : async ?[Text] {
        let normalizedBirdName = normalizeBirdName(birdName);

        switch (findBirdByNormalizedName(normalizedBirdName)) {
            case (null) { null };
            case (?(originalName, birdData)) { ?birdData.subImages };
        };
    };

    public query ({ caller }) func getAudioFile(birdName : Text) : async ?Text {
        let normalizedBirdName = normalizeBirdName(birdName);

        switch (findBirdByNormalizedName(normalizedBirdName)) {
            case (null) { null };
            case (?(originalName, birdData)) { birdData.audioFile };
        };
    };

    public query ({ caller }) func hasAudioFile(birdName : Text) : async Bool {
        let normalizedBirdName = normalizeBirdName(birdName);

        switch (findBirdByNormalizedName(normalizedBirdName)) {
            case (null) { false };
            case (?(originalName, birdData)) {
                switch (birdData.audioFile) {
                    case (null) { false };
                    case (?_) { true };
                };
            };
        };
    };

    public query ({ caller }) func birdExists(birdName : Text) : async Bool {
        let normalizedBirdName = normalizeBirdName(birdName);
        switch (findBirdByNormalizedName(normalizedBirdName)) {
            case (null) { false };
            case (?_) { true };
        };
    };

    public query ({ caller }) func getBirdDetails(birdName : Text) : async ?BirdData {
        let normalizedBirdName = normalizeBirdName(birdName);
        switch (findBirdByNormalizedName(normalizedBirdName)) {
            case (null) { null };
            case (?(originalName, birdData)) { ?birdData };
        };
    };

    public query ({ caller }) func getAllBirdDetails() : async [(Text, BirdData)] {
        Iter.toArray(textMap.entries(birdLocations));
    };

    public query ({ caller }) func getAllNormalizedBirdNames() : async [Text] {
        let birdNames = Iter.toArray(textMap.keys(birdLocations));
        let normalizedNames = Array.map<Text, Text>(birdNames, func(name) { normalizeBirdName(name) });
        normalizedNames;
    };

    public query ({ caller }) func getTeamMembers() : async [TeamMember] {
        Iter.toArray(teamMap.vals(teamMembers));
    };

    public query ({ caller }) func getTeamGroups() : async TeamGroup {
        {
            projectManagers = ["Mohammed Al Balushi"];
            designers = ["Nabila Al Jabri"];
            followers = ["Nasser Al Yaqoubi", "Salem Al Maskari", "Hazza Al Maamari", "Fatima Al Jabri"];
            members = ["Youssef Al Alawi", "Hilal Al Shamsi", "Marwan Al Zaidi", "Ahlam Al Maqbali", "Amina Al Kindi"];
        };
    };

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
        for ((key, value) in textMap.entries(birdLocations)) {
            if (normalizeBirdName(key) == normalizedBirdName) {
                return ?(key, value);
            };
        };
        null;
    };

    public shared ({ caller }) func addBirdData(birdName : Text, latitude : Float, longitude : Float) : async () {
        if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
            Debug.trap("⚠️ لا تملك صلاحية لتنفيذ هذا الإجراء");
        };

        let coordinate = { latitude; longitude };
        let normalizedBirdName = normalizeBirdName(birdName);

        switch (findBirdByNormalizedName(normalizedBirdName)) {
            case (null) {
                let newBirdData = {
                    id = nextBirdId;
                    arabicName = birdName;
                    scientificName = "";
                    englishName = "";
                    description = "";
                    locations = [coordinate];
                    audioFile = null;
                    subImages = [];
                    notes = "";
                };
                birdLocations := textMap.put(birdLocations, normalizedBirdName, newBirdData);
                nextBirdId += 1;
            };
            case (?(originalName, birdData)) {
                let updatedLocations = Array.append(birdData.locations, [coordinate]);
                let updatedBirdData = {
                    birdData with
                    locations = updatedLocations
                };
                birdLocations := textMap.put(birdLocations, originalName, updatedBirdData);
            };
        };
    };

    public shared ({ caller }) func addBirdWithDetails(arabicName : Text, scientificName : Text, englishName : Text, description : Text, notes : Text, latitude : Float, longitude : Float, audioFilePath : ?Text, subImages : [Text]) : async () {
        if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
            Debug.trap("⚠️ لا تملك صلاحية لتنفيذ هذا الإجراء");
        };

        let coordinate = { latitude; longitude };
        let normalizedBirdName = normalizeBirdName(arabicName);

        switch (findBirdByNormalizedName(normalizedBirdName)) {
            case (null) {
                let newBirdData = {
                    id = nextBirdId;
                    arabicName;
                    scientificName;
                    englishName;
                    description;
                    locations = [coordinate];
                    audioFile = audioFilePath;
                    subImages;
                    notes;
                };
                birdLocations := textMap.put(birdLocations, normalizedBirdName, newBirdData);
                nextBirdId += 1;
            };
            case (?(originalName, birdData)) {
                let updatedLocations = Array.append(birdData.locations, [coordinate]);
                let updatedBirdData = {
                    birdData with
                    locations = updatedLocations
                };
                birdLocations := textMap.put(birdLocations, originalName, updatedBirdData);
            };
        };
    };

    public shared ({ caller }) func addOrUpdateBird(arabicName : Text, scientificName : Text, englishName : Text, description : Text, notes : Text, latitude : Float, longitude : Float, audioFilePath : ?Text, subImages : [Text]) : async () {
        if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
            Debug.trap("⚠️ لا تملك صلاحية لتنفيذ هذا الإجراء");
        };

        let coordinate = { latitude; longitude };
        let normalizedBirdName = normalizeBirdName(arabicName);

        switch (findBirdByNormalizedName(normalizedBirdName)) {
            case (null) {
                let newBirdData = {
                    id = nextBirdId;
                    arabicName;
                    scientificName;
                    englishName;
                    description;
                    locations = [coordinate];
                    audioFile = audioFilePath;
                    subImages;
                    notes;
                };
                birdLocations := textMap.put(birdLocations, normalizedBirdName, newBirdData);
                nextBirdId += 1;
            };
            case (?(originalName, birdData)) {
                let updatedLocations = Array.append(birdData.locations, [coordinate]);
                let updatedBirdData = {
                    birdData with
                    locations = updatedLocations
                };
                birdLocations := textMap.put(birdLocations, originalName, updatedBirdData);
            };
        };
    };

    public shared ({ caller }) func addAudioFile(birdName : Text, audioFilePath : Text) : async Text {
        if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
            Debug.trap("⚠️ لا تملك صلاحية لتنفيذ هذا الإجراء");
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
                };
                birdLocations := textMap.put(birdLocations, normalizedBirdName, newBirdData);
                nextBirdId += 1;
            };
            case (?(originalName, birdData)) {
                let updatedBirdData = {
                    birdData with
                    audioFile = ?audioFilePath
                };
                birdLocations := textMap.put(birdLocations, originalName, updatedBirdData);
            };
        };

        "✅ تم حفظ الملف بنجاح!";
    };

    public shared ({ caller }) func addSubImage(birdName : Text, imagePath : Text) : async Text {
        if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
            Debug.trap("⚠️ لا تملك صلاحية لتنفيذ هذا الإجراء");
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
                };
                birdLocations := textMap.put(birdLocations, normalizedBirdName, newBirdData);
                nextBirdId += 1;
            };
            case (?(originalName, birdData)) {
                let updatedSubImages = Array.append(birdData.subImages, [imagePath]);
                let updatedBirdData = {
                    birdData with
                    subImages = updatedSubImages
                };
                birdLocations := textMap.put(birdLocations, originalName, updatedBirdData);
            };
        };

        "✅ تم إضافة الصورة بنجاح إلى المعرض!";
    };

    public shared ({ caller }) func addTeamMember(fullNameTribe : Text, university : Text, specialization : Text, residence : Text, contactNumber : Text, number : Int) : async () {
        if (not AccessControl.isAdmin(accessControlState, caller)) {
            Debug.trap("ليس لديك صلاحية لإضافة أعضاء الفريق - يُسمح فقط لمدير التطبيق");
        };

        let timestamp = Time.now();
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

    public shared ({ caller }) func updateDescriptionAndNotes(birdName : Text, newDescription : Text, newNotes : Text) : async () {
        if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
            Debug.trap("⚠️ لا تملك صلاحية لتنفيذ هذا الإجراء");
        };

        let normalizedBirdName = normalizeBirdName(birdName);

        switch (findBirdByNormalizedName(normalizedBirdName)) {
            case (null) {
                Debug.trap("الطائر غير موجود في قاعدة البيانات: " # birdName);
            };
            case (?(originalName, birdData)) {
                let updatedBirdData = {
                    birdData with
                    description = newDescription;
                    notes = newNotes;
                };
                birdLocations := textMap.put(birdLocations, originalName, updatedBirdData);
            };
        };
    };

    public shared ({ caller }) func updateBirdDetails(birdName : Text, arabicName : Text, scientificName : Text, englishName : Text, description : Text, notes : Text) : async () {
        if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
            Debug.trap("⚠️ لا تملك صلاحية لتنفيذ هذا الإجراء");
        };

        let normalizedBirdName = normalizeBirdName(birdName);

        switch (findBirdByNormalizedName(normalizedBirdName)) {
            case (null) {
                Debug.trap("الطائر غير موجود في قاعدة البيانات: " # birdName);
            };
            case (?(originalName, birdData)) {
                let updatedBirdData = {
                    birdData with
                    arabicName;
                    scientificName;
                    englishName;
                    description;
                    notes;
                };
                birdLocations := textMap.put(birdLocations, originalName, updatedBirdData);
            };
        };
    };

    public shared ({ caller }) func deleteBirdData(birdName : Text) : async () {
        if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
            Debug.trap("⚠️ لا تملك صلاحية لتنفيذ هذا الإجراء");
        };

        let normalizedBirdName = normalizeBirdName(birdName);
        switch (findBirdByNormalizedName(normalizedBirdName)) {
            case (null) {
                Debug.trap("الطائر غير موجود في قاعدة البيانات: " # birdName);
            };
            case (?(originalName, _)) {
                birdLocations := textMap.delete(birdLocations, originalName);
            };
        };
    };

    public shared ({ caller }) func deleteSubImage(birdName : Text, imagePath : Text) : async () {
        if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
            Debug.trap("⚠️ لا تملك صلاحية لتنفيذ هذا الإجراء");
        };

        let normalizedBirdName = normalizeBirdName(birdName);

        switch (findBirdByNormalizedName(normalizedBirdName)) {
            case (null) {
                Debug.trap("الطائر غير موجود في قاعدة البيانات: " # birdName);
            };
            case (?(originalName, birdData)) {
                let updatedSubImages = Array.filter<Text>(birdData.subImages, func(img) { img != imagePath });
                let updatedBirdData = {
                    birdData with
                    subImages = updatedSubImages
                };
                birdLocations := textMap.put(birdLocations, originalName, updatedBirdData);
            };
        };
    };

    public shared ({ caller }) func deleteAudioFile(birdName : Text) : async () {
        if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
            Debug.trap("⚠️ لا تملك صلاحية لتنفيذ هذا الإجراء");
        };

        let normalizedBirdName = normalizeBirdName(birdName);

        switch (findBirdByNormalizedName(normalizedBirdName)) {
            case (null) {
                Debug.trap("الطائر غير موجود في قاعدة البيانات: " # birdName);
            };
            case (?(originalName, birdData)) {
                let updatedBirdData = {
                    birdData with
                    audioFile = null
                };
                birdLocations := textMap.put(birdLocations, originalName, updatedBirdData);
            };
        };
    };

    public shared ({ caller }) func deleteImageFromBirdAndRegistry(birdName : Text, imagePath : Text) : async () {
        if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
            Debug.trap("⚠️ لا تملك صلاحية لتنفيذ هذا الإجراء");
        };

        let normalizedBirdName = normalizeBirdName(birdName);

        switch (findBirdByNormalizedName(normalizedBirdName)) {
            case (null) {
                Debug.trap("الطائر غير موجود في قاعدة البيانات: " # birdName);
            };
            case (?(originalName, birdData)) {
                let updatedSubImages = Array.filter<Text>(birdData.subImages, func(img) { img != imagePath });
                let updatedBirdData = {
                    birdData with
                    subImages = updatedSubImages
                };
                birdLocations := textMap.put(birdLocations, originalName, updatedBirdData);

                Registry.remove(registry, imagePath);
            };
        };
    };

    public shared ({ caller }) func deleteImageFromGallery(imagePath : Text) : async () {
        if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
            Debug.trap("⚠️ لا تملك صلاحية لتنفيذ هذا الإجراء");
        };

        Registry.remove(registry, imagePath);
    };

    public shared ({ caller }) func deleteImageFromGalleryAndBirds(imagePath : Text) : async () {
        if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
            Debug.trap("⚠️ لا تملك صلاحية لتنفيذ هذا الإجراء");
        };

        Registry.remove(registry, imagePath);

        for ((birdName, birdData) in textMap.entries(birdLocations)) {
            let updatedSubImages = Array.filter<Text>(birdData.subImages, func(img) { img != imagePath });
            if (Array.size(updatedSubImages) != Array.size(birdData.subImages)) {
                let updatedBirdData = {
                    birdData with
                    subImages = updatedSubImages
                };
                birdLocations := textMap.put(birdLocations, birdName, updatedBirdData);
            };
        };
    };

    public shared ({ caller }) func saveAllBirdData(birdDataArray : [(Text, BirdData)]) : async () {
        if (not AccessControl.isAdmin(accessControlState, caller)) {
            Debug.trap("ليس لديك صلاحية لحفظ جميع البيانات - يُسمح فقط لمدير التطبيق بهذه العملية الشاملة");
        };

        birdLocations := textMap.empty();

        for ((birdName, birdData) in birdDataArray.vals()) {
            let normalizedBirdName = normalizeBirdName(birdName);
            birdLocations := textMap.put(birdLocations, normalizedBirdName, birdData);
        };
    };

    public shared ({ caller }) func saveChanges(birdName : Text, updatedData : BirdData) : async () {
        if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
            Debug.trap("⚠️ لا تملك صلاحية لتنفيذ هذا الإجراء");
        };

        let normalizedBirdName = normalizeBirdName(birdName);

        switch (findBirdByNormalizedName(normalizedBirdName)) {
            case (null) {
                Debug.trap("الطائر غير موجود في قاعدة البيانات: " # birdName);
            };
            case (?(originalName, _)) {
                birdLocations := textMap.put(birdLocations, originalName, updatedData);
            };
        };
    };

    public shared ({ caller }) func saveBirdData(birdData : BirdData) : async () {
        if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
            Debug.trap("⚠️ لا تملك صلاحية لتنفيذ هذا الإجراء");
        };

        let normalizedBirdName = normalizeBirdName(birdData.arabicName);
        birdLocations := textMap.put(birdLocations, normalizedBirdName, birdData);
    };

    public shared ({ caller }) func deleteBirdById(birdId : Nat) : async () {
        if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
            Debug.trap("⚠️ لا تملك صلاحية لتنفيذ هذا الإجراء");
        };

        var found = false;
        for ((_, birdData) in textMap.entries(birdLocations)) {
            if (birdData.id == birdId) {
                birdLocations := textMap.delete(birdLocations, normalizeBirdName(birdData.arabicName));
                found := true;
            };
        };

        if (not found) {
            Debug.trap("لا يوجد طائر بالمعرف: " # debug_show (birdId));
        };
    };

    public shared ({ caller }) func saveBirdDataArray(birdDataArray : [BirdData]) : async () {
        if (not AccessControl.isAdmin(accessControlState, caller)) {
            Debug.trap("ليس لديك صلاحية لحفظ جميع البيانات - يُسمح فقط لمدير التطبيق بهذه العملية الشاملة");
        };

        birdLocations := textMap.empty();

        for (birdData in birdDataArray.vals()) {
            let normalizedBirdName = normalizeBirdName(birdData.arabicName);
            birdLocations := textMap.put(birdLocations, normalizedBirdName, birdData);
        };
    };
};
