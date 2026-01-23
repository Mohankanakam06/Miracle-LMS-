ALTER TABLE public.courses ADD COLUMN "units" jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.courses ADD COLUMN "regulation" text;
