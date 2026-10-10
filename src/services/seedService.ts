import { doc, getDoc, setDoc, getDocs, collection } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Product, Store } from '../types';

// Use the exact generated image assets
import heroBanner from '../assets/images/sellora_hero_banner_1791591186879.jpg';
import sareeImg from '../assets/images/product_handloom_saree_1791591197744.jpg';
import earbudsImg from '../assets/images/product_wireless_earbuds_1791591207928.jpg';
import organicOilImg from '../assets/images/product_organic_oil_1791591220334.jpg';
import storeCoverImg from '../assets/images/store_cover_dhaka_1791591231244.jpg';

export async function seedInitialMarketplaceData(): Promise<void> {
  try {
    const productsSnap = await getDocs(collection(db, 'products'));
    if (!productsSnap.empty) {
      return; // Already seeded
    }

    // 1. Create a flagship approved merchant store
    const storeId = 'store-aranya-flagship';
    const sampleStore: Store = {
      id: storeId,
      ownerId: 'merchant-dhaka-001',
      storeName: 'Aranya Heritage & Tech',
      slug: 'aranya-heritage-tech',
      description: 'Authentic handcrafted Bangladeshi textiles, natural lifestyle essentials, and modern electronics.',
      contactPhone: '01711234567',
      businessLocation: 'House 42, Road 11, Banani, Dhaka-1213',
      district: 'Dhaka',
      logoUrl: '',
      coverUrl: storeCoverImg,
      status: 'approved',
      rating: 4.9,
      createdAt: new Date().toISOString()
    };
    await setDoc(doc(db, 'stores', storeId), sampleStore);

    // 2. Create high-quality real products
    const initialProducts: Product[] = [
      {
        id: 'prod-jamdani-saree-01',
        storeId,
        ownerId: 'merchant-dhaka-001',
        storeName: 'Aranya Heritage & Tech',
        nameEn: 'Handloom Jamdani Silk Saree',
        nameBn: 'ঐতিহ্যবাহী তাঁতের জামদানি সিল্ক শাড়ি',
        descriptionEn: 'Exquisitely hand-woven royal blue Jamdani silk saree crafted by master weavers of Narayanganj. Features intricate zari floral motifs with matching unstitched blouse piece.',
        descriptionBn: 'নারায়ণগঞ্জের দক্ষ তাঁতিদের হাতে বোনা রয়্যাল ব্লু জামদানি সিল্ক শাড়ি। সোনালী জরির নিখুঁত কাজের নকশা এবং ব্লাউজ পিস সহ।',
        categorySlug: 'clothing',
        price: 8500,
        previousPrice: 10500,
        stock: 12,
        images: [sareeImg],
        status: 'published',
        isFeatured: true,
        createdAt: new Date(Date.now() - 3600000 * 24).toISOString()
      },
      {
        id: 'prod-noir-earbuds-02',
        storeId,
        ownerId: 'merchant-dhaka-001',
        storeName: 'Aranya Heritage & Tech',
        nameEn: 'Noir Audio True Wireless Earbuds',
        nameBn: 'নোয়ার অডিও ট্রু ওয়্যারলেস ইয়ারবাডস',
        descriptionEn: 'High-definition wireless stereo earbuds with active noise cancellation, 32-hour extended battery life with charging case, and IPX5 water resistance.',
        descriptionBn: 'অ্যাক্টিভ নয়েজ ক্যান্সেলেশন এবং স্পষ্ট সাউন্ড সমৃদ্ধ ওয়্যারলেস স্টেরিও ইয়ারবাডস। চার্জিং কেস সহ ৩২ ঘণ্টার ব্যাকআপ এবং ওয়াটার রেজিস্ট্যান্ট।',
        categorySlug: 'gadgets',
        price: 3200,
        previousPrice: 3800,
        stock: 25,
        images: [earbudsImg],
        status: 'published',
        isFeatured: true,
        createdAt: new Date(Date.now() - 3600000 * 12).toISOString()
      },
      {
        id: 'prod-organic-oil-03',
        storeId,
        ownerId: 'merchant-dhaka-001',
        storeName: 'Aranya Heritage & Tech',
        nameEn: 'Botanica Herbal Facial Nourishing Oil',
        nameBn: 'বোটানিকা হারবাল ফেসিয়াল অয়েল (৫০ মি.লি.)',
        descriptionEn: '100% cold-pressed organic botanical facial oil infused with kumkumadi and natural saffron. Restores natural skin radiance and provides deep hydration.',
        descriptionBn: '১০০% কোল্ড প্রেসড ভেষজ ফেসিয়াল অয়েল। প্রাকৃতিক জাফরান এবং কুঙ্কুমাদী নির্যাসে তৈরি, ত্বকের উজ্জ্বলতা ও আর্দ্রতা ধরে রাখে।',
        categorySlug: 'beauty',
        price: 1450,
        previousPrice: 1750,
        stock: 18,
        images: [organicOilImg],
        status: 'published',
        isFeatured: true,
        createdAt: new Date(Date.now() - 3600000 * 6).toISOString()
      }
    ];

    for (const prod of initialProducts) {
      await setDoc(doc(db, 'products', prod.id), prod);
    }
  } catch (err) {
    console.warn('Initial seeding skipped or already present:', err);
  }
}
