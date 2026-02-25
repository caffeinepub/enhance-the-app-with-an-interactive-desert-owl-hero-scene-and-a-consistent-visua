import React, { useState, useMemo } from 'react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import {
  useGetAllBirdData,
  useIsCallerAdmin,
  useAddBirdWithDetails,
  useUpdateBirdDetails,
  useDeleteBirdById,
} from '../hooks/useQueries';
import { BirdData } from '../backend';
import { toast } from 'sonner';

// ─── Types ────────────────────────────────────────────────────────────────────

interface EditableRow {
  arabicName: string;
  scientificName: string;
  englishName: string;
  description: string;
  notes: string;
  latitude: string;
  longitude: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function emptyEditableRow(): EditableRow {
  return {
    arabicName: '',
    scientificName: '',
    englishName: '',
    description: '',
    notes: '',
    latitude: '',
    longitude: '',
  };
}

function birdToEditable(bird: BirdData): EditableRow {
  const loc = bird.locations[0];
  return {
    arabicName: bird.arabicName,
    scientificName: bird.scientificName,
    englishName: bird.englishName,
    description: bird.description,
    notes: bird.notes,
    latitude: loc ? String(loc.latitude) : '',
    longitude: loc ? String(loc.longitude) : '',
  };
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function BirdDataTable() {
  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity;

  const { data: allBirdData, isLoading: dataLoading } = useGetAllBirdData();
  const { data: isAdmin } = useIsCallerAdmin();

  const addBirdMutation = useAddBirdWithDetails();
  const updateBirdMutation = useUpdateBirdDetails();
  const deleteBirdMutation = useDeleteBirdById();

  // ── Search ──────────────────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState('');

  // ── Editing state ───────────────────────────────────────────────────────────
  // editingId: bigint for existing rows, 'new' for a new row being added
  const [editingId, setEditingId] = useState<bigint | 'new' | null>(null);
  const [editValues, setEditValues] = useState<EditableRow>(emptyEditableRow());
  const [savingId, setSavingId] = useState<bigint | 'new' | null>(null);
  const [deletingId, setDeletingId] = useState<bigint | null>(null);

  // ── Derived data ─────────────────────────────────────────────────────────────
  const birds: BirdData[] = useMemo(() => {
    if (!allBirdData) return [];
    return allBirdData.map(([, bird]) => bird);
  }, [allBirdData]);

  const filteredBirds = useMemo(() => {
    if (!searchQuery.trim()) return birds;
    const q = searchQuery.toLowerCase();
    return birds.filter(
      (b) =>
        b.arabicName.toLowerCase().includes(q) ||
        b.scientificName.toLowerCase().includes(q) ||
        b.englishName.toLowerCase().includes(q) ||
        b.description.toLowerCase().includes(q) ||
        b.notes.toLowerCase().includes(q)
    );
  }, [birds, searchQuery]);

  // ── Handlers ─────────────────────────────────────────────────────────────────

  function handleStartEdit(bird: BirdData) {
    setEditingId(bird.id);
    setEditValues(birdToEditable(bird));
  }

  function handleCancelEdit() {
    setEditingId(null);
    setEditValues(emptyEditableRow());
  }

  function handleStartAdd() {
    setEditingId('new');
    setEditValues(emptyEditableRow());
  }

  function handleFieldChange(field: keyof EditableRow, value: string) {
    setEditValues((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSave(bird?: BirdData) {
    const id = bird ? bird.id : 'new';
    setSavingId(id);
    try {
      const lat = parseFloat(editValues.latitude) || 0;
      const lng = parseFloat(editValues.longitude) || 0;

      if (bird) {
        // Update existing bird using updateBirdDetails
        await updateBirdMutation.mutateAsync({
          birdName: bird.arabicName,
          arabicName: editValues.arabicName,
          scientificName: editValues.scientificName,
          englishName: editValues.englishName,
          description: editValues.description,
          notes: editValues.notes,
        });
        toast.success('تم حفظ البيانات بنجاح');
      } else {
        // Add new bird
        if (!editValues.arabicName.trim()) {
          toast.error('يرجى إدخال الاسم العربي');
          setSavingId(null);
          return;
        }
        await addBirdMutation.mutateAsync({
          arabicName: editValues.arabicName,
          scientificName: editValues.scientificName,
          englishName: editValues.englishName,
          description: editValues.description,
          notes: editValues.notes,
          latitude: lat,
          longitude: lng,
          audioFilePath: null,
          subImages: [],
        });
        toast.success('تمت إضافة الطائر بنجاح');
      }
      setEditingId(null);
      setEditValues(emptyEditableRow());
    } catch {
      toast.error('حدث خطأ أثناء الحفظ');
    } finally {
      setSavingId(null);
    }
  }

  async function handleDelete(bird: BirdData) {
    if (!window.confirm(`هل أنت متأكد من حذف "${bird.arabicName}"؟`)) return;
    setDeletingId(bird.id);
    try {
      await deleteBirdMutation.mutateAsync(bird.id);
      toast.success('تم حذف الطائر بنجاح');
    } catch {
      toast.error('حدث خطأ أثناء الحذف');
    } finally {
      setDeletingId(null);
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  if (!isAuthenticated) {
    return (
      <div
        className="flex items-center justify-center min-h-[200px] text-amber-700 text-lg"
        dir="rtl"
      >
        يرجى تسجيل الدخول لعرض بيانات الطيور
      </div>
    );
  }

  if (dataLoading) {
    return (
      <div
        className="flex items-center justify-center min-h-[200px] text-amber-700 text-lg gap-3"
        dir="rtl"
      >
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600" />
        جاري تحميل البيانات...
      </div>
    );
  }

  const inputClass =
    'w-full border border-amber-300 rounded px-2 py-1 text-sm bg-amber-50 focus:outline-none focus:ring-1 focus:ring-amber-500 text-right';

  const colCount = isAdmin ? 9 : 8;

  return (
    <div dir="rtl" className="w-full">
      {/* ── Toolbar ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        {/* Search */}
        <input
          type="text"
          placeholder="بحث في بيانات الطيور..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 min-w-[200px] border border-amber-300 rounded-lg px-3 py-2 text-sm bg-amber-50 focus:outline-none focus:ring-2 focus:ring-amber-500 text-right"
        />

        {/* Add button — admin only */}
        {isAdmin && (
          <button
            onClick={handleStartAdd}
            disabled={editingId !== null}
            className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-bold px-4 py-2 rounded-lg text-sm transition-colors"
          >
            <span className="text-lg leading-none">+</span>
            إضافة طائر
          </button>
        )}
      </div>

      {/* ── Table ── */}
      <div className="overflow-x-auto rounded-xl border border-amber-200 shadow-sm">
        <table className="w-full text-sm text-right">
          <thead className="bg-amber-100 text-amber-900">
            <tr>
              <th className="px-3 py-3 font-bold border-b border-amber-200 whitespace-nowrap">#</th>
              <th className="px-3 py-3 font-bold border-b border-amber-200 whitespace-nowrap">الاسم العربي</th>
              <th className="px-3 py-3 font-bold border-b border-amber-200 whitespace-nowrap">الاسم العلمي</th>
              <th className="px-3 py-3 font-bold border-b border-amber-200 whitespace-nowrap">الاسم الإنجليزي</th>
              <th className="px-3 py-3 font-bold border-b border-amber-200 whitespace-nowrap">الوصف</th>
              <th className="px-3 py-3 font-bold border-b border-amber-200 whitespace-nowrap">ملاحظات</th>
              <th className="px-3 py-3 font-bold border-b border-amber-200 whitespace-nowrap">خط العرض</th>
              <th className="px-3 py-3 font-bold border-b border-amber-200 whitespace-nowrap">خط الطول</th>
              {isAdmin && (
                <th className="px-3 py-3 font-bold border-b border-amber-200 text-center whitespace-nowrap">
                  الإجراءات
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {/* New row being added */}
            {editingId === 'new' && (
              <tr className="bg-green-50 border-b border-amber-200">
                <td className="px-3 py-2 text-amber-400 text-xs">جديد</td>
                <td className="px-3 py-2">
                  <input
                    className={inputClass}
                    value={editValues.arabicName}
                    onChange={(e) => handleFieldChange('arabicName', e.target.value)}
                    placeholder="الاسم العربي *"
                    autoFocus
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    className={inputClass}
                    value={editValues.scientificName}
                    onChange={(e) => handleFieldChange('scientificName', e.target.value)}
                    placeholder="الاسم العلمي"
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    className={inputClass}
                    value={editValues.englishName}
                    onChange={(e) => handleFieldChange('englishName', e.target.value)}
                    placeholder="الاسم الإنجليزي"
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    className={inputClass}
                    value={editValues.description}
                    onChange={(e) => handleFieldChange('description', e.target.value)}
                    placeholder="الوصف"
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    className={inputClass}
                    value={editValues.notes}
                    onChange={(e) => handleFieldChange('notes', e.target.value)}
                    placeholder="ملاحظات"
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    className={inputClass}
                    value={editValues.latitude}
                    onChange={(e) => handleFieldChange('latitude', e.target.value)}
                    placeholder="0.0"
                    type="number"
                    step="any"
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    className={inputClass}
                    value={editValues.longitude}
                    onChange={(e) => handleFieldChange('longitude', e.target.value)}
                    placeholder="0.0"
                    type="number"
                    step="any"
                  />
                </td>
                <td className="px-3 py-2">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => handleSave()}
                      disabled={savingId === 'new'}
                      className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-bold px-3 py-1.5 rounded-lg text-xs transition-colors whitespace-nowrap"
                    >
                      {savingId === 'new' ? (
                        <span className="flex items-center gap-1">
                          <span className="animate-spin inline-block w-3 h-3 border border-white border-t-transparent rounded-full" />
                          حفظ...
                        </span>
                      ) : (
                        'حفظ'
                      )}
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="bg-gray-400 hover:bg-gray-500 text-white font-bold px-3 py-1.5 rounded-lg text-xs transition-colors whitespace-nowrap"
                    >
                      إلغاء
                    </button>
                  </div>
                </td>
              </tr>
            )}

            {/* Existing rows */}
            {filteredBirds.length === 0 && editingId !== 'new' ? (
              <tr>
                <td
                  colSpan={colCount}
                  className="px-3 py-8 text-center text-amber-500"
                >
                  {searchQuery
                    ? 'لا توجد نتائج مطابقة للبحث'
                    : 'لا توجد بيانات طيور حتى الآن'}
                </td>
              </tr>
            ) : (
              filteredBirds.map((bird, index) => {
                const isEditingThis = editingId === bird.id;
                const isSavingThis = savingId === bird.id;
                const isDeletingThis = deletingId === bird.id;
                const firstLoc = bird.locations[0];

                return (
                  <tr
                    key={String(bird.id)}
                    className={`border-b border-amber-100 transition-colors ${
                      isEditingThis
                        ? 'bg-amber-50'
                        : index % 2 === 0
                        ? 'bg-white'
                        : 'bg-amber-50/30'
                    } hover:bg-amber-50`}
                  >
                    <td className="px-3 py-2 text-amber-600 font-bold">{index + 1}</td>

                    {/* Arabic Name */}
                    <td className="px-3 py-2">
                      {isEditingThis ? (
                        <input
                          className={inputClass}
                          value={editValues.arabicName}
                          onChange={(e) => handleFieldChange('arabicName', e.target.value)}
                          autoFocus
                        />
                      ) : (
                        <span className="font-bold text-amber-900">{bird.arabicName}</span>
                      )}
                    </td>

                    {/* Scientific Name */}
                    <td className="px-3 py-2">
                      {isEditingThis ? (
                        <input
                          className={inputClass}
                          value={editValues.scientificName}
                          onChange={(e) => handleFieldChange('scientificName', e.target.value)}
                        />
                      ) : (
                        <span className="text-gray-700 italic">{bird.scientificName || '—'}</span>
                      )}
                    </td>

                    {/* English Name */}
                    <td className="px-3 py-2">
                      {isEditingThis ? (
                        <input
                          className={inputClass}
                          value={editValues.englishName}
                          onChange={(e) => handleFieldChange('englishName', e.target.value)}
                        />
                      ) : (
                        <span className="text-gray-700">{bird.englishName || '—'}</span>
                      )}
                    </td>

                    {/* Description */}
                    <td className="px-3 py-2 max-w-[180px]">
                      {isEditingThis ? (
                        <input
                          className={inputClass}
                          value={editValues.description}
                          onChange={(e) => handleFieldChange('description', e.target.value)}
                        />
                      ) : (
                        <span className="text-gray-600 line-clamp-2 block">
                          {bird.description || '—'}
                        </span>
                      )}
                    </td>

                    {/* Notes */}
                    <td className="px-3 py-2 max-w-[150px]">
                      {isEditingThis ? (
                        <input
                          className={inputClass}
                          value={editValues.notes}
                          onChange={(e) => handleFieldChange('notes', e.target.value)}
                        />
                      ) : (
                        <span className="text-gray-600 line-clamp-2 block">
                          {bird.notes || '—'}
                        </span>
                      )}
                    </td>

                    {/* Latitude */}
                    <td className="px-3 py-2">
                      {isEditingThis ? (
                        <input
                          className={inputClass}
                          value={editValues.latitude}
                          onChange={(e) => handleFieldChange('latitude', e.target.value)}
                          type="number"
                          step="any"
                        />
                      ) : (
                        <span className="text-gray-600 font-mono text-xs">
                          {firstLoc ? firstLoc.latitude.toFixed(4) : '—'}
                        </span>
                      )}
                    </td>

                    {/* Longitude */}
                    <td className="px-3 py-2">
                      {isEditingThis ? (
                        <input
                          className={inputClass}
                          value={editValues.longitude}
                          onChange={(e) => handleFieldChange('longitude', e.target.value)}
                          type="number"
                          step="any"
                        />
                      ) : (
                        <span className="text-gray-600 font-mono text-xs">
                          {firstLoc ? firstLoc.longitude.toFixed(4) : '—'}
                        </span>
                      )}
                    </td>

                    {/* Action buttons — admin only */}
                    {isAdmin && (
                      <td className="px-3 py-2">
                        <div className="flex items-center justify-center gap-2 flex-wrap">
                          {isEditingThis ? (
                            <>
                              <button
                                onClick={() => handleSave(bird)}
                                disabled={isSavingThis}
                                className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-bold px-3 py-1.5 rounded-lg text-xs transition-colors whitespace-nowrap"
                              >
                                {isSavingThis ? (
                                  <span className="flex items-center gap-1">
                                    <span className="animate-spin inline-block w-3 h-3 border border-white border-t-transparent rounded-full" />
                                    حفظ...
                                  </span>
                                ) : (
                                  'حفظ'
                                )}
                              </button>
                              <button
                                onClick={handleCancelEdit}
                                disabled={isSavingThis}
                                className="bg-gray-400 hover:bg-gray-500 disabled:opacity-50 text-white font-bold px-3 py-1.5 rounded-lg text-xs transition-colors whitespace-nowrap"
                              >
                                إلغاء
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => handleStartEdit(bird)}
                                disabled={editingId !== null || isDeletingThis}
                                className="bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-bold px-3 py-1.5 rounded-lg text-xs transition-colors whitespace-nowrap"
                              >
                                تعديل
                              </button>
                              <button
                                onClick={() => handleDelete(bird)}
                                disabled={editingId !== null || isDeletingThis}
                                className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold px-3 py-1.5 rounded-lg text-xs transition-colors whitespace-nowrap"
                              >
                                {isDeletingThis ? (
                                  <span className="flex items-center gap-1">
                                    <span className="animate-spin inline-block w-3 h-3 border border-white border-t-transparent rounded-full" />
                                    حذف...
                                  </span>
                                ) : (
                                  'حذف'
                                )}
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

      {/* ── Footer info ── */}
      <div className="mt-3 text-xs text-amber-600 text-right">
        إجمالي السجلات: {filteredBirds.length}
        {searchQuery && ` (من أصل ${birds.length})`}
      </div>
    </div>
  );
}
