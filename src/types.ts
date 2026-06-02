export type UserRole = "user" | "admin";
export type PaymentStatus = "pending" | "paid";
export type ApprovalStatus = "pending" | "approved" | "rejected";

export interface UserProfile {
  uid: string;
  email: string;
  fullName: string;
  partnerName: string;
  weddingDate: string; // YYYY-MM-DD
  role: UserRole;
  paymentStatus: PaymentStatus;
  approvalStatus: ApprovalStatus;
  totalBudget: number; // Target budget in IDR
  paymentProofUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WeddingChecklistItem {
  id: string;
  name: string;
  category: string; // e.g., "Venue", "Catering", "Rias & Busana", "Dokumentasi", "Undangan"
  budgetEstimate: number;
  budgetActual: number;
  isGroomChecked: boolean; // Checked by Calon Pengantin Pria (CPP)
  isBrideChecked: boolean;  // Checked by Calon Pengantin Wanita (CPW)
  status: "Belum" | "Dalam Proses" | "Selesai"; // 3-state progress
  requiresDualCheck: boolean; // whether individual CPP/CPW checkbox is active
  isDone: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface VendorItem {
  id: string;
  name: string;
  category: string; // e.g., "Catering", "MUA", "Fotografer", "Dekorasi"
  contact: string;   // WhatsApp/Phone
  socialMedia: string; // @instagram or link
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface MaharItem {
  id: string;
  name: string; // e.g., "Set Perhiasan Emas", "Al-Qur'an & Sajadah"
  brand: string;
  ecommerceLink: string;
  price: number;
  isJewelry: boolean;
  jewelryWeight: number; // in grams
  jewelryPricePerGram: number; // price per gram in IDR
  isPurchased: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GuestItem {
  id: string;
  name: string;
  relationship: "Keluarga" | "Sahabat" | "Rekan Kerja" | "Tetangga" | "Lainnya";
  invitationType: "Digital" | "Cetak";
  isRsvp: boolean;
  notes?: string;
  phoneNumber?: string;
  address?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserFile {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
  createdAt: string;
}

