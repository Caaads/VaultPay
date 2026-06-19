import { Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import { supabase, supabaseUrl, supabaseServiceRoleKey } from '../config/supabase.js';
export async function loginUser(req: Request, res: Response): Promise<void> {
  const { phone, password, pin } = req.body;
  if (!phone || !password || !pin) {
    res.status(400).json({ error: 'Phone number or Email, password, and security PIN are all mandatory.' });
    return;
  }



  try {
    const isEmailInput = phone.includes('@');
    let email = '';

    if (isEmailInput) {
      email = phone.trim().toLowerCase();
    } else {
      // Find email associated with the phone
      const { data: profile, error: profileErr } = await supabase!
        .from('users')
        .select('email')
        .eq('phone', phone)
        .maybeSingle();

      if (profileErr || !profile) {
        res.status(401).json({ error: 'Validation failed: No account matches this phone number.' });
        return;
      }
      email = profile.email;
    }

    // Authenticate with Supabase Auth using a stateless temporary client instance to prevent session pollution
    const authClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });
    const { data: authData, error: authErr } = await authClient.auth.signInWithPassword({
      email,
      password
    });

    if (authErr) {
      if (authErr.message && authErr.message.toLowerCase().includes('confirm')) {
        res.status(401).json({ error: 'Email confirmation required. Please check your inbox for a verification link.' });
        return;
      }
      res.status(401).json({ error: `Authentication failed: ${authErr.message}` });
      return;
    }

    // Load full user profile
    const { data: userProfile, error: dbErr } = await supabase!
      .from('users')
      .select('*')
      .eq('id', authData.user!.id)
      .single();

    if (dbErr || !userProfile) {
      res.status(401).json({ error: 'Validation failed: User profile not synced yet.' });
      return;
    }

    if (userProfile.pin !== pin) {
      res.status(401).json({ error: 'Validation failed: Invalid security PIN credentials.' });
      return;
    }

    res.status(200).json({
      success: true,
      user: {
        id: userProfile.id,
        firstName: userProfile.first_name,
        lastName: userProfile.last_name,
        email: userProfile.email,
        phone: userProfile.phone,
        accountNumber: userProfile.account_number,
        balance: parseFloat(userProfile.balance)
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: `Fintech secure directory lookup error: ${err.message}` });
  }
}

export async function registerUser(req: Request, res: Response): Promise<void> {
  const { firstName, lastName, email, phone, password, pin, accountNumber, balance } = req.body;
  if (!firstName || !lastName || !email || !phone || !password || !pin) {
    res.status(400).json({ error: 'First Name, Last Name, Email, Phone, Password, and PIN are mandatory.' });
    return;
  }



  try {
    // Check if phone or email already registered in public.users
    const { data: existingUser } = await supabase!
      .from('users')
      .select('id')
      .or(`phone.eq.${phone},email.eq.${email}`)
      .maybeSingle();

    if (existingUser) {
      res.status(400).json({ error: 'Registration failed: Phone number or Email already linked to an active account.' });
      return;
    }

    const accountNumberVal = accountNumber || `${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(10 + Math.random() * 90)}`;
    const balanceVal = balance || 10000.00;

    // Perform sign up using a stateless temporary client instance
    const authClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });
    const { data: authData, error: authErr } = await authClient.auth.signUp({
      email: email.trim(),
      password: password,
      options: {
        data: {
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          phone: phone,
          pin: pin,
          account_number: accountNumberVal,
          balance: balanceVal
        }
      }
    });

    if (authErr) {
      throw new Error(authErr.message);
    }

    res.status(201).json({
      success: true,
      message: 'Registration successful! A verification link has been sent to your email. Please confirm it before signing in.'
    });
  } catch (err: any) {
    res.status(500).json({ error: `Fintech secure registry creation error: ${err.message}` });
  }
}

export async function updateProfile(req: Request, res: Response): Promise<void> {
  const { id, firstName, lastName, email, phone, accountNumber, balance } = req.body;
  if (!id) {
    res.status(400).json({ error: 'Active user database ID is required for updating account.' });
    return;
  }



  try {
    const updatePayload: any = {};
    if (firstName !== undefined) updatePayload.first_name = firstName.trim();
    if (lastName !== undefined) updatePayload.last_name = lastName.trim();
    if (email !== undefined) updatePayload.email = email.trim();
    if (phone !== undefined) updatePayload.phone = phone;
    if (accountNumber !== undefined) updatePayload.account_number = accountNumber;
    if (balance !== undefined) updatePayload.balance = balance;

    const { data, error } = await supabase!
      .from('users')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    res.status(200).json({
      success: true,
      user: {
        id: data.id,
        firstName: data.first_name,
        lastName: data.last_name,
        email: data.email,
        phone: data.phone,
        accountNumber: data.account_number,
        balance: parseFloat(data.balance)
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: `Secure profile registry synchronizer error: ${err.message}` });
  }
}
