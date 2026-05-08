-- 1) Adicionar novo papel 'viewer' (somente leitura) ao enum app_role
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'viewer';