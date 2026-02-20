import { useState, useEffect, ReactNode } from 'react';
import { Camera, Loader2 } from 'lucide-react';

interface LazyGalleryGridProps {
  items: any[];
  renderItem: (item: any, index: number) => ReactNode;
  itemsPerPage?: number;
  className?: string;
}

/**
 * LazyGalleryGrid - Progressive loading for image galleries
 * Loads images in batches to prevent memory overflow
 */
export default function LazyGalleryGrid({
  items,
  renderItem,
  itemsPerPage = 12,
  className = '',
}: LazyGalleryGridProps) {
  const [visibleCount, setVisibleCount] = useState(itemsPerPage);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const visibleItems = items.slice(0, visibleCount);
  const hasMore = visibleCount < items.length;

  const loadMore = () => {
    if (isLoadingMore || !hasMore) return;
    
    setIsLoadingMore(true);
    
    // Simulate loading delay to prevent memory spike
    setTimeout(() => {
      setVisibleCount(prev => Math.min(prev + itemsPerPage, items.length));
      setIsLoadingMore(false);
    }, 300);
  };

  // Auto-load more when scrolling near bottom
  useEffect(() => {
    const handleScroll = () => {
      if (isLoadingMore || !hasMore) return;
      
      const scrollPosition = window.innerHeight + window.scrollY;
      const threshold = document.documentElement.scrollHeight - 500;
      
      if (scrollPosition >= threshold) {
        loadMore();
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isLoadingMore, hasMore, visibleCount]);

  return (
    <div>
      <div className={className}>
        {visibleItems.map((item, index) => renderItem(item, index))}
      </div>
      
      {hasMore && (
        <div className="text-center py-8">
          {isLoadingMore ? (
            <div className="flex items-center justify-center gap-2 text-blue-600">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-sm font-medium">جاري تحميل المزيد...</span>
            </div>
          ) : (
            <button
              onClick={loadMore}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors shadow-md hover:shadow-lg"
            >
              <Camera className="h-5 w-5 inline-block ml-2" />
              تحميل المزيد ({items.length - visibleCount} متبقي)
            </button>
          )}
        </div>
      )}
    </div>
  );
}
