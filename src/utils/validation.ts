/**
 * Bangladesh Phone Number & Input Validation
 */

export function isValidBDPhone(phone: string): boolean {
  if (!phone) return false;
  // Clean spaces, dashes
  const clean = phone.replace(/[\s\-]/g, '');
  // Matches: 013-019 followed by 8 digits (total 11 digits)
  // or +88013-019 followed by 8 digits
  // or 88013-019 followed by 8 digits
  const regex = /^(?:\+88|88)?(01[3-9]\d{8})$/;
  return regex.test(clean);
}

export function formatBDPhone(phone: string): string {
  const clean = phone.replace(/[\s\-]/g, '');
  const match = clean.match(/^(?:\+88|88)?(01[3-9]\d{8})$/);
  if (match) {
    return match[1];
  }
  return phone;
}

export const BD_DISTRICTS = [
  'Dhaka', 'Chattogram', 'Sylhet', 'Rajshahi', 'Khulna', 'Barishal', 'Rangpur', 'Mymensingh',
  'Gazipur', 'Narayanganj', 'Cumilla', 'Bogura', 'Cox\'s Bazar', 'Jashore', 'Tangail',
  'Brahmanbaria', 'Narsingdi', 'Faridpur', 'Feni', 'Noakhali', 'Pabna', 'Kushtia',
  'Dinajpur', 'Sirajganj', 'Jamalpur', 'Manikganj', 'Munshiganj', 'Kishoreganj',
  'Bagerhat', 'Chuadanga', 'Jhenaidah', 'Magura', 'Meherpur', 'Narail', 'Satkhira',
  'Chandpur', 'Lakshmipur', 'Khagrachhari', 'Rangamati', 'Bandarban', 'Habiganj',
  'Moulvibazar', 'Sunamganj', 'Natore', 'Naogaon', 'Chapainawabganj', 'Joypurhat',
  'Gaibandha', 'Kurigram', 'Lalmonirhat', 'Nilphamari', 'Panchagarh', 'Thakurgaon',
  'Barguna', 'Bhola', 'Jhalokati', 'Patuakhali', 'Pirojpur', 'Netrokona', 'Sherpur',
  'Gopalganj', 'Madaripur', 'Rajbari', 'Shariatpur'
];

export const BD_DISTRICTS_BN: Record<string, string> = {
  'Dhaka': 'ঢাকা',
  'Chattogram': 'চট্টগ্রাম',
  'Sylhet': 'সিলেট',
  'Rajshahi': 'রাজশাহী',
  'Khulna': 'খুলনা',
  'Barishal': 'বরিশাল',
  'Rangpur': 'রংপুর',
  'Mymensingh': 'ময়মনসিংহ',
  'Gazipur': 'গাজীপুর',
  'Narayanganj': 'নারায়ণগঞ্জ',
  'Cumilla': 'কুমিল্লা',
  'Bogura': 'বগুড়া',
  "Cox's Bazar": 'কক্সবাজার',
  'Jashore': 'যশোর',
  'Tangail': 'টাঙ্গাইল',
  'Brahmanbaria': 'ব্রাহ্মণবাড়িয়া',
  'Narsingdi': 'নরসিংদী',
  'Faridpur': 'ফরিদপুর',
  'Feni': 'ফেনী',
  'Noakhali': 'নোয়াখালী',
  'Pabna': 'পাবনা',
  'Kushtia': 'কুষ্টিয়া',
  'Dinajpur': 'দিনাজপুর',
  'Sirajganj': 'সিরাজগঞ্জ',
  'Jamalpur': 'জামালপুর',
  'Manikganj': 'মানিকগঞ্জ',
  'Munshiganj': 'মুন্সীগঞ্জ',
  'Kishoreganj': 'কিশোরগঞ্জ'
};
