import { useState } from 'react';
import { X, ZoomIn, ZoomOut, RotateCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './ui/button';

interface ImageViewPageProps {
  images: string[];
  initialIndex: number;
  onClose: () => void;
}

export default function ImageViewPage({ images, initialIndex, onClose }: ImageViewPageProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
    setZoom(1);
    setRotation(0);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
    setZoom(1);
    setRotation(0);
  };

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 0.25, 0.5));
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  return (
    <div 
      className="image-view-page fixed inset-0 z-50 flex flex-col"
      style={{ backgroundColor: '#000000' }}
      dir="rtl"
    >
      {/* Header with controls */}
      <div className="flex items-center justify-between p-4 bg-black/90">
        <div className="flex items-center gap-2">
          <Button
            onClick={handleZoomIn}
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20"
          >
            <ZoomIn className="h-5 w-5" />
          </Button>
          <Button
            onClick={handleZoomOut}
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20"
          >
            <ZoomOut className="h-5 w-5" />
          </Button>
          <Button
            onClick={handleRotate}
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20"
          >
            <RotateCw className="h-5 w-5" />
          </Button>
          <span className="text-white text-sm mr-4">
            {currentIndex + 1} / {images.length}
          </span>
        </div>
        <Button
          onClick={onClose}
          variant="ghost"
          size="icon"
          className="text-white hover:bg-white/20"
        >
          <X className="h-6 w-6" />
        </Button>
      </div>

      {/* Image container */}
      <div 
        className="image-view-container flex-1 flex items-center justify-center overflow-hidden"
        style={{ backgroundColor: '#000000' }}
      >
        <img
          src={images[currentIndex]}
          alt={`صورة ${currentIndex + 1}`}
          className="max-w-full max-h-full object-contain transition-transform duration-300"
          style={{
            transform: `scale(${zoom}) rotate(${rotation}deg)`,
            backgroundColor: 'transparent',
          }}
        />
      </div>

      {/* Navigation buttons */}
      {images.length > 1 && (
        <>
          <Button
            onClick={handlePrevious}
            variant="ghost"
            size="icon"
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 h-12 w-12"
          >
            <ChevronLeft className="h-8 w-8" />
          </Button>
          <Button
            onClick={handleNext}
            variant="ghost"
            size="icon"
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 h-12 w-12"
          >
            <ChevronRight className="h-8 w-8" />
          </Button>
        </>
      )}
    </div>
  );
}
