import React, { useState, useEffect } from 'react';
import { useActor } from '../hooks/useActor';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetAllBirdData, useSaveBirdData, useDeleteBirdById } from '../hooks/useQueries';
import { exportBirdDataToCSV } from '../lib/csvExport';
import { BirdData } from '../backend';

interface EditableRow {
  id: bigint;
  arabicName: string;
  scientificName: string;
  englishName: string;
  description: string;
  notes: string;
  localName: string;
  location: string;
  mountainName: string;
  valleyName: string;
  governorate: string;
}

interface NewBirdForm {
  arabicName: string;
  scientificName: string;
  englishName: string;
  location: string;
  governorate: string;
  latitude: string;
  longitude: string;
  localName: string;
  description: string;
  notes: string;
}

const emptyNewBird: NewBirdForm = {
  arabicName: '',
  scientificName: '',
  englishName: '',
  location: '',
  governorate: '',
  latitude: '',
  longitude: '',
  localName: '',
  description: '',
  notes: '',
};

export default function BirdDataTable() {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();
  const { data: birdDataRaw, isLoading } = useGetAllBirdData();
  const saveBirdMutation = useSaveBirdData();
  const deleteBirdMutation = useDeleteBirdById();

  const [isAdmin, setIsAdmin] = useState(false);
  const [isAdminLoading, setIsAdminLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingRows, setEditingRows] = useState<Record<string, EditableRow>>({});
  const [showAddForm, setShowAddForm] = useState(false);
  const [newBird, setNewBird] = useState<NewBirdForm>(emptyNewBird);
  const [isAddingBird, setIsAddingBird] = useState(false);

  // Async admin check — depends only on actor (identity is already embedded in actor)
  useEffect(() => {
    let cancelled = false;
    setIsAdminLoading(true);

    if (actor && !actorFetching) {
      actor.isCallerAdmin()
        .then(result => {
          if (!cancelled) {
            setIsAdmin(result);
            setIsAdminLoading(false);
          }
        })
        .catch(() => {
          if (!cancelled) {
            setIsAdmin(false);
            setIsAdminLoading(false);
          }
        });
    } else if (!actorFetching) {
      setIsAdmin(false);
      setIsAdminLoading(false);
    }

    return () => { cancelled = true; };
  }, [actor, actorFetching, identity]);

  const birdData: [string, BirdData][] = birdDataRaw || [];

  const filteredData = birdData.filter(([name, bird]) => {
    const term = searchTerm.toLowerCase();
    return (
      name.toLowerCase().includes(term) ||
      bird.arabicName?.toLowerCase().includes(term) ||
      bird.scientificName?.toLowerCase().includes(term) ||
      bird.englishName?.toLowerCase().includes(term)
    );
  });

  const handleEdit = (bird: BirdData) => {
    const key = bird.id.toString();
    setEditingRows(prev => ({
      ...prev,
      [key]: {
        id: bird.id,
        arabicName: bird.arabicName,
        scientificName: bird.scientificName,
        englishName: bird.englishName,
        description: bird.description,
        notes: bird.notes,
        localName: bird.localName,
        location: bird.location,
        mountainName: bird.mountainName,
        valleyName: bird.valleyName,
        governorate: bird.governorate,
      }
    }));
  };

  const handleCancelEdit = (birdId: bigint) => {
    const key = birdId.toString();
    setEditingRows(prev => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const handleSave = async (originalBird: BirdData) => {
    const key = originalBird.id.toString();
    const edited = editingRows[key];
    if (!edited) return;

    const updatedBird: BirdData = {
      ...originalBird,
      arabicName: edited.arabicName,
      scientificName: edited.scientificName,
      englishName: edited.englishName,
      description: edited.description,
      notes: edited.notes,
      localName: edited.localName,
      location: edited.location,
      mountainName: edited.mountainName,
      valleyName: edited.valleyName,
      governorate: edited.governorate,
    };

    await saveBirdMutation.mutateAsync(updatedBird);
    handleCancelEdit(originalBird.id);
  };

  const handleDelete = async (bird: BirdData) => {
    if (!window.confirm(`هل أنت متأكد من حذف "${bird.arabicName}"؟`)) return;
    await deleteBirdMutation.mutateAsync(bird.id);
  };

  const handleAddBird = async () => {
    if (!newBird.arabicName.trim() || !actor) return;

    setIsAddingBird(true);
    try {
      const lat = parseFloat(newBird.latitude) || 0;
      const lng = parseFloat(newBird.longitude) || 0;

      // Build a full BirdData object so all fields are saved at once
      const birdToSave: BirdData = {
        id: BigInt(0), // backend assigns real id via saveBirdData upsert
        arabicName: newBird.arabicName.trim(),
        scientificName: newBird.scientificName.trim(),
        englishName: newBird.englishName.trim(),
        description: newBird.description.trim(),
        notes: newBird.notes.trim(),
        localName: newBird.localName.trim(),
        location: newBird.location.trim(),
        mountainName: '',
        valleyName: '',
        governorate: newBird.governorate.trim(),
        locations: lat !== 0 || lng !== 0 ? [{ latitude: lat, longitude: lng }] : [],
        audioFile: undefined,
        subImages: [],
      };

      await saveBirdMutation.mutateAsync(birdToSave);
      setNewBird(emptyNewBird);
      setShowAddForm(false);
    } finally {
      setIsAddingBird(false);
    }
  };

  const handleFieldChange = (birdId: bigint, field: keyof EditableRow, value: string) => {
    const key = birdId.toString();
    setEditingRows(prev => ({
      ...prev,
      [key]: { ...prev[key], [field]: value }
    }));
  };

  const handleExportCSV = () => {
    const birdsOnly: BirdData[] = birdData.map(([, bird]) => bird);
    exportBirdDataToCSV(birdsOnly);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12" dir="rtl">
        <div className="text-amber-700 text-lg">جاري تحميل البيانات...</div>
      </div>
    );
  }

  return (
    <div dir="rtl" className="w-full">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
        <input
          type="text"
          placeholder="بحث عن طائر..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="flex-1 min-w-[180px] px-3 py-2 border border-amber-300 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
        />
        <button
          onClick={handleExportCSV}
          className="px-4 py-2 bg-amber-600 text-white rounded-md text-sm hover:bg-amber-700 transition-colors"
        >
          تصدير CSV
        </button>
        {!isAdminLoading && isAdmin && (
          <button
            onClick={() => setShowAddForm(v => !v)}
            className="px-4 py-2 bg-green-600 text-white rounded-md text-sm hover:bg-green-700 transition-colors font-bold"
          >
            + إضافة
          </button>
        )}
      </div>

      {/* Add Bird Form */}
      {!isAdminLoading && isAdmin && showAddForm && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <h3 className="text-green-800 font-bold mb-3 text-sm">إضافة طائر جديد</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 mb-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-green-700 font-semibold">الاسم العربي *</label>
              <input
                type="text"
                placeholder="الاسم العربي *"
                value={newBird.arabicName}
                onChange={e => setNewBird(prev => ({ ...prev, arabicName: e.target.value }))}
                className="px-3 py-2 border border-green-300 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-400"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-green-700 font-semibold">الاسم العلمي</label>
              <input
                type="text"
                placeholder="الاسم العلمي"
                value={newBird.scientificName}
                onChange={e => setNewBird(prev => ({ ...prev, scientificName: e.target.value }))}
                className="px-3 py-2 border border-green-300 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-400"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-green-700 font-semibold">الاسم الإنجليزي</label>
              <input
                type="text"
                placeholder="الاسم الإنجليزي"
                value={newBird.englishName}
                onChange={e => setNewBird(prev => ({ ...prev, englishName: e.target.value }))}
                className="px-3 py-2 border border-green-300 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-400"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-green-700 font-semibold">الموقع</label>
              <input
                type="text"
                placeholder="الموقع"
                value={newBird.location}
                onChange={e => setNewBird(prev => ({ ...prev, location: e.target.value }))}
                className="px-3 py-2 border border-green-300 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-400"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-green-700 font-semibold">الولاية</label>
              <input
                type="text"
                placeholder="الولاية"
                value={newBird.governorate}
                onChange={e => setNewBird(prev => ({ ...prev, governorate: e.target.value }))}
                className="px-3 py-2 border border-green-300 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-400"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-green-700 font-semibold">Zone</label>
              <input
                type="text"
                placeholder="Zone"
                value={newBird.localName}
                onChange={e => setNewBird(prev => ({ ...prev, localName: e.target.value }))}
                className="px-3 py-2 border border-green-300 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-400"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-green-700 font-semibold">Latitude (°)</label>
              <input
                type="number"
                placeholder="Latitude (°)"
                value={newBird.latitude}
                onChange={e => setNewBird(prev => ({ ...prev, latitude: e.target.value }))}
                className="px-3 py-2 border border-green-300 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-400"
                step="any"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-green-700 font-semibold">Longitude (°)</label>
              <input
                type="number"
                placeholder="Longitude (°)"
                value={newBird.longitude}
                onChange={e => setNewBird(prev => ({ ...prev, longitude: e.target.value }))}
                className="px-3 py-2 border border-green-300 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-400"
                step="any"
              />
            </div>
            <div className="flex flex-col gap-1 sm:col-span-2 md:col-span-1">
              <label className="text-xs text-green-700 font-semibold">الوصف</label>
              <input
                type="text"
                placeholder="الوصف"
                value={newBird.description}
                onChange={e => setNewBird(prev => ({ ...prev, description: e.target.value }))}
                className="px-3 py-2 border border-green-300 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-400"
              />
            </div>
            <div className="flex flex-col gap-1 sm:col-span-2 md:col-span-2">
              <label className="text-xs text-green-700 font-semibold">ملاحظات</label>
              <input
                type="text"
                placeholder="ملاحظات"
                value={newBird.notes}
                onChange={e => setNewBird(prev => ({ ...prev, notes: e.target.value }))}
                className="px-3 py-2 border border-green-300 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-400"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleAddBird}
              disabled={!newBird.arabicName.trim() || isAddingBird || saveBirdMutation.isPending}
              className="px-4 py-2 bg-green-600 text-white rounded-md text-sm hover:bg-green-700 disabled:opacity-50 transition-colors font-semibold"
            >
              {isAddingBird || saveBirdMutation.isPending ? 'جاري الحفظ...' : 'حفظ'}
            </button>
            <button
              onClick={() => { setShowAddForm(false); setNewBird(emptyNewBird); }}
              className="px-4 py-2 bg-gray-400 text-white rounded-md text-sm hover:bg-gray-500 transition-colors"
            >
              إلغاء
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-amber-200 shadow-sm">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-amber-700 text-white">
              <th className="px-3 py-3 text-right font-semibold whitespace-nowrap">#</th>
              <th className="px-3 py-3 text-right font-semibold whitespace-nowrap">الاسم العربي</th>
              <th className="px-3 py-3 text-right font-semibold whitespace-nowrap">الاسم العلمي</th>
              <th className="px-3 py-3 text-right font-semibold whitespace-nowrap">الاسم الإنجليزي</th>
              <th className="px-3 py-3 text-right font-semibold whitespace-nowrap">الوصف</th>
              <th className="px-3 py-3 text-right font-semibold whitespace-nowrap">الملاحظات</th>
              <th className="px-3 py-3 text-right font-semibold whitespace-nowrap">الاسم المحلي</th>
              <th className="px-3 py-3 text-right font-semibold whitespace-nowrap">الموقع</th>
              <th className="px-3 py-3 text-right font-semibold whitespace-nowrap">الجبل</th>
              <th className="px-3 py-3 text-right font-semibold whitespace-nowrap">الوادي</th>
              <th className="px-3 py-3 text-right font-semibold whitespace-nowrap">المحافظة</th>
              <th className="px-3 py-3 text-right font-semibold whitespace-nowrap">المواقع</th>
              {!isAdminLoading && isAdmin && (
                <th className="px-3 py-3 text-right font-semibold whitespace-nowrap">الإجراءات</th>
              )}
            </tr>
          </thead>
          <tbody>
            {filteredData.length === 0 ? (
              <tr>
                <td colSpan={(!isAdminLoading && isAdmin) ? 13 : 12} className="text-center py-8 text-amber-600">
                  {searchTerm ? 'لا توجد نتائج للبحث' : 'لا توجد بيانات'}
                </td>
              </tr>
            ) : (
              filteredData.map(([, bird], index) => {
                const key = bird.id.toString();
                const isEditing = !!editingRows[key];
                const editData = editingRows[key];

                return (
                  <tr
                    key={key}
                    className={`border-b border-amber-100 ${index % 2 === 0 ? 'bg-white' : 'bg-amber-50'} hover:bg-amber-100 transition-colors`}
                  >
                    <td className="px-3 py-2 text-amber-800 whitespace-nowrap">{index + 1}</td>

                    {/* Editable fields */}
                    {(['arabicName', 'scientificName', 'englishName', 'description', 'notes', 'localName', 'location', 'mountainName', 'valleyName', 'governorate'] as (keyof EditableRow)[]).map(field => (
                      <td key={field} className="px-3 py-2 text-amber-900">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editData[field] as string}
                            onChange={e => handleFieldChange(bird.id, field, e.target.value)}
                            className="w-full min-w-[80px] px-2 py-1 border border-amber-300 rounded text-sm bg-white focus:outline-none focus:ring-1 focus:ring-amber-400"
                          />
                        ) : (
                          <span className="block max-w-[150px] truncate" title={bird[field] as string}>
                            {bird[field] as string || '—'}
                          </span>
                        )}
                      </td>
                    ))}

                    {/* Locations count */}
                    <td className="px-3 py-2 text-amber-800 whitespace-nowrap text-center">
                      {bird.locations?.length || 0}
                    </td>

                    {/* Admin actions */}
                    {!isAdminLoading && isAdmin && (
                      <td className="px-3 py-2 whitespace-nowrap">
                        <div className="flex gap-1">
                          {isEditing ? (
                            <>
                              <button
                                onClick={() => handleSave(bird)}
                                disabled={saveBirdMutation.isPending}
                                className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 disabled:opacity-50 transition-colors"
                              >
                                {saveBirdMutation.isPending ? '...' : 'حفظ'}
                              </button>
                              <button
                                onClick={() => handleCancelEdit(bird.id)}
                                className="px-2 py-1 bg-gray-400 text-white rounded text-xs hover:bg-gray-500 transition-colors"
                              >
                                إلغاء
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => handleEdit(bird)}
                                className="px-2 py-1 bg-amber-500 text-white rounded text-xs hover:bg-amber-600 transition-colors"
                              >
                                تعديل
                              </button>
                              <button
                                onClick={() => handleEdit(bird)}
                                className="px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600 transition-colors"
                              >
                                تحرير
                              </button>
                              <button
                                onClick={() => handleDelete(bird)}
                                disabled={deleteBirdMutation.isPending}
                                className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600 disabled:opacity-50 transition-colors"
                              >
                                {deleteBirdMutation.isPending ? '...' : 'حذف'}
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Summary */}
      <div className="mt-3 text-xs text-amber-600 text-left">
        إجمالي السجلات: {filteredData.length}
        {searchTerm && ` (من أصل ${birdData.length})`}
      </div>
    </div>
  );
}
