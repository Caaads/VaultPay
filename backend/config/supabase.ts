import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

export const supabaseUrl = process.env.SUPABASE_URL || '';
export const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error("FATAL CONFIGURATION ERROR: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables are mandatory.");
  process.exit(1);
}

export interface Transaction {
  id: string;
  sender: string;
  receiver: string;
  amount: number;
  token: string;
  memo: string;
  created_at: string;
  receiver_account?: string;
  user_id?: string | null;
}

// Initialize official database client
export const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});
