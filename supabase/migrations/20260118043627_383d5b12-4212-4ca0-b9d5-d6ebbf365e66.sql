-- Add roll_number column to profiles for student identification
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS roll_number text UNIQUE;