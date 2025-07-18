
-- Adicionar colunas de contato de emergência se não existirem
DO $$
BEGIN
    -- Adicionar emergency_contact_name se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'beneficiaries' 
                   AND column_name = 'emergency_contact_name') THEN
        ALTER TABLE beneficiaries ADD COLUMN emergency_contact_name text;
    END IF;
    
    -- Adicionar emergency_contact_phone se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'beneficiaries' 
                   AND column_name = 'emergency_contact_phone') THEN
        ALTER TABLE beneficiaries ADD COLUMN emergency_contact_phone text;
    END IF;
END$$;
