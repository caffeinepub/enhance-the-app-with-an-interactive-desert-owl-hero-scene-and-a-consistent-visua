import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Search, Plus, Edit2, Trash2, Download, FileText, RefreshCw, X, Save } from 'lucide-react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import {
  useGetAllBirdData,
  useAddBirdWithDetails,
  useUpdateBirdDetails,
  useDeleteBirdData,
  useIsCallerAdmin,
} from '../hooks/useQueries';
import { BirdData } from '../backend';
import { exportBirdsToExcel } from '../lib/excelExport';
import { exportBirdsToPDF } from '../lib/pdfExport';

const ADMIN_PRINCIPAL = '5uylz-j7fcd-isj73-gp57f-xwwyy-po2ib-7iboa-fdkdv-nrsam-3bd3r-qqe';

interface BirdFormData {
  arabicName: string;
  englishName: string;
  scientificName: string;
  description: string;
  notes: string;
  latitude: string;
  longitude: string;
}

const emptyForm: BirdFormData = {
  arabicName: '',
  englishName: '',
  scientificName: '',
  description: '',
  notes: '',
  latitude: '',
  longitude: '',
};

export default function BirdDataTable() {
  const navigate = useNavigate();
  const { identity } = useInternetIdentity();
  const { data: birdData, isLoading } = useGetAllBirdData();
  const { data: isAdmin } = useIsCallerAdmin();
  const { mutateAsync: addBird, isPending: isAdding } = useAddBirdWithDetails();
  const { mutateAsync: updateBird, isPending: isUpdating } = useUpdateBirdDetails();
  const { mutateAsync: deleteBird, isPending: isDeleting } = useDeleteBirdData();

  const [searchQuery, setSearchQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingBird, setEditingBird] = useState<string | null>(null);
  const [formData, setFormData] = useState<BirdFormData>(emptyForm);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const isAuthenticated = !!identity;
  const currentPrincipal = identity?.getPrincipal().toString();
  const canModify = isAuthenticated && (currentPrincipal === ADMIN_PRINCIPAL || isAdmin);

  const filteredBirds = birdData?.filter(([name, bird]) => {
    const q = searchQuery.toLowerCase();
    return (
      name.toLowerCase().includes(q) ||
      bird.arabicName.toLowerCase().includes(q) ||
      bird.englishName.toLowerCase().includes(q) ||
      bird.scientificName.toLowerCase().includes(q)
    );
  }) ?? [];

  const handleAdd = async () => {
    if (!formData.arabicName.trim()) return;
    try {
      await addBird({
        arabicName: formData.arabicName,
        scientificName: formData.scientificName,
        englishName: formData.englishName,
        description: formData.description,
        notes: formData.notes,
        latitude: parseFloat(formData.latitude) || 24.1,
        longitude: parseFloat(formData.longitude) || 56.0,
        audioFilePath: null,
        subImages: [],
      });
      setFormData(emptyForm);
      setShowForm(false);
    } catch (err) {
      console.error('Failed to add bird:', err);
    }
  };

  const handleEdit = (name: string, bird: BirdData) => {
    setEditingBird(name);
    setFormData({
      arabicName: bird.arabicName,
      englishName: bird.englishName,
      scientificName: bird.scientificName,
      description: bird.description,
      notes: bird.notes,
      latitude: bird.locations[0]?.latitude.toString() ?? '',
      longitude: bird.locations[0]?.longitude.toString() ?? '',
    });
    setShowForm(true);
  };

  const handleUpdate = async () => {
    if (!editingBird) return;
    try {
      await updateBird({
        birdName: editingBird,
        arabicName: formData.arabicName,
        scientificName: formData.scientificName,
        englishName: formData.englishName,
        description: formData.description,
        notes: formData.notes,
      });
      setEditingBird(null);
      setFormData(emptyForm);
      setShowForm(false);
    } catch (err) {
      console.error('Failed to update bird:', err);
    }
  };

  const handleDelete = async (name: string) => {
    try {
      await deleteBird(name);
      setDeleteConfirm(null);
    } catch (err) {
      console.error('Failed to delete bird:', err);
    }
  };

  const handleExportExcel = () => {
    const birds = filteredBirds.map(([, b]) => b);
    exportBirdsToExcel(birds);
  };

  const handleExportPDF = () => {
    const birds = filteredBirds.map(([, b]) => b);
    exportBirdsToPDF(birds);
  };

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      {/* Table Header */}
      <div className="px-6 py-4 border-b border-border">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <h2 className="text-xl font-bold text-foreground font-arabic">بيانات الطيور</h2>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Search */}
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="بحث..."
                className="pr-9 pl-3 py-2 bg-background border border-border rounded-lg text-sm font-arabic focus:outline-none focus:ring-2 focus:ring-primary/50 w-40"
              />
            </div>

            {/* Export Buttons */}
            <button
              onClick={handleExportExcel}
              className="flex items-center gap-1.5 px-3 py-2 bg-green-600/10 hover:bg-green-600/20 text-green-700 dark:text-green-400 rounded-lg text-sm font-arabic transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Excel</span>
            </button>
            <button
              onClick={handleExportPDF}
              className="flex items-center gap-1.5 px-3 py-2 bg-red-600/10 hover:bg-red-600/20 text-red-700 dark:text-red-400 rounded-lg text-sm font-arabic transition-colors"
            >
              <FileText className="w-4 h-4" />
              <span>PDF</span>
            </button>

            {/* Add Button (admin only) */}
            {canModify && (
              <button
                onClick={() => {
                  setEditingBird(null);
                  setFormData(emptyForm);
                  setShowForm(true);
                }}
                className="flex items-center gap-1.5 px-3 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-arabic hover:bg-primary/90 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Add/Edit Form */}
      {showForm && canModify && (
        <div className="px-6 py-4 bg-muted/50 border-b border-border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-foreground font-arabic">
              {editingBird ? 'تعديل بيانات الطائر' : 'إضافة طائر جديد'}
            </h3>
            <button
              onClick={() => { setShowForm(false); setEditingBird(null); setFormData(emptyForm); }}
              className="p-1 hover:bg-muted rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              { key: 'arabicName', label: 'الاسم العربي', required: true },
              { key: 'englishName', label: 'الاسم الإنجليزي' },
              { key: 'scientificName', label: 'الاسم العلمي' },
              { key: 'latitude', label: 'خط العرض' },
              { key: 'longitude', label: 'خط الطول' },
            ].map(({ key, label, required }) => (
              <div key={key}>
                <label className="block text-xs font-arabic text-foreground/60 mb-1">
                  {label}{required && ' *'}
                </label>
                <input
                  type="text"
                  value={formData[key as keyof BirdFormData]}
                  onChange={(e) => setFormData(prev => ({ ...prev, [key]: e.target.value }))}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm font-arabic focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
            ))}
          </div>

          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-arabic text-foreground/60 mb-1">الوصف</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={2}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm font-arabic focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
              />
            </div>
            <div>
              <label className="block text-xs font-arabic text-foreground/60 mb-1">ملاحظات</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                rows={2}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm font-arabic focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
              />
            </div>
          </div>

          <div className="mt-4 flex gap-2">
            <button
              onClick={editingBird ? handleUpdate : handleAdd}
              disabled={isAdding || isUpdating || !formData.arabicName.trim()}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-arabic hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {(isAdding || isUpdating) ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>{editingBird ? 'حفظ التعديلات' : 'إضافة'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      {isLoading ? (
        <div className="text-center py-12">
          <RefreshCw className="w-8 h-8 animate-spin text-primary mx-auto mb-3" />
          <p className="text-foreground/60 font-arabic">جاري التحميل...</p>
        </div>
      ) : filteredBirds.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-5xl mb-3">🦉</div>
          <p className="text-foreground/60 font-arabic">
            {searchQuery ? 'لا توجد نتائج' : 'لا توجد بيانات'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="px-4 py-3 text-right font-arabic text-foreground/70">#</th>
                <th className="px-4 py-3 text-right font-arabic text-foreground/70">الاسم العربي</th>
                <th className="px-4 py-3 text-right font-arabic text-foreground/70 hidden md:table-cell">الاسم الإنجليزي</th>
                <th className="px-4 py-3 text-right font-arabic text-foreground/70 hidden lg:table-cell">الاسم العلمي</th>
                <th className="px-4 py-3 text-right font-arabic text-foreground/70">المواقع</th>
                {canModify && (
                  <th className="px-4 py-3 text-right font-arabic text-foreground/70">إجراءات</th>
                )}
              </tr>
            </thead>
            <tbody>
              {filteredBirds.map(([name, bird], idx) => (
                <tr key={name} className="border-t border-border hover:bg-muted/50">
                  <td className="px-4 py-3 text-foreground/60">{idx + 1}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => navigate({ to: '/bird/$name', params: { name } })}
                      className="font-arabic text-foreground hover:text-primary transition-colors font-medium"
                    >
                      {bird.arabicName}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-foreground/70 hidden md:table-cell">{bird.englishName || '—'}</td>
                  <td className="px-4 py-3 text-foreground/50 italic hidden lg:table-cell">{bird.scientificName || '—'}</td>
                  <td className="px-4 py-3 text-primary font-semibold">{bird.locations.length}</td>
                  {canModify && (
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleEdit(name, bird)}
                          className="p-1.5 hover:bg-primary/10 text-primary rounded-lg transition-colors"
                          title="تعديل"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        {deleteConfirm === name ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleDelete(name)}
                              disabled={isDeleting}
                              className="px-2 py-1 bg-destructive text-destructive-foreground rounded text-xs font-arabic"
                            >
                              {isDeleting ? '...' : 'تأكيد'}
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(null)}
                              className="px-2 py-1 bg-muted rounded text-xs font-arabic"
                            >
                              إلغاء
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirm(name)}
                            className="p-1.5 hover:bg-destructive/10 text-destructive rounded-lg transition-colors"
                            title="حذف"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
