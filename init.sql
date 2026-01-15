-- ============================================
-- WALLET & REMITTANCE MINI-CORE DATABASE
-- PostgreSQL 15
-- ============================================

-- Extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- ENUMS
-- ============================================

-- Tipo de moneda
CREATE TYPE currency_type AS ENUM ('CLP', 'PEN');

-- Estado de transacción
CREATE TYPE transaction_status AS ENUM ('pending', 'completed', 'failed', 'cancelled');

-- Tipo de transacción
CREATE TYPE transaction_type AS ENUM ('deposit', 'withdrawal', 'remittance_send', 'remittance_receive', 'fee');

-- Estado de remesa
CREATE TYPE remittance_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'cancelled');

-- Estado de cotización
CREATE TYPE quote_status AS ENUM ('active', 'expired', 'used', 'cancelled');

-- ============================================
-- TABLA: users
-- ============================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    country_code VARCHAR(3) NOT NULL DEFAULT 'CL',
    document_type VARCHAR(20),
    document_number VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Índices para users
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_document ON users(document_type, document_number);
CREATE INDEX idx_users_created_at ON users(created_at);

-- ============================================
-- TABLA: wallets
-- ============================================
CREATE TABLE wallets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    currency currency_type NOT NULL,
    balance DECIMAL(20, 4) NOT NULL DEFAULT 0.0000,
    available_balance DECIMAL(20, 4) NOT NULL DEFAULT 0.0000,
    held_balance DECIMAL(20, 4) NOT NULL DEFAULT 0.0000,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT balance_non_negative CHECK (balance >= 0),
    CONSTRAINT available_balance_non_negative CHECK (available_balance >= 0),
    CONSTRAINT held_balance_non_negative CHECK (held_balance >= 0),
    CONSTRAINT balance_consistency CHECK (balance = available_balance + held_balance),
    CONSTRAINT unique_user_currency UNIQUE (user_id, currency)
);

-- Índices para wallets
CREATE INDEX idx_wallets_user_id ON wallets(user_id);
CREATE INDEX idx_wallets_currency ON wallets(currency);
CREATE INDEX idx_wallets_user_currency ON wallets(user_id, currency);

-- ============================================
-- TABLA: transactions
-- ============================================
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wallet_id UUID NOT NULL REFERENCES wallets(id) ON DELETE RESTRICT,
    type transaction_type NOT NULL,
    amount DECIMAL(20, 4) NOT NULL,
    currency currency_type NOT NULL,
    balance_before DECIMAL(20, 4) NOT NULL,
    balance_after DECIMAL(20, 4) NOT NULL,
    status transaction_status NOT NULL DEFAULT 'pending',
    description TEXT,
    metadata JSONB,
    reference_id UUID,
    idempotency_key UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE,

    CONSTRAINT amount_positive CHECK (amount > 0)
);

-- Índices para transactions
CREATE INDEX idx_transactions_wallet_id ON transactions(wallet_id);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_created_at ON transactions(created_at DESC);
CREATE INDEX idx_transactions_reference_id ON transactions(reference_id);
CREATE INDEX idx_transactions_idempotency_key ON transactions(idempotency_key);
CREATE INDEX idx_transactions_metadata ON transactions USING gin(metadata);

-- ============================================
-- TABLA: exchange_rates
-- ============================================
CREATE TABLE exchange_rates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    from_currency currency_type NOT NULL,
    to_currency currency_type NOT NULL,
    rate DECIMAL(20, 10) NOT NULL,
    inverse_rate DECIMAL(20, 10) NOT NULL,
    source VARCHAR(100) DEFAULT 'manual',
    is_active BOOLEAN DEFAULT true,
    valid_from TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    valid_until TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT rate_positive CHECK (rate > 0),
    CONSTRAINT inverse_rate_positive CHECK (inverse_rate > 0),
    CONSTRAINT different_currencies CHECK (from_currency != to_currency)
);

-- Índices para exchange_rates
CREATE INDEX idx_exchange_rates_currencies ON exchange_rates(from_currency, to_currency);
CREATE INDEX idx_exchange_rates_active ON exchange_rates(is_active);
CREATE INDEX idx_exchange_rates_valid_from ON exchange_rates(valid_from DESC);

-- ============================================
-- TABLA: quotes
-- ============================================
CREATE TABLE quotes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    from_currency currency_type NOT NULL,
    to_currency currency_type NOT NULL,
    send_amount DECIMAL(20, 4) NOT NULL,
    exchange_rate DECIMAL(20, 10) NOT NULL,
    fee_percentage DECIMAL(5, 2) NOT NULL,
    fee_amount DECIMAL(20, 4) NOT NULL,
    receive_amount DECIMAL(20, 4) NOT NULL,
    total_amount DECIMAL(20, 4) NOT NULL,
    status quote_status NOT NULL DEFAULT 'active',
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    used_at TIMESTAMP WITH TIME ZONE,

    CONSTRAINT send_amount_positive CHECK (send_amount > 0),
    CONSTRAINT exchange_rate_positive CHECK (exchange_rate > 0),
    CONSTRAINT fee_percentage_valid CHECK (fee_percentage >= 0 AND fee_percentage <= 100),
    CONSTRAINT fee_amount_non_negative CHECK (fee_amount >= 0),
    CONSTRAINT receive_amount_positive CHECK (receive_amount > 0),
    CONSTRAINT total_amount_positive CHECK (total_amount > 0)
);

-- Índices para quotes
CREATE INDEX idx_quotes_user_id ON quotes(user_id);
CREATE INDEX idx_quotes_status ON quotes(status);
CREATE INDEX idx_quotes_expires_at ON quotes(expires_at);
CREATE INDEX idx_quotes_created_at ON quotes(created_at DESC);

-- ============================================
-- TABLA: remittances
-- ============================================
CREATE TABLE remittances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quote_id UUID NOT NULL REFERENCES quotes(id) ON DELETE RESTRICT,
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    sender_wallet_id UUID NOT NULL REFERENCES wallets(id) ON DELETE RESTRICT,
    recipient_email VARCHAR(255) NOT NULL,
    recipient_name VARCHAR(255) NOT NULL,
    recipient_phone VARCHAR(20),
    from_currency currency_type NOT NULL,
    to_currency currency_type NOT NULL,
    send_amount DECIMAL(20, 4) NOT NULL,
    exchange_rate DECIMAL(20, 10) NOT NULL,
    fee_amount DECIMAL(20, 4) NOT NULL,
    receive_amount DECIMAL(20, 4) NOT NULL,
    total_amount DECIMAL(20, 4) NOT NULL,
    status remittance_status NOT NULL DEFAULT 'pending',
    external_provider_id VARCHAR(255),
    external_provider_status VARCHAR(100),
    external_provider_response JSONB,
    error_message TEXT,
    idempotency_key UUID UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,

    CONSTRAINT send_amount_positive CHECK (send_amount > 0),
    CONSTRAINT exchange_rate_positive CHECK (exchange_rate > 0),
    CONSTRAINT fee_amount_non_negative CHECK (fee_amount >= 0),
    CONSTRAINT receive_amount_positive CHECK (receive_amount > 0),
    CONSTRAINT total_amount_positive CHECK (total_amount > 0)
);

-- Índices para remittances
CREATE INDEX idx_remittances_quote_id ON remittances(quote_id);
CREATE INDEX idx_remittances_sender_id ON remittances(sender_id);
CREATE INDEX idx_remittances_sender_wallet_id ON remittances(sender_wallet_id);
CREATE INDEX idx_remittances_status ON remittances(status);
CREATE INDEX idx_remittances_created_at ON remittances(created_at DESC);
CREATE INDEX idx_remittances_idempotency_key ON remittances(idempotency_key);
CREATE INDEX idx_remittances_external_provider_id ON remittances(external_provider_id);

-- ============================================
-- TABLA: idempotency_keys
-- ============================================
CREATE TABLE idempotency_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    idempotency_key UUID UNIQUE NOT NULL,
    endpoint VARCHAR(255) NOT NULL,
    request_hash VARCHAR(64) NOT NULL,
    response_status INTEGER,
    response_body JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,

    CONSTRAINT unique_endpoint_key UNIQUE (endpoint, idempotency_key)
);

-- Índices para idempotency_keys
CREATE INDEX idx_idempotency_keys_key ON idempotency_keys(idempotency_key);
CREATE INDEX idx_idempotency_keys_expires_at ON idempotency_keys(expires_at);
CREATE INDEX idx_idempotency_keys_created_at ON idempotency_keys(created_at);

-- ============================================
-- TABLA: audit_logs
-- ============================================
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_name VARCHAR(100) NOT NULL,
    record_id UUID NOT NULL,
    operation VARCHAR(20) NOT NULL,
    old_data JSONB,
    new_data JSONB,
    changed_by UUID,
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ip_address INET,
    user_agent TEXT
);

-- Índices para audit_logs
CREATE INDEX idx_audit_logs_table_name ON audit_logs(table_name);
CREATE INDEX idx_audit_logs_record_id ON audit_logs(record_id);
CREATE INDEX idx_audit_logs_operation ON audit_logs(operation);
CREATE INDEX idx_audit_logs_changed_at ON audit_logs(changed_at DESC);

-- ============================================
-- FUNCIONES Y TRIGGERS
-- ============================================

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_wallets_updated_at BEFORE UPDATE ON wallets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Función para auditoría automática
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'DELETE') THEN
        INSERT INTO audit_logs (table_name, record_id, operation, old_data)
        VALUES (TG_TABLE_NAME, OLD.id, 'DELETE', row_to_json(OLD));
        RETURN OLD;
    ELSIF (TG_OP = 'UPDATE') THEN
        INSERT INTO audit_logs (table_name, record_id, operation, old_data, new_data)
        VALUES (TG_TABLE_NAME, NEW.id, 'UPDATE', row_to_json(OLD), row_to_json(NEW));
        RETURN NEW;
    ELSIF (TG_OP = 'INSERT') THEN
        INSERT INTO audit_logs (table_name, record_id, operation, new_data)
        VALUES (TG_TABLE_NAME, NEW.id, 'INSERT', row_to_json(NEW));
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Triggers de auditoría para tablas críticas
CREATE TRIGGER audit_wallets AFTER INSERT OR UPDATE OR DELETE ON wallets
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_transactions AFTER INSERT OR UPDATE OR DELETE ON transactions
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_remittances AFTER INSERT OR UPDATE OR DELETE ON remittances
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- ============================================
-- FUNCIÓN: Limpiar claves de idempotencia expiradas
-- ============================================
CREATE OR REPLACE FUNCTION cleanup_expired_idempotency_keys()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM idempotency_keys
    WHERE expires_at < CURRENT_TIMESTAMP;

    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- FUNCIÓN: Obtener tasa de cambio activa
-- ============================================
CREATE OR REPLACE FUNCTION get_active_exchange_rate(
    p_from_currency currency_type,
    p_to_currency currency_type
)
RETURNS DECIMAL(20, 10) AS $$
DECLARE
    v_rate DECIMAL(20, 10);
BEGIN
    SELECT rate INTO v_rate
    FROM exchange_rates
    WHERE from_currency = p_from_currency
      AND to_currency = p_to_currency
      AND is_active = true
      AND valid_from <= CURRENT_TIMESTAMP
      AND (valid_until IS NULL OR valid_until > CURRENT_TIMESTAMP)
    ORDER BY valid_from DESC
    LIMIT 1;

    IF v_rate IS NULL THEN
        RAISE EXCEPTION 'No active exchange rate found for % to %', p_from_currency, p_to_currency;
    END IF;

    RETURN v_rate;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- DATOS INICIALES
-- ============================================

-- Insertar tasas de cambio iniciales
INSERT INTO exchange_rates (from_currency, to_currency, rate, inverse_rate, source, is_active) VALUES
('CLP', 'PEN', 0.0043000000, 232.5581395349, 'manual', true),
('PEN', 'CLP', 232.5581395349, 0.0043000000, 'manual', true);

-- Insertar usuarios de prueba
INSERT INTO users (id, email, first_name, last_name, phone, country_code, document_type, document_number) VALUES
('11111111-1111-1111-1111-111111111111', 'juan.perez@example.com', 'Juan', 'Pérez', '+56912345678', 'CL', 'RUT', '12345678-9'),
('22222222-2222-2222-2222-222222222222', 'maria.gonzalez@example.com', 'María', 'González', '+51987654321', 'PE', 'DNI', '87654321'),
('33333333-3333-3333-3333-333333333333', 'carlos.rodriguez@example.com', 'Carlos', 'Rodríguez', '+56923456789', 'CL', 'RUT', '23456789-0');

-- Insertar wallets de prueba
INSERT INTO wallets (id, user_id, currency, balance, available_balance, held_balance) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'CLP', 1000000.0000, 1000000.0000, 0.0000),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '11111111-1111-1111-1111-111111111111', 'PEN', 500.0000, 500.0000, 0.0000),
('cccccccc-cccc-cccc-cccc-cccccccccccc', '22222222-2222-2222-2222-222222222222', 'PEN', 2000.0000, 2000.0000, 0.0000),
('dddddddd-dddd-dddd-dddd-dddddddddddd', '22222222-2222-2222-2222-222222222222', 'CLP', 500000.0000, 500000.0000, 0.0000),
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '33333333-3333-3333-3333-333333333333', 'CLP', 750000.0000, 750000.0000, 0.0000);

-- ============================================
-- COMENTARIOS EN TABLAS
-- ============================================
COMMENT ON TABLE users IS 'Usuarios del sistema';
COMMENT ON TABLE wallets IS 'Billeteras de usuarios por moneda';
COMMENT ON TABLE transactions IS 'Registro de todas las transacciones';
COMMENT ON TABLE exchange_rates IS 'Tasas de cambio entre monedas';
COMMENT ON TABLE quotes IS 'Cotizaciones de remesas';
COMMENT ON TABLE remittances IS 'Remesas enviadas';
COMMENT ON TABLE idempotency_keys IS 'Claves de idempotencia para prevenir duplicados';
COMMENT ON TABLE audit_logs IS 'Registro de auditoría de cambios';

-- ============================================
-- VISTAS ÚTILES
-- ============================================

-- Vista: Balance total por usuario
CREATE OR REPLACE VIEW user_balances AS
SELECT 
    u.id AS user_id,
    u.email,
    u.first_name,
    u.last_name,
    w.currency,
    w.balance,
    w.available_balance,
    w.held_balance,
    w.is_active AS wallet_active
FROM users u
LEFT JOIN wallets w ON u.id = w.user_id
WHERE u.is_active = true;

-- Vista: Resumen de remesas
CREATE OR REPLACE VIEW remittances_summary AS
SELECT 
    r.id,
    r.created_at,
    u.email AS sender_email,
    u.first_name || ' ' || u.last_name AS sender_name,
    r.recipient_email,
    r.recipient_name,
    r.from_currency,
    r.to_currency,
    r.send_amount,
    r.fee_amount,
    r.receive_amount,
    r.total_amount,
    r.status,
    r.external_provider_id
FROM remittances r
JOIN users u ON r.sender_id = u.id;

-- ============================================
-- PERMISOS (Opcional - ajustar según necesidad)
-- ============================================
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO wallet_user;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO wallet_user;
-- GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO wallet_user;

-- ============================================
-- FIN DEL SCRIPT
-- ============================================
 
