import { initializeApp, getApp, getApps } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  onAuthStateChanged, 
  User as FirebaseUser,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDoc, 
  getDocFromServer,
  setDoc, 
  updateDoc, 
  deleteDoc, 
  collection, 
  getDocs,
  onSnapshot
} from 'firebase/firestore';
import { 
  getStorage, 
  ref, 
  uploadBytes, 
  getDownloadURL 
} from 'firebase/storage';
import firebaseConfig from '../firebase-applet-config.json';
import { UserProfile, WeddingChecklistItem, VendorItem, MaharItem, GuestItem, ApprovalStatus, UserFile } from '../types';

// Let's check if the configuration is still active as placeholder/mock
export const isMockMode = firebaseConfig.apiKey === "mock-api-key-for-local-fallback" || !firebaseConfig.apiKey;

let app;
let db: any;
let auth: any;
let storage: any;

if (!isMockMode) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
    auth = getAuth(app);
    storage = getStorage(app);

    // Validate connection to Firestore as required by firebase-integration skill
    const testConnection = async () => {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if (error instanceof Error && error.message.includes('the client is offline')) {
          console.warn("Firestore connection check failed: client is offline.");
        }
      }
    };
    testConnection();
  } catch (error) {
    console.error("Firebase initialization failed, falling back to mock mode:", error);
  }
}

export { db, auth, storage };

// Mandatory Firestore Error Handling definitions as defined in SKILL.md
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const currentAuth = auth || null;
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: currentAuth?.currentUser?.uid,
      email: currentAuth?.currentUser?.email,
      emailVerified: currentAuth?.currentUser?.emailVerified,
      isAnonymous: currentAuth?.currentUser?.isAnonymous,
      tenantId: currentAuth?.currentUser?.tenantId,
      providerInfo: currentAuth?.currentUser?.providerData?.map((provider: any) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Security Rule Violation or Database Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Local Storage simulation implementation for Mock Mode
const MOCK_USERS_KEY = "zawwaja_mock_users";
const MOCK_CHECKLIST_KEY = "zawwaja_mock_checklist";
const MOCK_VENDORS_KEY = "zawwaja_mock_vendors";
const MOCK_MAHAR_KEY = "zawwaja_mock_mahar";
const MOCK_GUESTS_KEY = "zawwaja_mock_guests";

// Initialize mock data if not present
export const defaultWeddingChecklist = [
  // PERSIAPAN AWAL
  { category: "Persiapan Awal", taskName: "Pertemuan dan Persetujuan Keluarga", status: "Selesai", requiresDualCheck: false },
  { category: "Persiapan Awal", taskName: "Tanggal Pernikahan", status: "Selesai", requiresDualCheck: false },
  { category: "Persiapan Awal", taskName: "Prepare Budgeting", status: "Dalam Proses", requiresDualCheck: false },
  { category: "Persiapan Awal", taskName: "Tema Wedding", status: "Dalam Proses", requiresDualCheck: false },

  // ADMINISTRASI PERSIAPAN MENIKAH
  { category: "Administrasi Persiapan Menikah", taskName: "Surat Pengantar dari RT/RW", status: "Belum", requiresDualCheck: true },
  { category: "Administrasi Persiapan Menikah", taskName: "Fotocopy KTP (CPP dan CPW)", status: "Belum", requiresDualCheck: true },
  { category: "Administrasi Persiapan Menikah", taskName: "Fotocopy KK (CPP dan CPW)", status: "Belum", requiresDualCheck: true },
  { category: "Administrasi Persiapan Menikah", taskName: "Fotocopy Akta Kelahiran (CPP dan CPW)", status: "Belum", requiresDualCheck: true },
  { category: "Administrasi Persiapan Menikah", taskName: "Fotocopy Ijazah terakhir (CPP dan CPW)", status: "Belum", requiresDualCheck: true },
  { category: "Administrasi Persiapan Menikah", taskName: "Surat Keterangan Menikah (N1)", status: "Belum", requiresDualCheck: true },
  { category: "Administrasi Persiapan Menikah", taskName: "Surat keterangan asal usul mempelai (N2)", status: "Belum", requiresDualCheck: true },
  { category: "Administrasi Persiapan Menikah", taskName: "Surat Pernyataan persetujuan mempelai (N3)", status: "Belum", requiresDualCheck: true },
  { category: "Administrasi Persiapan Menikah", taskName: "Surat Penyataan tentang orang tua (N4)", status: "Belum", requiresDualCheck: true },
  { category: "Administrasi Persiapan Menikah", taskName: "Foto ukuran 3x4 latar biru (CPP dan CPW)", status: "Belum", requiresDualCheck: true },
  { category: "Administrasi Persiapan Menikah", taskName: "Fotocopy KTP Wali Nikah", status: "Belum", requiresDualCheck: false },
  { category: "Administrasi Persiapan Menikah", taskName: "Fotocopy KTP 2 orang saksi Nikah", status: "Belum", requiresDualCheck: false },
  { category: "Administrasi Persiapan Menikah", taskName: "Keterangan sudah Vaksin TT", status: "Belum", requiresDualCheck: true },
  { category: "Administrasi Persiapan Menikah", taskName: "Daftar ke KUA", status: "Selesai", requiresDualCheck: false },
  { category: "Administrasi Persiapan Menikah", taskName: "Bimbingan Pra-nikah dari KUA", status: "Dalam Proses", requiresDualCheck: false },

  // TEMPAT
  { category: "Tempat", taskName: "Layout Venue", status: "Belum", requiresDualCheck: false },
  { category: "Tempat", taskName: "Decoration", status: "Belum", requiresDualCheck: false },

  // MAHAR DAN CINCIN
  { category: "Mahar dan Cincin", taskName: "Mahar", status: "Selesai", requiresDualCheck: false },
  { category: "Mahar dan Cincin", taskName: "Cincin lamaran dan nikah", status: "Selesai", requiresDualCheck: false },
  { category: "Mahar dan Cincin", taskName: "Seserahan", status: "Selesai", requiresDualCheck: false },
  { category: "Mahar dan Cincin", taskName: "Tempat cincin nikah dan mahar", status: "Belum", requiresDualCheck: false },
  { category: "Mahar dan Cincin", taskName: "Kotak Seserahan", status: "Selesai", requiresDualCheck: false },

  // MAKE UP DAN BUSANA
  { category: "Make up dan Busana", taskName: "Rias Pengantin", status: "Selesai", requiresDualCheck: false },
  { category: "Make up dan Busana", taskName: "Hijabdo", status: "Selesai", requiresDualCheck: false },
  { category: "Make up dan Busana", taskName: "Rias Orang Tua dan Besan", status: "Belum", requiresDualCheck: false },
  { category: "Make up dan Busana", taskName: "Rias Pager Ayu", status: "Belum", requiresDualCheck: false },
  { category: "Make up dan Busana", taskName: "Rias Buku Tamu", status: "Belum", requiresDualCheck: false },
  { category: "Make up dan Busana", taskName: "Baju Pengantin (pria dan wanita)", status: "Belum", requiresDualCheck: false },
  { category: "Make up dan Busana", taskName: "Baju Orang Tua Dan Besan", status: "Belum", requiresDualCheck: false },
  { category: "Make up dan Busana", taskName: "Baju Pager Ayu", status: "Belum", requiresDualCheck: false },
  { category: "Make up dan Busana", taskName: "Baju Buku Tamu", status: "Belum", requiresDualCheck: false },

  // DOKUMENTASI
  { category: "Dokumentasi", taskName: "Prewedding", status: "Belum", requiresDualCheck: false },
  { category: "Dokumentasi", taskName: "Foto Wedding", status: "Belum", requiresDualCheck: false },
  { category: "Dokumentasi", taskName: "Video Wedding", status: "Belum", requiresDualCheck: false },

  // MAKANAN
  { category: "Makanan", taskName: "Konsumsi Lamaran", status: "Belum", requiresDualCheck: false },
  { category: "Makanan", taskName: "Makana Untuk Acara Nikah", status: "Belum", requiresDualCheck: false },

  // UNDANGAN DAN SOUVENIR
  { category: "Undangan dan Souvenir", taskName: "Daftar Tamu Undangan", status: "Belum", requiresDualCheck: false },
  { category: "Undangan dan Souvenir", taskName: "Undangan Online", status: "Belum", requiresDualCheck: false },
  { category: "Undangan dan Souvenir", taskName: "Undagan Kertas", status: "Belum", requiresDualCheck: false },
  { category: "Undangan dan Souvenir", taskName: "Buku Tamu", status: "Belum", requiresDualCheck: false },
  { category: "Undangan dan Souvenir", taskName: "Souvenir", status: "Belum", requiresDualCheck: false },

  // ENTERTAINT
  { category: "Entertaint", taskName: "MC", status: "Belum", requiresDualCheck: false },
  { category: "Entertaint", taskName: "Sound System", status: "Belum", requiresDualCheck: false },
  { category: "Entertaint", taskName: "Hiburan", status: "Belum", requiresDualCheck: false },
  { category: "Entertaint", taskName: "Sambutan", status: "Belum", requiresDualCheck: false },

  // PERSIAPAN LAINNYA
  { category: "Persiapan Lainnya", taskName: "Rundown Acara", status: "Belum", requiresDualCheck: false },
  { category: "Persiapan Lainnya", taskName: "Susunan Panitia", status: "Belum", requiresDualCheck: false },
  { category: "Persiapan Lainnya", taskName: "Briefing Vendor", status: "Belum", requiresDualCheck: false },
  { category: "Persiapan Lainnya", taskName: "Briefing Keluarga", status: "Belum", requiresDualCheck: false },
  { category: "Persiapan Lainnya", taskName: "Izin Cuti Menikah", status: "Belum", requiresDualCheck: false },
  { category: "Persiapan Lainnya", taskName: "Transpotasi", status: "Belum", requiresDualCheck: false }
];

export const defaultChecklistItems: WeddingChecklistItem[] = defaultWeddingChecklist.map((item, idx) => {
  const isDone = item.status === "Selesai";
  return {
    id: `default-item-${idx + 1}`,
    name: item.taskName,
    category: item.category,
    budgetEstimate: 0,
    budgetActual: 0,
    isGroomChecked: isDone,
    isBrideChecked: isDone,
    status: item.status as "Belum" | "Dalam Proses" | "Selesai",
    requiresDualCheck: item.requiresDualCheck,
    isDone,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
});

const defaultMaharItems = [
  { name: "Emas Kawin Logam Mulia Antam", brand: "Antam", ecommerceLink: "https://www.tokopedia.com", price: 6500000, isJewelry: true, jewelryWeight: 5, jewelryPricePerGram: 1300000, isPurchased: false },
  { name: "Sajadah & Mukena Sutra Premium", brand: "Sajadah Silk", ecommerceLink: "https://shopee.co.id", price: 750000, isJewelry: false, jewelryWeight: 0, jewelryPricePerGram: 0, isPurchased: false },
  { name: "Paket Kosmetik & Skincare Sharia", brand: "Wardah", ecommerceLink: "https://shopee.co.id", price: 500000, isJewelry: false, jewelryWeight: 0, jewelryPricePerGram: 0, isPurchased: false }
];

const defaultVendors = [
  { name: "Gedung Sharia Convention", category: "Venue", contact: "081234567890", socialMedia: "@shariaconvention", notes: "Kapasitas 600 pax, sewa sudah termasuk AC dan kursi." },
  { name: "Berkah Catering Sharia", category: "Konsumsi", contact: "089876543210", socialMedia: "@berkahcatering", notes: "Sertifikasi Halal MUI, menu pondokan kambing guling recommended." }
];

const defaultGuests: Partial<GuestItem>[] = [
  { name: "Ustadz Hanan Attaki", relationship: "Keluarga" as const, invitationType: "Digital" as const, isRsvp: true, notes: "Diundang sebagai penceramah khutbah nikah." },
  { name: "Ahmad Subarjo & Keluarga", relationship: "Sahabat" as const, invitationType: "Cetak" as const, isRsvp: false, notes: "Teman dekat kuliah." }
];

// Helper to secure default/fallback collections inside LocalStorage
function getMockCollection<T>(key: string, defaults: Partial<T>[] = [], userId: string): T[] {
  const all = localStorage.getItem(`${key}_${userId}`);
  if (!all || JSON.parse(all).length === 0) {
    const formatted = defaults.map((item, idx) => ({
      ...item,
      id: `mock-id-${idx + 1}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    })) as T[];
    localStorage.setItem(`${key}_${userId}`, JSON.stringify(formatted));
    return formatted;
  }
  return JSON.parse(all);
}

function setMockCollection<T>(key: string, data: T[], userId: string) {
  localStorage.setItem(`${key}_${userId}`, JSON.stringify(data));
}

// User-friendly Custom Auth state listener
export function subscribeToAuth(callback: (user: any | null, profile: UserProfile | null) => void) {
  if (isMockMode) {
    const checkState = () => {
      const activeUserJson = localStorage.getItem("zawwaja_mock_active_user");
      if (activeUserJson) {
        const activeUser = JSON.parse(activeUserJson);
        const allProfilesStr = localStorage.getItem(MOCK_USERS_KEY) || "[]";
        const allProfiles: UserProfile[] = JSON.parse(allProfilesStr);
        let profile = allProfiles.find(p => p.uid === activeUser.uid) || null;
        
        // Bootstrapped admin check for mock users
        if (profile && profile.email === "erzeddd@gmail.com") {
          profile.role = "admin"; // Boostrapped
        }
        callback(activeUser, profile);
      } else {
        callback(null, null);
      }
    };
    checkState();
    
    // Listen for custom mock auth events
    window.addEventListener("mock-auth-changed", checkState);
    return () => {
      window.removeEventListener("mock-auth-changed", checkState);
    };
  } else {
    return onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        // Fetch User profile from Firestore
        const docRef = doc(db, "users", firebaseUser.uid);
        try {
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const profile = docSnap.data() as UserProfile;
            // Admin auto-assignment if matching email
            if (firebaseUser.email === "erzeddd@gmail.com" && profile.role !== "admin") {
              profile.role = "admin";
            }
            callback(firebaseUser, profile);
          } else {
            // Profile entry does not yet exist. Need onboarding or registration record
            callback(firebaseUser, null);
          }
        } catch (error) {
          console.error("Error reading profile", error);
          callback(firebaseUser, null);
        }
      } else {
        callback(null, null);
      }
    });
  }
}

// Sign Out Handler
export async function logoutUser() {
  if (isMockMode) {
    localStorage.removeItem("zawwaja_mock_active_user");
    window.dispatchEvent(new Event("mock-auth-changed"));
    return true;
  } else {
    await signOut(auth);
    return true;
  }
}

// Simulated WhatsApp Cloud API Alert webhook
async function triggerMockWhatsAppAlert(message: string, isActivated = false) {
  // Simulates a WhatsApp notification flow for administrative alerts
  console.log(`%c[WHATSAPP API SIMULATION] Sending warning out: "${message}"`, 
    "background: #128C7E; color: white; padding: 4px; border-radius: 4px; font-weight: bold;");
}

// Profile registration logic
export async function registerUserProfile(
  uid: string,
  email: string,
  fullName: string,
  partnerName: string,
  weddingDate: string,
  totalBudget: number,
  isAdminUser: boolean = false
): Promise<UserProfile> {
  const newProfile: UserProfile = {
    uid,
    email,
    fullName,
    partnerName,
    weddingDate,
    role: isAdminUser || email === "erzeddd@gmail.com" ? "admin" : "user",
    paymentStatus: isAdminUser || email === "erzeddd@gmail.com" ? "paid" : "pending",
    approvalStatus: isAdminUser || email === "erzeddd@gmail.com" ? "approved" : "pending",
    totalBudget,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  if (isMockMode) {
    const allProfilesStr = localStorage.getItem(MOCK_USERS_KEY) || "[]";
    const allProfiles: UserProfile[] = JSON.parse(allProfilesStr);
    
    // Remove if already exists with same UID
    const filtered = allProfiles.filter(p => p.uid !== uid);
    filtered.push(newProfile);
    localStorage.setItem(MOCK_USERS_KEY, JSON.stringify(filtered));
    
    localStorage.setItem("zawwaja_mock_active_user", JSON.stringify({ uid, email }));
    window.dispatchEvent(new Event("mock-auth-changed"));

    // Trigger WhatsApp notification for new payments
    triggerMockWhatsAppAlert(`Notifikasi Zawwaja.id: Calon Pengantin Baru ${fullName} mendaftar untuk tanggal akad ${weddingDate}. Menunggu verifikasi QRIS!`);
    
    return newProfile;
  } else {
    try {
      const docRef = doc(db, "users", uid);
      await setDoc(docRef, newProfile);
      
      triggerMockWhatsAppAlert(`Notifikasi Zawwaja.id: Calon Pengantin Baru ${fullName} mendaftar untuk tanggal akad ${weddingDate} via Live Firestore.`);
      return newProfile;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `users/${uid}`);
      throw error;
    }
  }
}

// Update payment status (QRIS)
export async function updatePaymentStatusToPaid(uid: string): Promise<void> {
  if (isMockMode) {
    const allProfilesStr = localStorage.getItem(MOCK_USERS_KEY) || "[]";
    const allProfiles: UserProfile[] = JSON.parse(allProfilesStr);
    const updated = allProfiles.map(p => {
      if (p.uid === uid) {
        return { ...p, paymentStatus: "paid" as const, updatedAt: new Date().toISOString() };
      }
      return p;
    });
    localStorage.setItem(MOCK_USERS_KEY, JSON.stringify(updated));
    
    // Force refresh the interface state
    window.dispatchEvent(new Event("mock-auth-changed"));

    // Admin message:
    const profile = updated.find(p => p.uid === uid);
    if (profile) {
      triggerMockWhatsAppAlert(`WhatsApp Admin: ${profile.fullName} telah selesai membayar Rp 25.000 via QRIS. Harap lakukan verifikasi aktivasi akun di Dashboard Admin!`);
    }
  } else {
    try {
      const docRef = doc(db, "users", uid);
      await updateDoc(docRef, { paymentStatus: "paid", updatedAt: new Date().toISOString() });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${uid}`);
    }
  }
}

// Approve account by Admin
export async function approveUserProfile(uid: string, approve: boolean): Promise<void> {
  const newStatus: ApprovalStatus = approve ? "approved" : "rejected";
  if (isMockMode) {
    const allProfilesStr = localStorage.getItem(MOCK_USERS_KEY) || "[]";
    const allProfiles: UserProfile[] = JSON.parse(allProfilesStr);
    const updated = allProfiles.map(p => {
      if (p.uid === uid) {
        return { 
          ...p, 
          approvalStatus: newStatus, 
          paymentStatus: approve ? "paid" as const : p.paymentStatus, 
          updatedAt: new Date().toISOString() 
        };
      }
      return p;
    });
    localStorage.setItem(MOCK_USERS_KEY, JSON.stringify(updated));
    
    window.dispatchEvent(new Event("mock-auth-changed"));

    const user = updated.find(p => p.uid === uid);
    if (user) {
      triggerMockWhatsAppAlert(`WhatsApp User (${user.fullName}): Akun Anda di Zawwaja.id telah aktif! Silakan masuk kembali untuk mulai menyusun pernikahan barakah Anda.`, true);
    }
  } else {
    try {
      const docRef = doc(db, "users", uid);
      await updateDoc(docRef, { 
        approvalStatus: newStatus, 
        paymentStatus: approve ? "paid" : "pending",
        updatedAt: new Date().toISOString() 
      });
      
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        triggerMockWhatsAppAlert(`WhatsApp User (${data.fullName}): Akun Anda di Zawwaja.id telah Aktif setelah verifikasi Live Firestore!`, true);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${uid}`);
    }
  }
}

// Read all profiles for Admin Dashboard
export async function getAllUserProfiles(): Promise<UserProfile[]> {
  if (isMockMode) {
    const allProfilesStr = localStorage.getItem(MOCK_USERS_KEY) || "[]";
    return JSON.parse(allProfilesStr);
  } else {
    try {
      const querySnapshot = await getDocs(collection(db, "users"));
      const list: UserProfile[] = [];
      querySnapshot.forEach((doc) => {
        list.push(doc.data() as UserProfile);
      });
      return list;
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, "users");
      return [];
    }
  }
}

// PROFILE UPDATE (e.g., target budget, names, wedding date)
export async function updateProfileSettings(uid: string, data: Partial<UserProfile>): Promise<void> {
  if (isMockMode) {
    const allProfilesStr = localStorage.getItem(MOCK_USERS_KEY) || "[]";
    const allProfiles: UserProfile[] = JSON.parse(allProfilesStr);
    const updated = allProfiles.map(p => {
      if (p.uid === uid) {
        return { ...p, ...data, updatedAt: new Date().toISOString() };
      }
      return p;
    });
    localStorage.setItem(MOCK_USERS_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event("mock-auth-changed"));
  } else {
    try {
      const docRef = doc(db, "users", uid);
      await updateDoc(docRef, { ...data, updatedAt: new Date().toISOString() });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${uid}`);
    }
  }
}


// --- 1. Wedding Checklist API ---

export async function getChecklistItems(userId: string): Promise<WeddingChecklistItem[]> {
  if (isMockMode) {
    return getMockCollection<WeddingChecklistItem>(MOCK_CHECKLIST_KEY, defaultChecklistItems, userId);
  } else {
    try {
      const qRef = collection(db, "users", userId, "checklist");
      const querySnapshot = await getDocs(qRef);
      const list: WeddingChecklistItem[] = [];
      querySnapshot.forEach((doc) => {
        list.push(doc.data() as WeddingChecklistItem);
      });
      
      if (list.length === 0 && defaultChecklistItems.length > 0) {
        // Automatically seed with defaultChecklistItems for Live Firestore
        const seededList: WeddingChecklistItem[] = [];
        for (let i = 0; i < defaultChecklistItems.length; i++) {
          const item = defaultChecklistItems[i];
          const newId = `db-item-${i + 1}-${Math.random().toString(36).substring(2, 6)}`;
          const fullItem: WeddingChecklistItem = {
            id: newId,
            name: item.name || "",
            category: item.category || "Persiapan Lainnya",
            budgetEstimate: item.budgetEstimate || 0,
            budgetActual: item.budgetActual || 0,
            isGroomChecked: item.isGroomChecked || false,
            isBrideChecked: item.isBrideChecked || false,
            status: item.status || "Belum",
            requiresDualCheck: item.requiresDualCheck || false,
            isDone: item.isDone || false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          await setDoc(doc(db, "users", userId, "checklist", newId), fullItem);
          seededList.push(fullItem);
        }
        return seededList;
      }
      
      // Sort by date or id to keep consistent
      return list.sort((a,b) => a.createdAt.localeCompare(b.createdAt));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, `users/${userId}/checklist`);
      return [];
    }
  }
}

export async function saveChecklistItem(userId: string, item: WeddingChecklistItem): Promise<void> {
  if (isMockMode) {
    const list = getMockCollection<WeddingChecklistItem>(MOCK_CHECKLIST_KEY, defaultChecklistItems, userId);
    const index = list.findIndex(i => i.id === item.id);
    if (index >= 0) {
      list[index] = { ...item, updatedAt: new Date().toISOString() };
    } else {
      list.push(item);
    }
    setMockCollection(MOCK_CHECKLIST_KEY, list, userId);
  } else {
    try {
      const docRef = doc(db, "users", userId, "checklist", item.id);
      await setDoc(docRef, item);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${userId}/checklist/${item.id}`);
    }
  }
}

export async function deleteChecklistItem(userId: string, itemId: string): Promise<void> {
  if (isMockMode) {
    const list = getMockCollection<WeddingChecklistItem>(MOCK_CHECKLIST_KEY, defaultChecklistItems, userId);
    const filtered = list.filter(i => i.id !== itemId);
    setMockCollection(MOCK_CHECKLIST_KEY, filtered, userId);
  } else {
    try {
      await deleteDoc(doc(db, "users", userId, "checklist", itemId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `users/${userId}/checklist/${itemId}`);
    }
  }
}

export async function resetChecklistToDefault(userId: string): Promise<WeddingChecklistItem[]> {
  if (isMockMode) {
    setMockCollection(MOCK_CHECKLIST_KEY, defaultChecklistItems, userId);
    return defaultChecklistItems;
  } else {
    try {
      const qRef = collection(db, "users", userId, "checklist");
      const querySnapshot = await getDocs(qRef);
      for (const docSnap of querySnapshot.docs) {
        await deleteDoc(doc(db, "users", userId, "checklist", docSnap.id));
      }
      
      const seededList: WeddingChecklistItem[] = [];
      for (let i = 0; i < defaultChecklistItems.length; i++) {
        const item = defaultChecklistItems[i];
        const newId = `db-item-${i + 1}-${Math.random().toString(36).substring(2, 6)}`;
        const fullItem: WeddingChecklistItem = {
          id: newId,
          name: item.name || "",
          category: item.category || "Persiapan Lainnya",
          budgetEstimate: item.budgetEstimate || 0,
          budgetActual: item.budgetActual || 0,
          isGroomChecked: item.isGroomChecked || false,
          isBrideChecked: item.isBrideChecked || false,
          status: item.status || "Belum",
          requiresDualCheck: item.requiresDualCheck || false,
          isDone: item.isDone || false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        await setDoc(doc(db, "users", userId, "checklist", newId), fullItem);
        seededList.push(fullItem);
      }
      return seededList;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${userId}/checklist/reset`);
      return defaultChecklistItems;
    }
  }
}


// --- 2. Vendor Management API ---

export async function getVendorItems(userId: string): Promise<VendorItem[]> {
  if (isMockMode) {
    return getMockCollection<VendorItem>(MOCK_VENDORS_KEY, defaultVendors, userId);
  } else {
    try {
      const querySnapshot = await getDocs(collection(db, "users", userId, "vendors"));
      const list: VendorItem[] = [];
      querySnapshot.forEach((doc) => {
        list.push(doc.data() as VendorItem);
      });
      return list.sort((a,b) => a.createdAt.localeCompare(b.createdAt));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, `users/${userId}/vendors`);
      return [];
    }
  }
}

export async function saveVendorItem(userId: string, vendor: VendorItem): Promise<void> {
  if (isMockMode) {
    const list = getMockCollection<VendorItem>(MOCK_VENDORS_KEY, defaultVendors, userId);
    const index = list.findIndex(v => v.id === vendor.id);
    if (index >= 0) {
      list[index] = { ...vendor, updatedAt: new Date().toISOString() };
    } else {
      list.push(vendor);
    }
    setMockCollection(MOCK_VENDORS_KEY, list, userId);
  } else {
    try {
      const docRef = doc(db, "users", userId, "vendors", vendor.id);
      await setDoc(docRef, vendor);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${userId}/vendors/${vendor.id}`);
    }
  }
}

export async function deleteVendorItem(userId: string, vendorId: string): Promise<void> {
  if (isMockMode) {
    const list = getMockCollection<VendorItem>(MOCK_VENDORS_KEY, defaultVendors, userId);
    const filtered = list.filter(v => v.id !== vendorId);
    setMockCollection(MOCK_VENDORS_KEY, filtered, userId);
  } else {
    try {
      await deleteDoc(doc(db, "users", userId, "vendors", vendorId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `users/${userId}/vendors/${vendorId}`);
    }
  }
}


// --- 3. Seserahan & Mahar API ---

export async function getMaharItems(userId: string): Promise<MaharItem[]> {
  if (isMockMode) {
    return getMockCollection<MaharItem>(MOCK_MAHAR_KEY, defaultMaharItems, userId);
  } else {
    try {
      const querySnapshot = await getDocs(collection(db, "users", userId, "mahar"));
      const list: MaharItem[] = [];
      querySnapshot.forEach((doc) => {
        list.push(doc.data() as MaharItem);
      });
      return list.sort((a,b) => a.createdAt.localeCompare(b.createdAt));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, `users/${userId}/mahar`);
      return [];
    }
  }
}

export async function saveMaharItem(userId: string, item: MaharItem): Promise<void> {
  if (isMockMode) {
    const list = getMockCollection<MaharItem>(MOCK_MAHAR_KEY, defaultMaharItems, userId);
    const index = list.findIndex(i => i.id === item.id);
    if (index >= 0) {
      list[index] = { ...item, updatedAt: new Date().toISOString() };
    } else {
      list.push(item);
    }
    setMockCollection(MOCK_MAHAR_KEY, list, userId);
  } else {
    try {
      const docRef = doc(db, "users", userId, "mahar", item.id);
      await setDoc(docRef, item);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${userId}/mahar/${item.id}`);
    }
  }
}

export async function deleteMaharItem(userId: string, itemId: string): Promise<void> {
  if (isMockMode) {
    const list = getMockCollection<MaharItem>(MOCK_MAHAR_KEY, defaultMaharItems, userId);
    const filtered = list.filter(i => i.id !== itemId);
    setMockCollection(MOCK_MAHAR_KEY, filtered, userId);
  } else {
    try {
      await deleteDoc(doc(db, "users", userId, "mahar", itemId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `users/${userId}/mahar/${itemId}`);
    }
  }
}


// --- 4. Guest List API ---

export async function getGuestItems(userId: string): Promise<GuestItem[]> {
  if (isMockMode) {
    return getMockCollection<GuestItem>(MOCK_GUESTS_KEY, defaultGuests, userId);
  } else {
    try {
      const querySnapshot = await getDocs(collection(db, "users", userId, "guests"));
      const list: GuestItem[] = [];
      querySnapshot.forEach((doc) => {
        list.push(doc.data() as GuestItem);
      });
      return list.sort((a,b) => a.createdAt.localeCompare(b.createdAt));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, `users/${userId}/guests`);
      return [];
    }
  }
}

export async function saveGuestItem(userId: string, guest: GuestItem): Promise<void> {
  if (isMockMode) {
    const list = getMockCollection<GuestItem>(MOCK_GUESTS_KEY, defaultGuests, userId);
    const index = list.findIndex(g => g.id === guest.id);
    if (index >= 0) {
      list[index] = { ...guest, updatedAt: new Date().toISOString() };
    } else {
      list.push(guest);
    }
    setMockCollection(MOCK_GUESTS_KEY, list, userId);
  } else {
    try {
      const docRef = doc(db, "users", userId, "guests", guest.id);
      await setDoc(docRef, guest);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${userId}/guests/${guest.id}`);
    }
  }
}

export async function deleteGuestItem(userId: string, guestId: string): Promise<void> {
  if (isMockMode) {
    const list = getMockCollection<GuestItem>(MOCK_GUESTS_KEY, defaultGuests, userId);
    const filtered = list.filter(g => g.id !== guestId);
    setMockCollection(MOCK_GUESTS_KEY, filtered, userId);
  } else {
    try {
      await deleteDoc(doc(db, "users", userId, "guests", guestId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `users/${userId}/guests/${guestId}`);
    }
  }
}

// Developer testing login hook
export async function loginAsAdminMock(): Promise<void> {
  const adminProfile: UserProfile = {
    uid: "admin-uid-erzeddd",
    email: "erzeddd@gmail.com",
    fullName: "Admin Zawwaja",
    partnerName: "-",
    weddingDate: "2026-12-31",
    role: "admin",
    paymentStatus: "paid",
    approvalStatus: "approved",
    totalBudget: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const allProfilesStr = localStorage.getItem(MOCK_USERS_KEY) || "[]";
  const allProfiles: UserProfile[] = JSON.parse(allProfilesStr);
  if (!allProfiles.some(p => p.uid === adminProfile.uid)) {
    allProfiles.push(adminProfile);
    localStorage.setItem(MOCK_USERS_KEY, JSON.stringify(allProfiles));
  }
  
  localStorage.setItem("zawwaja_mock_active_user", JSON.stringify({ 
    uid: adminProfile.uid, 
    email: adminProfile.email 
  }));
  window.dispatchEvent(new Event("mock-auth-changed"));
}

export async function simulateSocialLogin(email: string, fullName: string): Promise<any> {
  const uid = "user-" + Math.random().toString(36).substring(2, 9);
  localStorage.setItem("zawwaja_mock_active_user", JSON.stringify({ uid, email }));
  window.dispatchEvent(new Event("mock-auth-changed"));
  return { uid, email, displayName: fullName };
}

// True Email/Password Auth & Storage Integration:
export async function loginWithEmail(email: string, password: string): Promise<any> {
  if (isMockMode) {
    const passwordsStr = localStorage.getItem("zawwaja_mock_passwords") || "{}";
    const passwords = JSON.parse(passwordsStr);
    const lowerEmail = email.toLowerCase();
    
    // Check if password exists for this email
    const storedPassword = passwords[lowerEmail];
    if (storedPassword) {
      if (storedPassword !== password) {
        throw new Error("Kata sandi salah. Harap masukkan kata sandi yang sesuai.");
      }
    } else {
      // If no password saved yet for this existing or new mock account, initialize it with the one they just provided
      passwords[lowerEmail] = password;
      localStorage.setItem("zawwaja_mock_passwords", JSON.stringify(passwords));
    }

    const allProfilesStr = localStorage.getItem(MOCK_USERS_KEY) || "[]";
    const allProfiles: UserProfile[] = JSON.parse(allProfilesStr);
    const existing = allProfiles.find(p => p.email.toLowerCase() === lowerEmail);
    
    const uid = existing ? existing.uid : "mock-user-" + email.replace(/[^a-zA-Z0-9]/g, "");
    const fakeUser = { uid, email };
    
    localStorage.setItem("zawwaja_mock_active_user", JSON.stringify(fakeUser));
    window.dispatchEvent(new Event("mock-auth-changed"));
    return fakeUser;
  } else {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return userCredential.user;
    } catch (error: any) {
      console.error("Firebase Login error:", error);
      throw new Error(error.message || "Gagal masuk. Periksa kembali email dan kata sandi Anda.");
    }
  }
}

export async function signUpWithEmail(email: string, password: string): Promise<any> {
  if (isMockMode) {
    const passwordsStr = localStorage.getItem("zawwaja_mock_passwords") || "{}";
    const passwords = JSON.parse(passwordsStr);
    const lowerEmail = email.toLowerCase();
    
    if (passwords[lowerEmail]) {
      throw new Error("Email ini sudah terdaftar. Silakan masuk menggunakan kata sandi Anda.");
    }
    
    passwords[lowerEmail] = password;
    localStorage.setItem("zawwaja_mock_passwords", JSON.stringify(passwords));

    const uid = "mock-user-" + Math.random().toString(36).substring(2, 9);
    const fakeUser = { uid, email };
    localStorage.setItem("zawwaja_mock_active_user", JSON.stringify(fakeUser));
    window.dispatchEvent(new Event("mock-auth-changed"));
    return fakeUser;
  } else {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      return userCredential.user;
    } catch (error: any) {
      console.error("Firebase Signup error:", error);
      throw new Error(error.message || "Gagal mendaftar. Akun mungkin sudah terdaftar atau kata sandi tidak valid.");
    }
  }
}

export async function signUpOrSignInWithGoogle(): Promise<any> {
  if (isMockMode) {
    const uid = "mock-google-" + Math.random().toString(36).substring(2, 9);
    const email = "google.pengantin@gmail.com";
    const fakeUser = { uid, email, displayName: "Google Pengantin" };
    localStorage.setItem("zawwaja_mock_active_user", JSON.stringify(fakeUser));
    window.dispatchEvent(new Event("mock-auth-changed"));
    return fakeUser;
  } else {
    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      return userCredential.user;
    } catch (error: any) {
      console.error("Firebase Google Auth error:", error);
      throw new Error(error.message || "Gagal masuk menggunakan Google.");
    }
  }
}

export async function initializeEmptyProfile(uid: string, email: string, displayName?: string): Promise<UserProfile> {
  let existingProfile: UserProfile | null = null;
  
  if (isMockMode) {
    const allProfilesStr = localStorage.getItem(MOCK_USERS_KEY) || "[]";
    const allProfiles: UserProfile[] = JSON.parse(allProfilesStr);
    existingProfile = allProfiles.find(p => p.uid === uid) || null;
  } else {
    try {
      const docRef = doc(db, "users", uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        existingProfile = docSnap.data() as UserProfile;
      }
    } catch (e) {
      console.error("Error reading profile details to check existence", e);
    }
  }

  if (existingProfile) {
    return existingProfile;
  }

  // Create skeleton empty profile
  const newProfile: UserProfile = {
    uid,
    email,
    fullName: "", // Marked empty so WelcomeModal is triggered in the Dashboard
    partnerName: "",
    weddingDate: "",
    role: email === "erzeddd@gmail.com" ? "admin" : "user",
    paymentStatus: email === "erzeddd@gmail.com" ? "paid" : "pending",
    approvalStatus: email === "erzeddd@gmail.com" ? "approved" : "pending",
    totalBudget: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  if (isMockMode) {
    const allProfilesStr = localStorage.getItem(MOCK_USERS_KEY) || "[]";
    const allProfiles: UserProfile[] = JSON.parse(allProfilesStr);
    allProfiles.push(newProfile);
    localStorage.setItem(MOCK_USERS_KEY, JSON.stringify(allProfiles));
    window.dispatchEvent(new Event("mock-auth-changed"));
  } else {
    try {
      const docRef = doc(db, "users", uid);
      await setDoc(docRef, newProfile);
    } catch (error) {
      console.error("Error setting skeleton profile document:", error);
    }
  }

  return newProfile;
}

export async function uploadPaymentProof(userId: string, file: File): Promise<string> {
  if (isMockMode) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const dummyUrl = "https://images.unsplash.com/photo-1607863680198-23d4b2565df0?q=80&w=600&auto=format&fit=crop";
        
        // Update mock record with mock payment details
        const allProfilesStr = localStorage.getItem(MOCK_USERS_KEY) || "[]";
        const allProfiles: UserProfile[] = JSON.parse(allProfilesStr);
        const updated = allProfiles.map(p => {
          if (p.uid === userId) {
            return { 
              ...p, 
              paymentStatus: "paid" as const, 
              paymentProofUrl: dummyUrl,
              updatedAt: new Date().toISOString() 
            };
          }
          return p;
        });
        localStorage.setItem(MOCK_USERS_KEY, JSON.stringify(updated));
        window.dispatchEvent(new Event("mock-auth-changed"));
        
        resolve(dummyUrl);
      }, 1000);
    });
  } else {
    try {
      const fileExtension = file.name.split('.').pop() || 'png';
      const storageRef = ref(storage, `payment_proofs/${userId}/proof_${Date.now()}.${fileExtension}`);
      
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      // Update User profile document directly in Firestore
      const docRef = doc(db, "users", userId);
      await updateDoc(docRef, { 
        paymentProofUrl: downloadURL,
        paymentStatus: "paid",
        updatedAt: new Date().toISOString() 
      });
      
      return downloadURL;
    } catch (error: any) {
      console.error("Firebase Storage upload error:", error);
      throw new Error(error.message || "Gagal mengunggah bukti transfer/pembayaran QRIS.");
    }
  }
}

const MOCK_FILES_PREFIX = "zawwaja_mock_files_";

export async function getUserFiles(userId: string): Promise<UserFile[]> {
  if (isMockMode) {
    const listStr = localStorage.getItem(MOCK_FILES_PREFIX + userId) || "[]";
    return JSON.parse(listStr);
  } else {
    try {
      const qRef = collection(db, "users", userId, "files");
      const querySnapshot = await getDocs(qRef);
      const list: UserFile[] = [];
      querySnapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() } as UserFile);
      });
      return list;
    } catch (error) {
      console.error("Gagal mengambil daftar berkas:", error);
      return [];
    }
  }
}

export async function uploadUserFile(userId: string, file: File): Promise<UserFile> {
  if (isMockMode) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const url = reader.result as string;
        const newFile: UserFile = {
          id: "mock-file-" + Math.random().toString(36).substring(2, 9),
          name: file.name,
          url: url,
          type: file.type,
          size: file.size,
          createdAt: new Date().toISOString()
        };
        const curListStr = localStorage.getItem(MOCK_FILES_PREFIX + userId) || "[]";
        const curList = JSON.parse(curListStr);
        curList.push(newFile);
        localStorage.setItem(MOCK_FILES_PREFIX + userId, JSON.stringify(curList));
        resolve(newFile);
      };
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  } else {
    try {
      const fileExtension = file.name.split('.').pop() || 'png';
      const storageRef = ref(storage, `users/${userId}/files/file_${Date.now()}.${fileExtension}`);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      const fileId = "file-" + Math.random().toString(36).substring(2, 9);
      const fileDoc: UserFile = {
        id: fileId,
        name: file.name,
        url: downloadURL,
        type: file.type,
        size: file.size,
        createdAt: new Date().toISOString()
      };
      
      await setDoc(doc(db, "users", userId, "files", fileId), fileDoc);
      return fileDoc;
    } catch (error: any) {
      console.error("Firebase Storage file upload error:", error);
      throw new Error(error.message || "Gagal mengunggah berkas pernikahan.");
    }
  }
}

export async function deleteUserFile(userId: string, fileId: string): Promise<void> {
  if (isMockMode) {
    const listStr = localStorage.getItem(MOCK_FILES_PREFIX + userId) || "[]";
    const list: UserFile[] = JSON.parse(listStr);
    const updated = list.filter(f => f.id !== fileId);
    localStorage.setItem(MOCK_FILES_PREFIX + userId, JSON.stringify(updated));
  } else {
    try {
      await deleteDoc(doc(db, "users", userId, "files", fileId));
    } catch (error: any) {
      console.error("Failed to delete file from Firestore:", error);
      throw new Error(error.message || "Gagal menghapus berkas.");
    }
  }
}


