import { useState, useEffect, useRef } from 'react';
import { useActor } from '../hooks/useActor';
import { BirdData, LocationEntry } from '../backend';
import { useGetAllBirdData, useSaveBirdData, useDeleteBirdById } from '../hooks/useQueries';
import { exportBirdDataToCSV } from '../lib/csvExport';

// A flattened row: one per LocationEntry, carrying bird-level fields
interface FlatRow {
  // Bird-level fields
  birdId: bigint;
  arabicName: string;
  scientificName: string;
  englishName: string;
  description: string;
  notes: string;
  localName: string;
  audioFile?: string;
  subImages: string[];
  allLocations: LocationEntry[]; // full locations array for saving
  // Location-level fields
  locationIndex: number;
  location: string;
  governorate: string;
  mountainName: string;
  valleyName: string;
  latitude: number;
  longitude: number;
  locationNotes: string;
}

// Derive Northern Hemisphere from latitude
function getNorthernHemisphere(lat: number): string {
  return lat >= 0 ? 'نعم' : 'لا';
}

// Derive Zone from latitude
function getZone(lat: number): string {
  const absLat = Math.abs(lat);
  if (absLat >= 0 && absLat < 23.5) return '40';
  if (absLat >= 23.5 && absLat < 35) return '40';
  if (absLat >= 35 && absLat < 50) return 'معتدلة';
  if (absLat >= 50 && absLat < 66.5) return 'شبه قطبية';
  return 'قطبية';
}

// Flatten BirdData[] into FlatRow[] — one row per LocationEntry
function flattenBirds(birds: BirdData[]): FlatRow[] {
  const rows: FlatRow[] = [];
  for (const bird of birds) {
    if (!bird.locations || bird.locations.length === 0) {
      // Bird with no locations — show one row with empty location fields
      rows.push({
        birdId: bird.id,
        arabicName: bird.arabicName,
        scientificName: bird.scientificName,
        englishName: bird.englishName,
        description: bird.description,
        notes: bird.notes,
        localName: bird.localName,
        audioFile: bird.audioFile,
        subImages: bird.subImages,
        allLocations: [],
        locationIndex: 0,
        location: '',
        governorate: '',
        mountainName: '',
        valleyName: '',
        latitude: 0,
        longitude: 0,
        locationNotes: '',
      });
    } else {
      for (let i = 0; i < bird.locations.length; i++) {
        const loc = bird.locations[i];
        rows.push({
          birdId: bird.id,
          arabicName: bird.arabicName,
          scientificName: bird.scientificName,
          englishName: bird.englishName,
          description: bird.description,
          notes: bird.notes,
          localName: bird.localName,
          audioFile: bird.audioFile,
          subImages: bird.subImages,
          allLocations: bird.locations,
          locationIndex: i,
          location: loc.location,
          governorate: loc.governorate,
          mountainName: loc.mountainName,
          valleyName: loc.valleyName,
          latitude: loc.coordinate.latitude,
          longitude: loc.coordinate.longitude,
          locationNotes: loc.notes,
        });
      }
    }
  }
  return rows;
}

// Unique key for a flat row
function rowKey(row: FlatRow): string {
  return `${String(row.birdId)}-${row.locationIndex}`;
}

interface EditingState {
  arabicName: string;
  scientificName: string;
  englishName: string;
  description: string;
  notes: string;
  localName: string;
  location: string;
  governorate: string;
  mountainName: string;
  valleyName: string;
  latitude: number;
  longitude: number;
  locationNotes: string;
}

export default function BirdDataTable() {
  const { actor, isFetching: actorFetching } = useActor();
  const [isAdmin, setIsAdmin] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingMap, setEditingMap] = useState<Map<string, EditingState>>(new Map());
  const [newRow, setNewRow] = useState<Partial<{
    arabicName: string;
    scientificName: string;
    englishName: string;
    description: string;
    notes: string;
    localName: string;
    location: string;
    governorate: string;
    mountainName: string;
    valleyName: string;
    latitude: number;
    longitude: number;
    locationNotes: string;
  }> | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const saveMutation = useSaveBirdData();
  const deleteMutation = useDeleteBirdById();
  const { data: allBirdData, isLoading, error, refetch } = useGetAllBirdData();
  const addFormRef = useRef<HTMLDivElement>(null);

  // Check admin status
  useEffect(() => {
    if (!actor || actorFetching) return;
    actor.isCallerAdmin().then((result: boolean) => {
      setIsAdmin(result);
    }).catch(() => setIsAdmin(false));
  }, [actor, actorFetching]);

  const birds: BirdData[] = allBirdData
    ? allBirdData.map(([, bd]: [string, BirdData]) => bd)
    : [];

  const flatRows = flattenBirds(birds);

  const filtered = flatRows.filter((row: FlatRow) => {
    const term = searchTerm.toLowerCase();
    return (
      row.arabicName?.toLowerCase().includes(term) ||
      row.scientificName?.toLowerCase().includes(term) ||
      row.englishName?.toLowerCase().includes(term) ||
      row.location?.toLowerCase().includes(term) ||
      row.governorate?.toLowerCase().includes(term)
    );
  });

  const handleEdit = (row: FlatRow) => {
    const key = rowKey(row);
    const updated = new Map(editingMap);
    updated.set(key, {
      arabicName: row.arabicName,
      scientificName: row.scientificName,
      englishName: row.englishName,
      description: row.description,
      notes: row.notes,
      localName: row.localName,
      location: row.location,
      governorate: row.governorate,
      mountainName: row.mountainName,
      valleyName: row.valleyName,
      latitude: row.latitude,
      longitude: row.longitude,
      locationNotes: row.locationNotes,
    });
    setEditingMap(updated);
  };

  const handleCancelEdit = (key: string) => {
    const updated = new Map(editingMap);
    updated.delete(key);
    setEditingMap(updated);
  };

  const handleEditFieldChange = (key: string, field: keyof EditingState, value: string | number) => {
    const updated = new Map(editingMap);
    const state = updated.get(key);
    if (!state) return;
    (state as any)[field] = value;
    updated.set(key, { ...state });
    setEditingMap(updated);
  };

  const handleSave = async (row: FlatRow) => {
    const key = rowKey(row);
    const editState = editingMap.get(key);
    if (!editState) return;

    // Rebuild the full BirdData with the updated location entry
    const updatedLocations: LocationEntry[] = row.allLocations.map((loc, i) => {
      if (i === row.locationIndex) {
        return {
          coordinate: {
            latitude: editState.latitude,
            longitude: editState.longitude,
          },
          location: editState.location,
          governorate: editState.governorate,
          mountainName: editState.mountainName,
          valleyName: editState.valleyName,
          notes: editState.locationNotes,
        };
      }
      return loc;
    });

    // If no locations existed, create one
    const finalLocations = row.allLocations.length === 0
      ? [{
          coordinate: { latitude: editState.latitude, longitude: editState.longitude },
          location: editState.location,
          governorate: editState.governorate,
          mountainName: editState.mountainName,
          valleyName: editState.valleyName,
          notes: editState.locationNotes,
        }]
      : updatedLocations;

    const birdToSave: BirdData = {
      id: row.birdId,
      arabicName: editState.arabicName,
      scientificName: editState.scientificName,
      englishName: editState.englishName,
      description: editState.description,
      notes: editState.notes,
      localName: editState.localName,
      locations: finalLocations,
      subImages: row.subImages,
      audioFile: row.audioFile,
    };

    try {
      await saveMutation.mutateAsync(birdToSave);
      const updated = new Map(editingMap);
      updated.delete(key);
      setEditingMap(updated);
      refetch();
    } catch {
      alert('فشل حفظ البيانات');
    }
  };

  const handleDelete = async (row: FlatRow) => {
    if (!confirm(`هل أنت متأكد من حذف "${row.arabicName}"؟`)) return;
    try {
      await deleteMutation.mutateAsync(row.birdId);
      refetch();
    } catch {
      alert('فشل حذف السجل');
    }
  };

  const handleAddNew = () => {
    setNewRow({
      arabicName: '',
      scientificName: '',
      englishName: '',
      description: '',
      notes: '',
      localName: '',
      location: '',
      governorate: '',
      mountainName: '',
      valleyName: '',
      latitude: 0,
      longitude: 0,
      locationNotes: '',
    });
    setShowAddForm(true);
    setTimeout(() => addFormRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  const handleNewRowFieldChange = (field: string, value: string | number) => {
    setNewRow(prev => prev ? { ...prev, [field]: value } : null);
  };

  const handleSaveNew = async () => {
    if (!newRow || !newRow.arabicName?.trim()) {
      alert('الاسم العربي مطلوب');
      return;
    }
    try {
      const locationEntry: LocationEntry = {
        coordinate: {
          latitude: newRow.latitude ?? 0,
          longitude: newRow.longitude ?? 0,
        },
        location: newRow.location || '',
        governorate: newRow.governorate || '',
        mountainName: newRow.mountainName || '',
        valleyName: newRow.valleyName || '',
        notes: newRow.locationNotes || '',
      };

      const birdToSave: BirdData = {
        id: BigInt(0),
        arabicName: newRow.arabicName || '',
        scientificName: newRow.scientificName || '',
        englishName: newRow.englishName || '',
        description: newRow.description || '',
        notes: newRow.notes || '',
        localName: newRow.localName || '',
        locations: [locationEntry],
        subImages: [],
        audioFile: undefined,
      };
      await saveMutation.mutateAsync(birdToSave);
      setNewRow(null);
      setShowAddForm(false);
      refetch();
    } catch {
      alert('فشل إضافة السجل');
    }
  };

  const handleCancelNew = () => {
    setNewRow(null);
    setShowAddForm(false);
  };

  const handleExportCSV = () => {
    if (birds.length === 0) return;
    exportBirdDataToCSV(birds);
  };

  if (isLoading) {
    return (
      <div dir="rtl" className="min-h-screen bg-amber-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4 animate-spin inline-block">⏳</div>
          <p className="text-amber-700 font-medium text-lg">جاري تحميل بيانات الطيور...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div dir="rtl" className="min-h-screen bg-amber-50 flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center max-w-md">
          <div className="text-4xl mb-3">❌</div>
          <p className="text-red-700 font-medium mb-4">فشل تحميل البيانات</p>
          <button
            onClick={() => refetch()}
            className="bg-red-100 hover:bg-red-200 text-red-800 px-4 py-2 rounded-lg text-sm"
          >
            إعادة المحاولة
          </button>
        </div>
      </div>
    );
  }

  const newRowLatitude = newRow?.latitude ?? 0;

  return (
    <div dir="rtl" className="min-h-screen bg-amber-50">
      {/* Toolbar */}
      <div className="bg-white border-b border-amber-200 px-4 py-3 sticky top-0 z-10 shadow-sm">
        <div className="max-w-full flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="flex items-center gap-2 flex-1 min-w-48">
            <span className="text-amber-600">🔍</span>
            <input
              type="text"
              placeholder="بحث في البيانات..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="border border-amber-300 rounded-lg px-3 py-1.5 text-sm bg-amber-50 text-amber-900 focus:outline-none focus:ring-2 focus:ring-amber-400 w-full"
            />
          </div>

          {/* Stats */}
          <span className="text-amber-700 text-sm">
            📊 {filtered.length} / {flatRows.length} سجل
          </span>

          {/* Admin Buttons */}
          {isAdmin && (
            <button
              onClick={handleAddNew}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1"
            >
              ➕ إضافة
            </button>
          )}

          {/* Export */}
          <button
            onClick={handleExportCSV}
            className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition-colors"
          >
            📥 تصدير CSV
          </button>
        </div>
      </div>

      {/* Add New Form */}
      {isAdmin && showAddForm && newRow && (
        <div ref={addFormRef} className="bg-green-50 border border-green-200 rounded-xl m-4 p-4 shadow-md">
          <h3 className="text-green-800 font-bold mb-4 text-base">➕ إضافة موقع جديد</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              { field: 'arabicName', label: 'الاسم العربي *', required: true },
              { field: 'scientificName', label: 'الاسم العلمي' },
              { field: 'englishName', label: 'الاسم الإنجليزي' },
              { field: 'location', label: 'الموقع' },
              { field: 'governorate', label: 'الولاية' },
              { field: 'localName', label: 'الاسم المحلي' },
              { field: 'mountainName', label: 'اسم الجبل' },
              { field: 'valleyName', label: 'اسم الوادي' },
            ].map(({ field, label, required }) => (
              <div key={field}>
                <label className="block text-green-700 text-xs font-medium mb-1">{label}</label>
                <input
                  type="text"
                  value={(newRow as any)[field] || ''}
                  onChange={e => handleNewRowFieldChange(field, e.target.value)}
                  className="w-full border border-green-300 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-400"
                  required={required}
                />
              </div>
            ))}

            {/* Latitude (°) field */}
            <div>
              <label className="block text-green-700 text-xs font-medium mb-1">خط العرض °</label>
              <input
                type="number"
                step="0.0001"
                value={newRowLatitude}
                onChange={e => handleNewRowFieldChange('latitude', parseFloat(e.target.value) || 0)}
                className="w-full border border-green-300 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-400"
                placeholder="مثال: 23.5"
              />
            </div>

            {/* Longitude field */}
            <div>
              <label className="block text-green-700 text-xs font-medium mb-1">خط الطول °</label>
              <input
                type="number"
                step="0.0001"
                value={newRow.longitude ?? 0}
                onChange={e => handleNewRowFieldChange('longitude', parseFloat(e.target.value) || 0)}
                className="w-full border border-green-300 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-400"
                placeholder="مثال: 56.5"
              />
            </div>

            {/* Northern Hemisphere (computed display) */}
            <div>
              <label className="block text-green-700 text-xs font-medium mb-1">النصف الشمالي</label>
              <input
                type="text"
                value={getNorthernHemisphere(newRowLatitude)}
                readOnly
                className="w-full border border-green-200 rounded-lg px-3 py-1.5 text-sm bg-green-50 text-green-700 cursor-default"
              />
            </div>

            {/* Zone (computed display) */}
            <div>
              <label className="block text-green-700 text-xs font-medium mb-1">المنطقة</label>
              <input
                type="text"
                value={getZone(newRowLatitude)}
                readOnly
                className="w-full border border-green-200 rounded-lg px-3 py-1.5 text-sm bg-green-50 text-green-700 cursor-default"
              />
            </div>

            <div className="sm:col-span-2 lg:col-span-3">
              <label className="block text-green-700 text-xs font-medium mb-1">الوصف</label>
              <textarea
                value={newRow.description || ''}
                onChange={e => handleNewRowFieldChange('description', e.target.value)}
                rows={2}
                className="w-full border border-green-300 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-400"
              />
            </div>
            <div className="sm:col-span-2 lg:col-span-3">
              <label className="block text-green-700 text-xs font-medium mb-1">ملاحظات</label>
              <textarea
                value={newRow.notes || ''}
                onChange={e => handleNewRowFieldChange('notes', e.target.value)}
                rows={2}
                className="w-full border border-green-300 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-400"
              />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button
              onClick={handleSaveNew}
              disabled={!newRow.arabicName?.trim() || saveMutation.isPending}
              className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              {saveMutation.isPending ? '⏳ جاري الحفظ...' : '💾 حفظ'}
            </button>
            <button
              onClick={handleCancelNew}
              className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-5 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              إلغاء
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto m-4">
        <table className="w-full border-collapse bg-white rounded-xl shadow-md overflow-hidden text-sm">
          <thead>
            <tr className="bg-amber-700 text-white">
              {[
                'الاسم العربي',
                'الاسم العلمي',
                'الاسم الإنجليزي',
                'الموقع',
                'الولاية',
                'الاسم المحلي',
                'اسم الجبل',
                'اسم الوادي',
                'خط العرض °',
                'خط الطول °',
                'النصف الشمالي',
                'المنطقة',
                'ملاحظات الموقع',
              ].map(header => (
                <th key={header} className="px-3 py-2.5 text-right font-semibold whitespace-nowrap border-b border-amber-600">
                  {header}
                </th>
              ))}
              {isAdmin && (
                <th className="px-3 py-2.5 text-right font-semibold whitespace-nowrap border-b border-amber-600">
                  إجراءات
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={isAdmin ? 14 : 13} className="text-center py-12 text-amber-500">
                  {searchTerm ? 'لا توجد نتائج مطابقة للبحث' : 'لا توجد بيانات'}
                </td>
              </tr>
            ) : (
              filtered.map((row, idx) => {
                const key = rowKey(row);
                const isEditing = editingMap.has(key);
                const editState = editingMap.get(key);
                const editLatitude = editState?.latitude ?? row.latitude;

                return (
                  <tr
                    key={key}
                    className={`border-b border-amber-100 transition-colors ${
                      isEditing
                        ? 'bg-yellow-50'
                        : idx % 2 === 0
                        ? 'bg-white hover:bg-amber-50'
                        : 'bg-amber-50/40 hover:bg-amber-100/60'
                    }`}
                  >
                    {/* arabicName */}
                    <td className="px-3 py-2 whitespace-nowrap">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editState!.arabicName}
                          onChange={e => handleEditFieldChange(key, 'arabicName', e.target.value)}
                          className="border border-amber-300 rounded px-2 py-1 text-xs w-28 focus:outline-none focus:ring-1 focus:ring-amber-400"
                        />
                      ) : (
                        <span className="font-medium text-amber-900">{row.arabicName}</span>
                      )}
                    </td>

                    {/* scientificName */}
                    <td className="px-3 py-2 whitespace-nowrap">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editState!.scientificName}
                          onChange={e => handleEditFieldChange(key, 'scientificName', e.target.value)}
                          className="border border-amber-300 rounded px-2 py-1 text-xs w-28 focus:outline-none focus:ring-1 focus:ring-amber-400"
                        />
                      ) : (
                        <span className="text-gray-600 italic">{row.scientificName}</span>
                      )}
                    </td>

                    {/* englishName */}
                    <td className="px-3 py-2 whitespace-nowrap">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editState!.englishName}
                          onChange={e => handleEditFieldChange(key, 'englishName', e.target.value)}
                          className="border border-amber-300 rounded px-2 py-1 text-xs w-28 focus:outline-none focus:ring-1 focus:ring-amber-400"
                        />
                      ) : (
                        <span className="text-gray-600">{row.englishName}</span>
                      )}
                    </td>

                    {/* location */}
                    <td className="px-3 py-2 whitespace-nowrap">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editState!.location}
                          onChange={e => handleEditFieldChange(key, 'location', e.target.value)}
                          className="border border-amber-300 rounded px-2 py-1 text-xs w-28 focus:outline-none focus:ring-1 focus:ring-amber-400"
                        />
                      ) : (
                        <span>{row.location}</span>
                      )}
                    </td>

                    {/* governorate */}
                    <td className="px-3 py-2 whitespace-nowrap">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editState!.governorate}
                          onChange={e => handleEditFieldChange(key, 'governorate', e.target.value)}
                          className="border border-amber-300 rounded px-2 py-1 text-xs w-28 focus:outline-none focus:ring-1 focus:ring-amber-400"
                        />
                      ) : (
                        <span>{row.governorate}</span>
                      )}
                    </td>

                    {/* localName */}
                    <td className="px-3 py-2 whitespace-nowrap">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editState!.localName}
                          onChange={e => handleEditFieldChange(key, 'localName', e.target.value)}
                          className="border border-amber-300 rounded px-2 py-1 text-xs w-28 focus:outline-none focus:ring-1 focus:ring-amber-400"
                        />
                      ) : (
                        <span>{row.localName}</span>
                      )}
                    </td>

                    {/* mountainName */}
                    <td className="px-3 py-2 whitespace-nowrap">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editState!.mountainName}
                          onChange={e => handleEditFieldChange(key, 'mountainName', e.target.value)}
                          className="border border-amber-300 rounded px-2 py-1 text-xs w-28 focus:outline-none focus:ring-1 focus:ring-amber-400"
                        />
                      ) : (
                        <span>{row.mountainName}</span>
                      )}
                    </td>

                    {/* valleyName */}
                    <td className="px-3 py-2 whitespace-nowrap">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editState!.valleyName}
                          onChange={e => handleEditFieldChange(key, 'valleyName', e.target.value)}
                          className="border border-amber-300 rounded px-2 py-1 text-xs w-28 focus:outline-none focus:ring-1 focus:ring-amber-400"
                        />
                      ) : (
                        <span>{row.valleyName}</span>
                      )}
                    </td>

                    {/* latitude */}
                    <td className="px-3 py-2 whitespace-nowrap">
                      {isEditing ? (
                        <input
                          type="number"
                          step="0.0001"
                          value={editState!.latitude}
                          onChange={e => handleEditFieldChange(key, 'latitude', parseFloat(e.target.value) || 0)}
                          className="border border-amber-300 rounded px-2 py-1 text-xs w-24 focus:outline-none focus:ring-1 focus:ring-amber-400"
                        />
                      ) : (
                        <span className="font-mono text-xs">{row.latitude !== 0 ? row.latitude.toFixed(4) : ''}</span>
                      )}
                    </td>

                    {/* longitude */}
                    <td className="px-3 py-2 whitespace-nowrap">
                      {isEditing ? (
                        <input
                          type="number"
                          step="0.0001"
                          value={editState!.longitude}
                          onChange={e => handleEditFieldChange(key, 'longitude', parseFloat(e.target.value) || 0)}
                          className="border border-amber-300 rounded px-2 py-1 text-xs w-24 focus:outline-none focus:ring-1 focus:ring-amber-400"
                        />
                      ) : (
                        <span className="font-mono text-xs">{row.longitude !== 0 ? row.longitude.toFixed(4) : ''}</span>
                      )}
                    </td>

                    {/* Northern Hemisphere (computed, read-only) */}
                    <td className="px-3 py-2 whitespace-nowrap text-center">
                      {isEditing ? (
                        <span className="text-xs text-amber-700 bg-amber-100 px-2 py-1 rounded">
                          {getNorthernHemisphere(editLatitude)}
                        </span>
                      ) : (
                        <span className="text-xs">{getNorthernHemisphere(row.latitude)}</span>
                      )}
                    </td>

                    {/* Zone (computed, read-only) */}
                    <td className="px-3 py-2 whitespace-nowrap text-center">
                      {isEditing ? (
                        <span className="text-xs text-amber-700 bg-amber-100 px-2 py-1 rounded">
                          {getZone(editLatitude)}
                        </span>
                      ) : (
                        <span className="text-xs">{getZone(row.latitude)}</span>
                      )}
                    </td>

                    {/* locationNotes */}
                    <td className="px-3 py-2 max-w-xs">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editState!.locationNotes}
                          onChange={e => handleEditFieldChange(key, 'locationNotes', e.target.value)}
                          className="border border-amber-300 rounded px-2 py-1 text-xs w-32 focus:outline-none focus:ring-1 focus:ring-amber-400"
                        />
                      ) : (
                        <span className="text-xs text-gray-500 line-clamp-2">{row.locationNotes}</span>
                      )}
                    </td>

                    {/* Actions */}
                    {isAdmin && (
                      <td className="px-3 py-2 whitespace-nowrap">
                        {isEditing ? (
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleSave(row)}
                              disabled={saveMutation.isPending}
                              className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-2 py-1 rounded text-xs transition-colors"
                            >
                              {saveMutation.isPending ? '⏳' : '💾'}
                            </button>
                            <button
                              onClick={() => handleCancelEdit(key)}
                              className="bg-gray-400 hover:bg-gray-500 text-white px-2 py-1 rounded text-xs transition-colors"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleEdit(row)}
                              className="bg-amber-500 hover:bg-amber-600 text-white px-2 py-1 rounded text-xs transition-colors"
                            >
                              ✏️
                            </button>
                            <button
                              onClick={() => handleDelete(row)}
                              disabled={deleteMutation.isPending}
                              className="bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white px-2 py-1 rounded text-xs transition-colors"
                            >
                              🗑️
                            </button>
                          </div>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer info */}
      <div className="text-center text-amber-600 text-xs pb-6">
        إجمالي السجلات: {flatRows.length} | النتائج المعروضة: {filtered.length}
      </div>
    </div>
  );
}
