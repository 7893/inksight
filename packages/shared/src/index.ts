// Email categories
export type EmailCategory = 'newsletter' | 'financial' | 'travel' | 'personal' | 'spam';

// Processing status
export type ProcessingStatus = 'pending' | 'processing' | 'completed' | 'failed';

// User interface
export interface User {
  id: string;
  email: string;
  displayName?: string;
  tonePreference: string;
  createdAt: number;
  updatedAt: number;
}

// Email interface
export interface Email {
  id: string;
  userId: string;
  messageId: string;
  subject?: string;
  fromAddress: string;
  toAddress: string;
  receivedDate: number;
  category?: EmailCategory;
  r2Key: string;
  processedAt?: number;
  status: ProcessingStatus;
  createdAt: number;
}

// Financial transaction
export interface FinancialTransaction {
  id: string;
  userId: string;
  emailId: string;
  merchant: string;
  amount: number;
  currency: string;
  transactionDate: number;
  category?: string;
  description?: string;
  createdAt: number;
}

// Trip booking
export interface Trip {
  id: string;
  userId: string;
  emailId: string;
  destination: string;
  departureDate: number;
  returnDate?: number;
  bookingRef?: string;
  carrier?: string;
  tripType: 'flight' | 'hotel' | 'train' | 'car' | 'other';
  createdAt: number;
}

// Newsletter item
export interface NewsItem {
  id: string;
  userId: string;
  emailId: string;
  source: string;
  title: string;
  summary?: string;
  bulletPoints?: string[];
  url?: string;
  createdAt: number;
}

// AI extraction result
export interface ExtractionResult {
  category: EmailCategory;
  financial?: Partial<FinancialTransaction>;
  trip?: Partial<Trip>;
  news?: Partial<NewsItem>;
  confidence: number;
}
