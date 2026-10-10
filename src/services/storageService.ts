import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase/config';

export interface UploadProgressCallback {
  (progress: number): void;
}

// Support phone photos up to 15MB, since client-side compression will optimize them down to ~50KB
export const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB
export const ALLOWED_FORMATS = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/jpg'];

/**
 * Client-side high-quality image compressor using HTML Canvas.
 * Resizes large smartphone/camera photos (e.g. 4000x3000, 5MB+)
 * to max 1000x1000 JPEG (~40KB-80KB) while preserving high visual fidelity.
 */
export async function compressImageFile(
  file: File,
  maxWidth = 1000,
  maxHeight = 1000,
  quality = 0.82
): Promise<{ compressedBlob: Blob; dataUrl: string; size: number }> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      return reject(new Error('Invalid image format.'));
    }

    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      try {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = Math.max(width, 1);
        canvas.height = Math.max(height, 1);
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          throw new Error('Canvas context unavailable');
        }

        // Fill background with white in case of transparent PNG/WebP converted to JPEG
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw image smoothly
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/jpeg', quality);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve({
                compressedBlob: blob,
                dataUrl,
                size: blob.size,
              });
            } else {
              resolve({
                compressedBlob: file,
                dataUrl,
                size: dataUrl.length,
              });
            }
          },
          'image/jpeg',
          quality
        );
      } catch (err) {
        reject(err);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to load image file.'));
    };

    img.src = objectUrl;
  });
}

export async function uploadImage(
  file: File,
  folder: 'stores' | 'products' | 'users',
  userId: string,
  onProgress?: UploadProgressCallback
): Promise<string> {
  // Validate format
  if (!ALLOWED_FORMATS.includes(file.type) && !file.type.startsWith('image/')) {
    throw new Error('INVALID_FORMAT: JPG, PNG, WEBP বা GIF ফরম্যাটের ছবি নির্বাচন করুন।');
  }

  // Validate size (15MB max)
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('SIZE_EXCEEDED: ফাইলের আকার ১৫ মেগাবাইট (15MB)-এর কম হতে হবে।');
  }

  if (onProgress) onProgress(20);

  // 1. Client-side compression
  let compressedDataUrl = '';
  let compressedBlob: Blob = file;

  try {
    const compResult = await compressImageFile(file, 1000, 1000, 0.82);
    compressedBlob = compResult.compressedBlob;
    compressedDataUrl = compResult.dataUrl;
    if (onProgress) onProgress(50);
  } catch (compErr) {
    console.warn('Image compression fallback:', compErr);
    compressedDataUrl = await new Promise<string>((res, rej) => {
      const reader = new FileReader();
      reader.onload = () => res(reader.result as string);
      reader.onerror = () => rej(new Error('Failed to read image file.'));
      reader.readAsDataURL(file);
    });
  }

  // 2. Upload to Firebase Storage with a 3.5s timeout fallback
  try {
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const path = `${folder}/${userId}/${timestamp}_${randomSuffix}.jpg`;
    const storageRef = ref(storage, path);

    const uploadPromise = new Promise<string>((resolve) => {
      try {
        const uploadTask = uploadBytesResumable(storageRef, compressedBlob, {
          contentType: 'image/jpeg',
        });

        uploadTask.on(
          'state_changed',
          (snapshot) => {
            if (snapshot.totalBytes > 0) {
              const pct = Math.round(
                (snapshot.bytesTransferred / snapshot.totalBytes) * 45
              );
              if (onProgress) onProgress(50 + pct);
            }
          },
          (error) => {
            console.warn('Storage upload error, using compressed data URL:', error.message);
            resolve(compressedDataUrl);
          },
          async () => {
            try {
              const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
              if (onProgress) onProgress(100);
              resolve(downloadUrl);
            } catch {
              resolve(compressedDataUrl);
            }
          }
        );
      } catch {
        resolve(compressedDataUrl);
      }
    });

    const timeoutPromise = new Promise<string>((resolve) => {
      setTimeout(() => {
        resolve(compressedDataUrl);
      }, 3500);
    });

    const resultUrl = await Promise.race([uploadPromise, timeoutPromise]);
    if (onProgress) onProgress(100);
    return resultUrl || compressedDataUrl;
  } catch (err) {
    console.warn('Storage fallback:', err);
    if (onProgress) onProgress(100);
    return compressedDataUrl;
  }
}

/**
 * Sample popular product photo presets for quick seller onboarding & demo
 */
export const SAMPLE_PRODUCT_IMAGES: { labelEn: string; labelBn: string; url: string; category: string }[] = [
  {
    labelEn: 'Nazirshail Rice (চাল)',
    labelBn: 'নাজিরশাইল চাল',
    url: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=800&q=80',
    category: 'rice'
  },
  {
    labelEn: 'Raw Sundarban Honey (মধু)',
    labelBn: 'সুন্দরবনের প্রাকৃতিক মধু',
    url: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&w=800&q=80',
    category: 'honey'
  },
  {
    labelEn: 'Pure Deshi Ghee (ঘি)',
    labelBn: 'খাঁটি গাওয়া ঘি',
    url: 'https://images.unsplash.com/photo-1631451095765-2c91616fc9e6?auto=format&fit=crop&w=800&q=80',
    category: 'dairy'
  },
  {
    labelEn: 'Organic Mustard Oil (সরিষার তেল)',
    labelBn: 'ঘানির খাঁটি সরিষার তেল',
    url: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=800&q=80',
    category: 'oil'
  },
  {
    labelEn: 'Himsagar Mango (আম)',
    labelBn: 'হিমসাগর আম',
    url: 'https://images.unsplash.com/photo-1553279768-865429fa0078?auto=format&fit=crop&w=800&q=80',
    category: 'fruits'
  },
  {
    labelEn: 'Premium Darjeeling Tea (চা পাতা)',
    labelBn: 'দার্জিলিং ব্ল্যাক টি',
    url: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=800&q=80',
    category: 'tea'
  },
  {
    labelEn: 'Organic Turmeric Powder (হলুদ গুঁড়া)',
    labelBn: 'খাঁটি হলুদ গুঁড়া',
    url: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=800&q=80',
    category: 'spices'
  },
  {
    labelEn: 'Traditional Jamdani Saree (শাড়ি)',
    labelBn: 'ঢাকাই জামদানি শাড়ি',
    url: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80',
    category: 'clothing'
  },
  {
    labelEn: 'Cotton Panjabi (পাঞ্জাবি)',
    labelBn: 'প্রিমিয়াম সুতি পাঞ্জাবি',
    url: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=800&q=80',
    category: 'clothing'
  },
  {
    labelEn: 'Handmade Jute Bag (পাটের ব্যাগ)',
    labelBn: 'হস্তশিল্প পাটের ব্যাগ',
    url: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=800&q=80',
    category: 'crafts'
  },
  {
    labelEn: 'Fresh Vegetables Basket (শাকসবজি)',
    labelBn: 'তাজা শাকসবজি',
    url: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80',
    category: 'vegetables'
  },
  {
    labelEn: 'Smartphone (স্মার্টফোন)',
    labelBn: 'স্মার্টফোন',
    url: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=800&q=80',
    category: 'electronics'
  }
];

