
-- Migration para adicionar campos de contato de emergência
ALTER TABLE beneficiaries ADD COLUMN IF NOT EXISTS emergency_contact_name TEXT;
ALTER TABLE beneficiaries ADD COLUMN IF NOT EXISTS emergency_contact_phone TEXT;
