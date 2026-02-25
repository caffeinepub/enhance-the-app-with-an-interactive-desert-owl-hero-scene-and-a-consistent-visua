import { useState } from 'react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetActiveMapReference, useUploadMapImage } from '../hooks/useQueries';
import { useFileUrl, useFileUpload } from '../blob-storage/FileStorage';
import { Upload, RefreshCw } from 'lucide-react';

const ADMIN_PRINCIPAL = '5uylz-j7fcd-isj73-gp57f-xwwyy-po2ib-7iboa-fdkdv-nrsam-3bd3r-qqe';
const FALLBACK_MAP = '/assets/generated/al-buraimi-official-static-map.dim_1024x768.png';

function MapImage({ path }: { path: string }) {
  const { data: url } = useFileUrl(path);
  if (!url) return (
    <div className="w-full aspect-video bg-muted flex items-center justify-center rounded-xl">
      <RefreshCw className="w-8 h-8 text-muted-foreground animate-spin" />
    </div>
  );
  return <img src={url} alt="خريطة البريمي" className="w-full rounded-xl shadow-md" />;
}

export default function StaticAlBuraimiMap() {
  const { identity } = useInternetIdentity();
  const { data: activeMapRef } = useGetActiveMapReference();
  const { mutateAsync: uploadMapImage, isPending: isUploading } = useUploadMapImage();
  const { uploadFile } = useFileUpload();
  const [uploadError, setUploadError] = useState<string | null>(null);

  const currentPrincipal = identity?.getPrincipal().toString();
  const isAdmin = currentPrincipal === ADMIN_PRINCIPAL;

  const handleMapUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(null);
    try {
      const path = `maps/al-buraimi-map-${Date.now()}.${file.name.split('.').pop()}`;
      await uploadFile(path, file);
      await uploadMapImage(path);
    } catch (err) {
      setUploadError('فشل رفع الخريطة');
    }
  };

  return (
    <div className="space-y-4">
      {activeMapRef ? (
        <MapImage path={activeMapRef} />
      ) : (
        <img
          src={FALLBACK_MAP}
          alt="خريطة محافظة البريمي"
          className="w-full rounded-xl shadow-md"
        />
      )}

      {isAdmin && (
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg cursor-pointer transition-colors font-arabic text-sm">
            <Upload className="w-4 h-4" />
            <span>{isUploading ? 'جاري الرفع...' : 'رفع خريطة جديدة'}</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleMapUpload}
              disabled={isUploading}
            />
          </label>
          {uploadError && <p className="text-destructive text-sm font-arabic">{uploadError}</p>}
        </div>
      )}
    </div>
  );
}
