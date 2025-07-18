
-- Adicionar colunas de contato de emergência se não existirem
DO $$
BEGIN
    -- Adicionar emergency_contact_name se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'beneficiaries' 
                   AND column_name = 'emergency_contact_name') THEN
        ALTER TABLE beneficiaries ADD COLUMN emergency_contact_name text;
        RAISE NOTICE 'Coluna emergency_contact_name adicionada com sucesso';
    ELSE
        RAISE NOTICE 'Coluna emergency_contact_name já existe';
    END IF;
    
    -- Adicionar emergency_contact_phone se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'beneficiaries' 
                   AND column_name = 'emergency_contact_phone') THEN
        ALTER TABLE beneficiaries ADD COLUMN emergency_contact_phone text;
        RAISE NOTICE 'Coluna emergency_contact_phone adicionada com sucesso';
    ELSE
        RAISE NOTICE 'Coluna emergency_contact_phone já existe';
    END IF;
END$$;
