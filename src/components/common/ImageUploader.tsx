import React, { useState, useRef, useEffect, useId } from 'react';
import { UploadCloud, X, AlertCircle, RefreshCw, Link as LinkIcon, Sparkles, Check, Plus, Image as ImageIcon } from 'lucide-react';
import { uploadImage, MAX_FILE_SIZE, ALLOWED_FORMATS, SAMPLE_PRODUCT_IMAGES } from '../../services/storageService';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../locales/LanguageContext';

interface ImageUploaderProps {
  folder: 'stores' | 'products' | 'users';
  maxImages?: number;
  initialImages?: string[];
  onImagesChange: (urls: string[]) => void;
  label?: string;
  helperText?: string;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  folder,
  maxImages = 1,
  initialImages = [],
  onImagesChange,
  label,
  helperText,
}) => {
  const { currentUser } = useAuth();
  const { isBn } = useLanguage();
  const generatedId = useId();
  const inputId = `file-upload-${folder}-${generatedId.replace(/:/g, '')}`;

  const [images, setImages] = useState<string[]>(initialImages || []);
  const [uploading, setUploading] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeMode, setActiveMode] = useState<'upload' | 'url' | 'samples'>('upload');
  const [urlInput, setUrlInput] = useState<string>('');
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Synchronize internal state whenever initialImages prop changes
  useEffect(() => {
    setImages(initialImages || []);
  }, [initialImages]);

  const handleFileProcess = async (filesList: FileList | File[]) => {
    if (!filesList || filesList.length === 0) return;

    if (!currentUser) {
      setErrorMessage(isBn ? 'অনুগ্রহ করে প্রথমে লগইন করুন।' : 'Please sign in to upload images.');
      return;
    }

    setErrorMessage(null);

    const availableSlots = maxImages - images.length;
    if (availableSlots <= 0) {
      setErrorMessage(
        isBn
          ? `সর্বোচ্চ ${maxImages}টি ছবি যোগ করা সম্ভব। নতুন ছবি যোগ করতে আগের ছবি মুছুন।`
          : `Maximum ${maxImages} images allowed. Remove an existing image to add more.`
      );
      return;
    }

    const filesToUpload = Array.from(filesList).slice(0, availableSlots);

    // Validate files
    for (const file of filesToUpload) {
      if (!ALLOWED_FORMATS.includes(file.type) && !file.type.startsWith('image/')) {
        setErrorMessage(
          isBn
            ? 'শুধুমাত্র JPG, PNG, WEBP বা GIF ফরম্যাটের ছবি আপলোড করা যাবে।'
            : 'Only JPG, PNG, WEBP or GIF formats are allowed.'
        );
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        setErrorMessage(
          isBn
            ? 'ছবির আকার ১৫ মেগাবাইট (15MB)-এর কম হতে হবে।'
            : 'File size must not exceed 15MB.'
        );
        return;
      }
    }

    setUploading(true);
    setProgress(15);

    const uploadedUrls: string[] = [];

    try {
      for (let i = 0; i < filesToUpload.length; i++) {
        const file = filesToUpload[i];
        const url = await uploadImage(
          file,
          folder,
          currentUser.uid,
          (pct) => {
            const overall = Math.round(((i + pct / 100) / filesToUpload.length) * 100);
            setProgress(Math.min(overall, 98));
          }
        );
        if (url) {
          uploadedUrls.push(url);
        }
      }

      const updated = maxImages === 1 ? uploadedUrls : [...images, ...uploadedUrls];
      setImages(updated);
      onImagesChange(updated);
      setProgress(100);
    } catch (err: any) {
      console.error('Upload failed:', err);
      setErrorMessage(err.message || (isBn ? 'ছবি আপলোড করতে ব্যর্থ হয়েছে।' : 'Image upload failed.'));
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFileProcess(e.target.files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileProcess(e.dataTransfer.files);
    }
  };

  const handleAddUrl = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = urlInput.trim();
    if (!trimmed) return;

    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://') && !trimmed.startsWith('data:image/')) {
      setErrorMessage(isBn ? 'সঠিক ছবির লিঙ্ক (http:// বা https://) লিখুন।' : 'Enter a valid image URL starting with http:// or https://');
      return;
    }

    if (images.length >= maxImages) {
      setErrorMessage(isBn ? `সর্বোচ্চ ${maxImages}টি ছবি যোগ করা সম্ভব।` : `Maximum ${maxImages} images allowed.`);
      return;
    }

    const updated = maxImages === 1 ? [trimmed] : [...images, trimmed];
    setImages(updated);
    onImagesChange(updated);
    setUrlInput('');
    setErrorMessage(null);
  };

  const handleSelectSample = (sampleUrl: string) => {
    if (images.includes(sampleUrl)) {
      setErrorMessage(isBn ? 'এই ছবিটি ইতিমধ্যে যোগ করা হয়েছে।' : 'This image has already been added.');
      return;
    }

    if (images.length >= maxImages) {
      setErrorMessage(isBn ? `সর্বোচ্চ ${maxImages}টি ছবি যোগ করা সম্ভব।` : `Maximum ${maxImages} images allowed.`);
      return;
    }

    const updated = maxImages === 1 ? [sampleUrl] : [...images, sampleUrl];
    setImages(updated);
    onImagesChange(updated);
    setErrorMessage(null);
  };

  const handleRemoveImage = (indexToRemove: number) => {
    const updated = images.filter((_, idx) => idx !== indexToRemove);
    setImages(updated);
    onImagesChange(updated);
    setErrorMessage(null);
  };

  const remainingSlots = Math.max(0, maxImages - images.length);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        {label && (
          <label className="block text-xs font-bold text-slate-800 tracking-wide">
            {label}
          </label>
        )}
        <span className="text-[11px] font-medium text-slate-500">
          {isBn
            ? `${images.length}/${maxImages}টি ছবি যুক্ত`
            : `${images.length}/${maxImages} uploaded`}
        </span>
      </div>

      {/* Grid of uploaded images */}
      {images.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {images.map((url, idx) => (
            <div
              key={idx}
              className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden border-2 border-emerald-600/40 bg-slate-50 group shadow-sm transition-transform hover:scale-[1.02]"
            >
              <img
                src={url}
                alt={`Product image ${idx + 1}`}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.target as HTMLElement).setAttribute('src', 'https://images.unsplash.com/photo-1560343090-f0409e92791a?auto=format&fit=crop&w=300&q=80');
                }}
              />
              <div className="absolute inset-0 bg-slate-900/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <button
                  type="button"
                  onClick={() => handleRemoveImage(idx)}
                  className="p-1.5 bg-red-600 hover:bg-red-700 text-white rounded-full transition-colors cursor-pointer shadow-md"
                  title={isBn ? 'ছবি মুছুন' : 'Remove image'}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {idx === 0 && (
                <span className="absolute bottom-1 left-1 bg-emerald-700 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow">
                  {isBn ? 'মূল ছবি' : 'Primary'}
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Upload & Add Section if slots available */}
      {remainingSlots > 0 && (
        <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-3.5 space-y-3">
          {/* Mode switch pills */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs font-semibold">
            <button
              type="button"
              onClick={() => { setActiveMode('upload'); setErrorMessage(null); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeMode === 'upload'
                  ? 'bg-emerald-700 text-white shadow-sm'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>{isBn ? 'ডিভাইস থেকে আপলোড' : 'Upload File'}</span>
            </button>

            <button
              type="button"
              onClick={() => { setActiveMode('url'); setErrorMessage(null); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeMode === 'url'
                  ? 'bg-emerald-700 text-white shadow-sm'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <LinkIcon className="w-3.5 h-3.5" />
              <span>{isBn ? 'ছবির লিংক (URL)' : 'Paste URL'}</span>
            </button>

            {folder === 'products' && (
              <button
                type="button"
                onClick={() => { setActiveMode('samples'); setErrorMessage(null); }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  activeMode === 'samples'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>{isBn ? 'নমুনা ছবি বাছাই' : 'Sample Photos'}</span>
              </button>
            )}
          </div>

          {/* Mode 1: File Upload / Drag & drop */}
          {activeMode === 'upload' && (
            <div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileInputChange}
                accept="image/jpeg,image/png,image/webp,image/gif,image/jpg"
                multiple={remainingSlots > 1}
                className="hidden"
                id={inputId}
              />
              <label
                htmlFor={inputId}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-xl p-5 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all duration-150 ${
                  uploading
                    ? 'bg-emerald-50/50 border-emerald-400 pointer-events-none'
                    : isDragging
                    ? 'bg-emerald-100/50 border-emerald-600 ring-2 ring-emerald-500/20'
                    : 'border-slate-300 hover:border-emerald-600 bg-white hover:bg-emerald-50/30'
                }`}
              >
                {uploading ? (
                  <div className="w-full max-w-xs space-y-2 text-center py-2">
                    <div className="flex items-center justify-center gap-2 text-xs font-bold text-emerald-800">
                      <RefreshCw className="w-4 h-4 animate-spin text-emerald-700" />
                      <span>{isBn ? `ছবি প্রসেস ও আপলোড হচ্ছে... (${progress}%)` : `Processing & uploading... (${progress}%)`}</span>
                    </div>
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-600 h-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-slate-500">
                      {isBn ? 'হাই-রেজোলিউশন ছবি স্বয়ংক্রিয়ভাবে অপ্টিমাইজ করা হচ্ছে' : 'High-resolution photo is being auto-optimized'}
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-700">
                      <UploadCloud className="w-5 h-5" />
                    </div>
                    <div className="text-center text-xs text-slate-700 space-y-1">
                      <p className="font-semibold text-emerald-800">
                        {isBn ? 'ছবি নির্বাচন করতে ক্লিক করুন অথবা ড্রপ করুন' : 'Click to select or drag & drop photo here'}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        JPG, PNG, WEBP, GIF &bull; {isBn ? `সর্বোচ্চ ${remainingSlots}টি ছবি যোগ করতে পারবেন` : `Can add up to ${remainingSlots} more`}
                      </p>
                    </div>
                  </>
                )}
              </label>
            </div>
          )}

          {/* Mode 2: Direct URL Input */}
          {activeMode === 'url' && (
            <form onSubmit={handleAddUrl} className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder={isBn ? 'ছবির লিংক পেস্ট করুন (যেমন: https://...)' : 'Paste direct image URL (https://...)'}
                  className="flex-1 text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-white"
                />
                <button
                  type="submit"
                  disabled={!urlInput.trim()}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isBn ? 'যোগ করুন' : 'Add'}</span>
                </button>
              </div>
              <p className="text-[11px] text-slate-500">
                {isBn
                  ? 'গুগল ড্রাইভ, ফেসবুক বা যেকোনো ওয়েবসাইটের পাবলিক ছবির লিংক ব্যবহার করতে পারেন।'
                  : 'You can use any publicly accessible image URL.'}
              </p>
            </form>
          )}

          {/* Mode 3: Sample Photos Picker */}
          {activeMode === 'samples' && folder === 'products' && (
            <div className="space-y-2">
              <p className="text-[11px] text-slate-600 font-medium">
                {isBn
                  ? 'দ্রুত টেস্ট ও প্রোডাক্ট সাজাতে পছন্দের ছবিতে ক্লিক করে যুক্ত করুন:'
                  : 'Click any sample photo to add it directly to your product:'}
              </p>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 max-h-48 overflow-y-auto p-1 bg-white rounded-lg border border-slate-200">
                {SAMPLE_PRODUCT_IMAGES.map((sample, idx) => {
                  const isAdded = images.includes(sample.url);
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectSample(sample.url)}
                      disabled={isAdded}
                      className={`relative rounded-lg overflow-hidden border text-left group p-1 transition-all ${
                        isAdded
                          ? 'border-emerald-600 bg-emerald-50/50 opacity-60 cursor-default'
                          : 'border-slate-200 hover:border-emerald-600 hover:shadow-sm cursor-pointer'
                      }`}
                    >
                      <div className="w-full aspect-square rounded overflow-hidden bg-slate-100">
                        <img
                          src={sample.url}
                          alt={sample.labelBn}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <p className="text-[10px] font-semibold text-slate-700 truncate mt-1">
                        {isBn ? sample.labelBn : sample.labelEn}
                      </p>
                      {isAdded && (
                        <div className="absolute top-1 right-1 bg-emerald-600 text-white rounded-full p-0.5 shadow">
                          <Check className="w-3 h-3" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Error display */}
      {errorMessage && (
        <div className="flex items-center gap-2 p-2.5 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs font-medium">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
          <span className="flex-1">{errorMessage}</span>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-red-500 hover:text-red-700"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Helper text */}
      {helperText && !errorMessage && (
        <p className="text-[11px] text-slate-500">{helperText}</p>
      )}
    </div>
  );
};
