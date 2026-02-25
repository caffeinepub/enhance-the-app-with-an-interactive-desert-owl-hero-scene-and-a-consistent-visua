import { useState, useEffect, useCallback } from 'react';
import { useActor } from '../hooks/useActor';
import {
  useGetAllBirdData,
  useSaveAllBirdData,
  useDeleteBirdData,
  useUpdateBirdDetails,
  useAddBirdWithDetails,
} from '../hooks/useQueries';
import { BirdData } from '../backend';
import { toast } from 'sonner';
import { exportBirdDataToCSV } from '../lib/csvExport';

interface EditingRow {
  key: string;
  data: BirdData;
}

export default function BirdDataTable() {
  const { actor } = useActor();
  const { data: allBirdData, isLoading, refetch } = useGetAllBirdData();
  const saveAllMutation = useSaveAllBirdData();
  const deleteMutation = useDeleteBirdData();
  const updateMutation = useUpdateBirdDetails();
  const addMutation = useAddBirdWithDetails();

  const [isAdmin, setIsAdmin] = useState(false);
  const [canModify, setCanModify] = useState(false);
  const [editingRow, setEditingRow] = useState<EditingRow | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newBird, setNewBird] = useState<{
    arabicName: string;
    scientificName: string;
    englishName: string;
    description: string;
    notes: string;
    latitude: string;
    longitude: string;
  }>({
    arabicName: '',
    scientificName: '',
    englishName: '',
    description: '',
    notes: '',
    latitude: '23.5',
    longitude: '56.0',
  });

  const checkAdminStatus = useCallback(async () => {
    if (!actor) return;
    try {
      const [adminResult, modifyResult] = await Promise.all([
        actor.isCallerAdmin(),
        actor.canCallerModifyData(),
      ]);
      setIsAdmin(adminResult);
      setCanModify(modifyResult);
    } catch (err) {
      console.error('Error checking admin status:', err);
    }
  }, [actor]);

  useEffect(() => {
    checkAdminStatus();
  }, [checkAdminStatus]);

  const filteredData = (allBirdData || []).filter(([, bird]) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      bird.arabicName?.toLowerCase().includes(q) ||
      bird.scientificName?.toLowerCase().includes(q) ||
      bird.englishName?.toLowerCase().includes(q) ||
      bird.description?.toLowerCase().includes(q)
    );
  });

  const handleEdit = (key: string, data: BirdData) => {
    setEditingRow({ key, data: { ...data } });
  };

  const handleSave = async () => {
    if (!editingRow) return;
    try {
      await updateMutation.mutateAsync({
        birdName: editingRow.key,
        arabicName: editingRow.data.arabicName,
        scientificName: editingRow.data.scientificName,
        englishName: editingRow.data.englishName,
        description: editingRow.data.description,
        notes: editingRow.data.notes,
      });
      setEditingRow(null);
    } catch (err) {
      console.error('Save error:', err);
    }
  };

  const handleDelete = async (birdName: string) => {
    if (!window.confirm(`هل أنت متأكد من حذف "${birdName}"؟`)) return;
    try {
      await deleteMutation.mutateAsync(birdName);
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const handleSaveAll = async () => {
    if (!allBirdData) return;
    try {
      await saveAllMutation.mutateAsync(allBirdData);
    } catch (err) {
      console.error('Save all error:', err);
    }
  };

  const handleAddBird = async () => {
    if (!newBird.arabicName) {
      toast.error('يرجى إدخال الاسم العربي للطائر');
      return;
    }
    try {
      await addMutation.mutateAsync({
        arabicName: newBird.arabicName,
        scientificName: newBird.scientificName,
        englishName: newBird.englishName,
        description: newBird.description,
        notes: newBird.notes,
        latitude: parseFloat(newBird.latitude || '23.5'),
        longitude: parseFloat(newBird.longitude || '56.0'),
        audioFilePath: null,
        subImages: [],
      });
      setShowAddForm(false);
      setNewBird({
        arabicName: '',
        scientificName: '',
        englishName: '',
        description: '',
        notes: '',
        latitude: '23.5',
        longitude: '56.0',
      });
    } catch (err) {
      console.error('Add bird error:', err);
    }
  };

  const handleExportCSV = () => {
    if (!allBirdData) return;
    const birds = allBirdData.map(([, bird]) => bird);
    exportBirdDataToCSV(birds);
    toast.success('تم تصدير البيانات بنجاح');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16" dir="rtl">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto mb-3"></div>
          <p className="text-muted-foreground">جاري تحميل البيانات...</p>
        </div>
      </div>
    );
  }

  return (
    <div dir="rtl" className="space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <input
            type="text"
            placeholder="🔍 بحث في البيانات..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 px-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleExportCSV}
            className="px-3 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition-colors"
          >
            📥 تصدير CSV
          </button>
          {(isAdmin || canModify) && (
            <>
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="px-3 py-2 bg-primary text-primary-foreground rounded-lg text-sm hover:bg-primary/90 transition-colors"
              >
                ➕ إضافة
              </button>
              <button
                onClick={handleSaveAll}
                disabled={saveAllMutation.isPending}
                className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {saveAllMutation.isPending ? '⏳ جاري الحفظ...' : '💾 حفظ الكل'}
              </button>
              <button
                onClick={() => refetch()}
                className="px-3 py-2 bg-secondary text-secondary-foreground rounded-lg text-sm hover:bg-secondary/80 transition-colors"
              >
                🔄 تحديث
              </button>
            </>
          )}
        </div>
      </div>

      {/* Add Bird Form */}
      {showAddForm && (isAdmin || canModify) && (
        <div className="bg-card border border-border rounded-xl p-4 space-y-3">
          <h3 className="font-bold text-foreground">إضافة طائر جديد</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {(
              [
                { key: 'arabicName', label: 'الاسم العربي *' },
                { key: 'scientificName', label: 'الاسم العلمي' },
                { key: 'englishName', label: 'الاسم الإنجليزي' },
                { key: 'latitude', label: 'خط العرض' },
                { key: 'longitude', label: 'خط الطول' },
              ] as { key: keyof typeof newBird; label: string }[]
            ).map(({ key, label }) => (
              <div key={key}>
                <label className="block text-xs text-muted-foreground mb-1">{label}</label>
                <input
                  type="text"
                  value={newBird[key]}
                  onChange={(e) => setNewBird((prev) => ({ ...prev, [key]: e.target.value }))}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(
              [
                { key: 'description', label: 'الوصف' },
                { key: 'notes', label: 'ملاحظات' },
              ] as { key: keyof typeof newBird; label: string }[]
            ).map(({ key, label }) => (
              <div key={key}>
                <label className="block text-xs text-muted-foreground mb-1">{label}</label>
                <textarea
                  value={newBird[key]}
                  onChange={(e) => setNewBird((prev) => ({ ...prev, [key]: e.target.value }))}
                  rows={2}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                />
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleAddBird}
              disabled={addMutation.isPending}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {addMutation.isPending ? '⏳ جاري الإضافة...' : '✅ إضافة'}
            </button>
            <button
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg text-sm hover:bg-secondary/80 transition-colors"
            >
              إلغاء
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              {['#', 'الاسم العربي', 'الاسم العلمي', 'الاسم الإنجليزي', 'الوصف', 'المواقع', 'الصور', 'الصوت', 'ملاحظات'].map((h) => (
                <th
                  key={h}
                  className="px-3 py-3 text-right font-semibold text-foreground border-b border-border whitespace-nowrap"
                >
                  {h}
                </th>
              ))}
              {(isAdmin || canModify) && (
                <th className="px-3 py-3 text-right font-semibold text-foreground border-b border-border whitespace-nowrap">
                  إجراءات
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {filteredData.length === 0 ? (
              <tr>
                <td
                  colSpan={(isAdmin || canModify) ? 10 : 9}
                  className="text-center py-12 text-muted-foreground"
                >
                  {searchQuery ? 'لا توجد نتائج للبحث' : 'لا توجد بيانات متاحة'}
                </td>
              </tr>
            ) : (
              filteredData.map(([key, bird], index) => {
                const isEditing = editingRow?.key === key;
                return (
                  <tr key={key} className="border-b border-border hover:bg-muted/30 transition-colors">
                    <td className="px-3 py-3 text-muted-foreground">{index + 1}</td>
                    <td className="px-3 py-3 font-medium text-foreground">
                      {isEditing ? (
                        <input
                          value={editingRow.data.arabicName}
                          onChange={(e) =>
                            setEditingRow((prev) =>
                              prev ? { ...prev, data: { ...prev.data, arabicName: e.target.value } } : null
                            )
                          }
                          className="w-full px-2 py-1 border border-border rounded bg-background text-foreground text-sm"
                        />
                      ) : (
                        bird.arabicName
                      )}
                    </td>
                    <td className="px-3 py-3 text-muted-foreground italic">
                      {isEditing ? (
                        <input
                          value={editingRow.data.scientificName}
                          onChange={(e) =>
                            setEditingRow((prev) =>
                              prev ? { ...prev, data: { ...prev.data, scientificName: e.target.value } } : null
                            )
                          }
                          className="w-full px-2 py-1 border border-border rounded bg-background text-foreground text-sm"
                        />
                      ) : (
                        bird.scientificName || '-'
                      )}
                    </td>
                    <td className="px-3 py-3 text-muted-foreground">
                      {isEditing ? (
                        <input
                          value={editingRow.data.englishName}
                          onChange={(e) =>
                            setEditingRow((prev) =>
                              prev ? { ...prev, data: { ...prev.data, englishName: e.target.value } } : null
                            )
                          }
                          className="w-full px-2 py-1 border border-border rounded bg-background text-foreground text-sm"
                        />
                      ) : (
                        bird.englishName || '-'
                      )}
                    </td>
                    <td className="px-3 py-3 text-muted-foreground max-w-xs">
                      {isEditing ? (
                        <textarea
                          value={editingRow.data.description}
                          onChange={(e) =>
                            setEditingRow((prev) =>
                              prev ? { ...prev, data: { ...prev.data, description: e.target.value } } : null
                            )
                          }
                          rows={2}
                          className="w-full px-2 py-1 border border-border rounded bg-background text-foreground text-sm resize-none"
                        />
                      ) : (
                        <span className="line-clamp-2">{bird.description || '-'}</span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className="inline-flex items-center justify-center w-7 h-7 bg-primary/10 text-primary rounded-full text-xs font-bold">
                        {bird.locations?.length || 0}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className="inline-flex items-center justify-center w-7 h-7 bg-secondary/50 text-secondary-foreground rounded-full text-xs font-bold">
                        {bird.subImages?.length || 0}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center">
                      {bird.audioFile ? (
                        <span className="text-green-600 text-lg">🔊</span>
                      ) : (
                        <span className="text-muted-foreground text-lg">🔇</span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-muted-foreground max-w-xs">
                      {isEditing ? (
                        <textarea
                          value={editingRow.data.notes}
                          onChange={(e) =>
                            setEditingRow((prev) =>
                              prev ? { ...prev, data: { ...prev.data, notes: e.target.value } } : null
                            )
                          }
                          rows={2}
                          className="w-full px-2 py-1 border border-border rounded bg-background text-foreground text-sm resize-none"
                        />
                      ) : (
                        <span className="line-clamp-2">{bird.notes || '-'}</span>
                      )}
                    </td>
                    {(isAdmin || canModify) && (
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-1">
                          {isEditing ? (
                            <>
                              <button
                                onClick={handleSave}
                                disabled={updateMutation.isPending}
                                className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 transition-colors disabled:opacity-50"
                              >
                                💾 حفظ
                              </button>
                              <button
                                onClick={() => setEditingRow(null)}
                                className="px-2 py-1 bg-secondary text-secondary-foreground rounded text-xs hover:bg-secondary/80 transition-colors"
                              >
                                إلغاء
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => handleEdit(key, bird)}
                                className="px-2 py-1 bg-amber-500 text-white rounded text-xs hover:bg-amber-600 transition-colors"
                              >
                                ✏️ تعديل
                              </button>
                              <button
                                onClick={() => handleDelete(key)}
                                disabled={deleteMutation.isPending}
                                className="px-2 py-1 bg-destructive text-destructive-foreground rounded text-xs hover:bg-destructive/90 transition-colors disabled:opacity-50"
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

      {/* Summary */}
      <div className="text-sm text-muted-foreground text-center">
        إجمالي السجلات: {filteredData.length}
        {searchQuery && ` (من أصل ${allBirdData?.length || 0})`}
      </div>
    </div>
  );
}
