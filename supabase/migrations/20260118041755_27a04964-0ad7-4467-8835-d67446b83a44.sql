-- Add semester and regulation columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS semester text,
ADD COLUMN IF NOT EXISTS regulation text;