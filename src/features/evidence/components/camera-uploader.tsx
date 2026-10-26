'use client';

import React, { useRef, useState } from 'react';
import { Camera, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslations } from 'next-intl';

export interface CapturedPhoto {
  id: string;
  dataUrl: string;
  fileSizeBytes: number;
}

interface CameraUploaderProps {
  photos: CapturedPhoto[];
  onPhotosChange: (photos: CapturedPhoto[]) => void;
  maxPhotos?: number;
}

export function CameraUploader({ photos, onPhotosChange, maxPhotos = 5 }: CameraUploaderProps) {
  const t = useTranslations('operations.camera');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isCompressing, setIsCompressing] = useState(false);

  // Compress image client-side before submission
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const maxDim = 1600;

          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(event.target?.result as string);
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
          resolve(compressedDataUrl);
        };
        img.onerror = reject;
        img.src = event.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsCompressing(true);
    const newPhotos: CapturedPhoto[] = [];

    for (let i = 0; i < files.length; i++) {
      if (photos.length + newPhotos.length >= maxPhotos) break;
      const file = files[i];
      try {
        const compressedUrl = await compressImage(file);
        newPhotos.push({
          id: `photo-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          dataUrl: compressedUrl,
          fileSizeBytes: Math.round((compressedUrl.length * 3) / 4),
        });
      } catch (err) {
        console.error('Lỗi nén ảnh:', err);
      }
    }

    onPhotosChange([...photos, ...newPhotos]);
    setIsCompressing(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemovePhoto = (id: string) => {
    onPhotosChange(photos.filter((p) => p.id !== id));
  };

  return (
    <div className="space-y-3">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        capture="environment"
        onChange={handleFilesSelected}
        className="hidden"
      />

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isCompressing || photos.length >= maxPhotos}
          className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-2 h-11 text-sm font-semibold cursor-pointer"
        >
          {isCompressing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {t('optimizing')}
            </>
          ) : (
            <>
              <Camera className="h-4 w-4" />
              {t('captureButton', { count: photos.length, max: maxPhotos })}
            </>
          )}
        </Button>
      </div>

      {/* Preview Grid */}
      {photos.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 pt-2">
          {photos.map((photo, index) => (
            <div
              key={photo.id}
              className="relative aspect-square rounded-lg border border-slate-200 overflow-hidden bg-slate-100 group shadow-xs"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.dataUrl}
                alt={t('photoAlt', { index: index + 1 })}
                className="w-full h-full object-cover"
              />
              <span className="absolute bottom-1 left-1 bg-black/60 text-white text-[10px] px-1 rounded font-medium">
                #{index + 1}
              </span>
              <button
                type="button"
                onClick={() => handleRemovePhoto(photo.id)}
                className="absolute top-1 right-1 h-6 w-6 rounded-full bg-red-600 text-white flex items-center justify-center shadow-md hover:bg-red-700 cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
