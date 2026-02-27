import { useState, useEffect, useRef } from 'react';
import { useActor } from '../hooks/useActor';
import { BirdData } from '../backend';
import { useGetAllBirdData, useSaveBirdData, useDeleteBirdById } from '../hooks/useQueries';
import { exportBirdDataToCSV } from '../lib/csvExport';

interface EditableRow extends BirdData {
  isNew?: boolean;
  isEditing?: boolean;
}

export default function BirdDataTable() {
  const { actor, isFetching: actorFetching } = useActor();
  const [isAdmin, setIsAdmin] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingRows, setEditingRows] = useState<Map<bigint, EditableRow>>(new Map());
  const [newRow, setNewRow] = useState<Partial<EditableRow> | null>(null);
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

  const filtered = birds.filter((b: BirdData) => {
    const term = searchTerm.toLowerCase();
    return (
      b.arabicName?.toLowerCase().includes(term) ||
      b.scientificName?.toLowerCase().includes(term) ||
      b.englishName?.toLowerCase().includes(term) ||
      b.location?.toLowerCase().includes(term) ||
      b.governorate?.toLowerCase().includes(term)
    );
  });

  const handleEdit = (bird: BirdData) => {
    const updated = new Map(editingRows);
    updated.set(bird.id, { ...bird, isEditing: true });
    setEditingRows(updated);
  };

  const handleCancelEdit = (id: bigint) => {
    const updated = new Map(editingRows);
    updated.delete(id);
    setEditingRows(updated);
  };

  const handleFieldChange = (id: bigint, field: keyof BirdData, value: string) => {
    const updated = new Map(editingRows);
    const row = updated.get(id);
    if (!row) return;
    (row as any)[field] = value;
    updated.set(id, { ...row });
    setEditingRows(updated);
  };

  const handleSave = async (id: bigint) => {
    const row = editingRows.get(id);
    if (!row) return;
    try {
      await saveMutation.mutateAsync(row as BirdData);
      const updated = new Map(editingRows);
      updated.delete(id);
      setEditingRows(updated);
      refetch();
    } catch (err) {
      alert('فشل حفظ البيانات');
    }
  };

  const handleDelete = async (bird: BirdData) => {
    if (!confirm(`هل أنت متأكد من حذف "${bird.arabicName}"؟`)) return;
    try {
      await deleteMutation.mutateAsync(bird.id);
      refetch();
    } catch (err) {
      alert('فشل حذف السجل');
    }
  };

  const handleAddNew = () => {
    setNewRow({
      id: BigInt(Date.now()),
      arabicName: '',
      scientificName: '',
      englishName: '',
      description: '',
      notes: '',
      location: '',
      governorate: '',
      localName: '',
      mountainName: '',
      valleyName: '',
      locations: [],
      subImages: [],
      audioFile: undefined,
    });
    setShowAddForm(true);
    setTimeout(() => addFormRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  const handleNewRowFieldChange = (field: string, value: string) => {
    setNewRow(prev => prev ? { ...prev, [field]: value } : null);
  };

  const handleSaveNew = async () => {
    if (!newRow || !newRow.arabicName?.trim()) {
      alert('الاسم العربي مطلوب');
      return;
    }
    try {
      const birdToSave: BirdData = {
        id: BigInt(0),
        arabicName: newRow.arabicName || '',
        scientificName: newRow.scientificName || '',
        englishName: newRow.englishName || '',
        description: newRow.description || '',
        notes: newRow.notes || '',
        location: newRow.location || '',
        governorate: newRow.governorate || '',
        localName: newRow.localName || '',
        mountainName: newRow.mountainName || '',
        valleyName: newRow.valleyName || '',
        locations: [],
        subImages: [],
        audioFile: undefined,
      };
      await saveMutation.mutateAsync(birdToSave);
      setNewRow(null);
      setShowAddForm(false);
      refetch();
    } catch (err) {
      alert('فشل إضافة السجل');
    }
  };

  const handleCancelNew = () => {
    setNewRow(null);
    setShowAddForm(false);
  };

  const handleExportCSV = () => {
    if (filtered.length === 0) return;
    exportBirdDataToCSV(filtered);
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
            📊 {filtered.length} / {birds.length} سجل
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
          <h3 className="text-green-800 font-bold mb-4 text-base">➕ إضافة طائر جديد</h3>
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
      <div className="overflow-x-auto px-4 py-4">
        <table className="min-w-full bg-white rounded-xl shadow-md border border-amber-200 text-sm">
          <thead className="bg-amber-800 text-amber-50">
            <tr>
              <th className="px-3 py-3 text-right font-semibold whitespace-nowrap">#</th>
              <th className="px-3 py-3 text-right font-semibold whitespace-nowrap">الاسم العربي</th>
              <th className="px-3 py-3 text-right font-semibold whitespace-nowrap">الاسم العلمي</th>
              <th className="px-3 py-3 text-right font-semibold whitespace-nowrap">الاسم الإنجليزي</th>
              <th className="px-3 py-3 text-right font-semibold whitespace-nowrap">الموقع</th>
              <th className="px-3 py-3 text-right font-semibold whitespace-nowrap">الولاية</th>
              <th className="px-3 py-3 text-right font-semibold whitespace-nowrap">عدد المواقع</th>
              <th className="px-3 py-3 text-right font-semibold whitespace-nowrap">الوصف</th>
              <th className="px-3 py-3 text-right font-semibold whitespace-nowrap">ملاحظات</th>
              {isAdmin && (
                <th className="px-3 py-3 text-right font-semibold whitespace-nowrap">الإجراءات</th>
              )}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={isAdmin ? 10 : 9} className="px-4 py-8 text-center text-amber-600">
                  <div className="text-3xl mb-2">📭</div>
                  <p>لا توجد بيانات</p>
                </td>
              </tr>
            ) : (
              filtered.map((bird: BirdData, idx: number) => {
                const editing = editingRows.get(bird.id);
                const isEditing = !!editing;

                return (
                  <tr
                    key={String(bird.id)}
                    className={`border-b border-amber-100 transition-colors ${
                      isEditing ? 'bg-yellow-50' : 'hover:bg-amber-50'
                    }`}
                  >
                    <td className="px-3 py-2 text-amber-600 font-mono text-xs">{idx + 1}</td>

                    {/* Editable fields */}
                    {(['arabicName', 'scientificName', 'englishName', 'location', 'governorate'] as (keyof BirdData)[]).map(field => (
                      <td key={field} className="px-3 py-2">
                        {isEditing ? (
                          <input
                            type="text"
                            value={(editing as any)[field] || ''}
                            onChange={e => handleFieldChange(bird.id, field, e.target.value)}
                            className="w-full border border-yellow-300 rounded px-2 py-1 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-yellow-400 min-w-24"
                          />
                        ) : (
                          <span className="text-amber-900 text-xs">{(bird as any)[field] || '—'}</span>
                        )}
                      </td>
                    ))}

                    {/* Location count */}
                    <td className="px-3 py-2 text-center">
                      <span className="bg-amber-100 text-amber-800 text-xs px-2 py-0.5 rounded-full font-medium">
                        {bird.locations?.length || 0}
                      </span>
                    </td>

                    {/* Description */}
                    <td className="px-3 py-2 max-w-xs">
                      {isEditing ? (
                        <textarea
                          value={editing.description || ''}
                          onChange={e => handleFieldChange(bird.id, 'description', e.target.value)}
                          rows={2}
                          className="w-full border border-yellow-300 rounded px-2 py-1 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-yellow-400 min-w-32"
                        />
                      ) : (
                        <span className="text-amber-800 text-xs line-clamp-2">{bird.description || '—'}</span>
                      )}
                    </td>

                    {/* Notes */}
                    <td className="px-3 py-2 max-w-xs">
                      {isEditing ? (
                        <textarea
                          value={editing.notes || ''}
                          onChange={e => handleFieldChange(bird.id, 'notes', e.target.value)}
                          rows={2}
                          className="w-full border border-yellow-300 rounded px-2 py-1 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-yellow-400 min-w-32"
                        />
                      ) : (
                        <span className="text-amber-800 text-xs line-clamp-2">{bird.notes || '—'}</span>
                      )}
                    </td>

                    {/* Admin Actions */}
                    {isAdmin && (
                      <td className="px-3 py-2 whitespace-nowrap">
                        <div className="flex gap-1 flex-wrap">
                          {isEditing ? (
                            <>
                              <button
                                onClick={() => handleSave(bird.id)}
                                disabled={saveMutation.isPending}
                                className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-2 py-1 rounded text-xs font-medium transition-colors"
                              >
                                {saveMutation.isPending ? '⏳' : '💾 حفظ'}
                              </button>
                              <button
                                onClick={() => handleCancelEdit(bird.id)}
                                className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-2 py-1 rounded text-xs font-medium transition-colors"
                              >
                                إلغاء
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => handleEdit(bird)}
                                className="bg-amber-500 hover:bg-amber-600 text-white px-2 py-1 rounded text-xs font-medium transition-colors"
                              >
                                ✏️ تعديل
                              </button>
                              <button
                                onClick={() => handleEdit(bird)}
                                className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded text-xs font-medium transition-colors"
                              >
                                🔄 تحرير
                              </button>
                              <button
                                onClick={() => handleDelete(bird)}
                                disabled={deleteMutation.isPending}
                                className="bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white px-2 py-1 rounded text-xs font-medium transition-colors"
                              >
                                🗑️ حذف
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
    </div>
  );
}
