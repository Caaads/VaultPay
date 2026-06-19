-- WARNING: This drops your active transactions table to perform a pristine relational sync.
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 1. Define 'users' directory
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  pin TEXT NOT NULL,
  account_number TEXT UNIQUE NOT NULL,
  balance NUMERIC(15, 2) NOT NULL DEFAULT 10000.00,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Define 'transactions' ledger linked with direct Foreign Key cascade bounds
CREATE TABLE transactions (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  receiver_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  sender TEXT NOT NULL,
  receiver TEXT NOT NULL,
  amount NUMERIC(15, 2) NOT NULL,
  token TEXT NOT NULL,
  memo TEXT,
  receiver_account TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Speed up user historical ledger query retrievals 
CREATE INDEX idx_transactions_user_id ON transactions(user_id);

-- 4. Sync auth.users to public.users on registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, first_name, last_name, email, phone, password, pin, account_number, balance)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'first_name', ''),
    COALESCE(new.raw_user_meta_data->>'last_name', ''),
    new.email,
    COALESCE(new.raw_user_meta_data->>'phone', ''),
    'SUPABASE_AUTH', -- Password is encrypted & managed by auth.users
    COALESCE(new.raw_user_meta_data->>'pin', '1234'),
    COALESCE(new.raw_user_meta_data->>'account_number', ''),
    COALESCE((new.raw_user_meta_data->>'balance')::NUMERIC, 10000.00)
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Bind trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 5. Row-Level Security (RLS) configuration
-- Disabling RLS allows the auth sync triggers and the backend server (using service role key) to execute database queries freely.
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions DISABLE ROW LEVEL SECURITY;
