-- Allow admins to insert profiles for other users
CREATE POLICY "Admins can insert profiles"
ON public.profiles
FOR INSERT
WITH CHECK (is_admin(auth.uid()));

-- Allow admins to update any profile
CREATE POLICY "Admins can update profiles"
ON public.profiles
FOR UPDATE
USING (is_admin(auth.uid()));

-- Allow admins to delete profiles
CREATE POLICY "Admins can delete profiles"
ON public.profiles
FOR DELETE
USING (is_admin(auth.uid()));