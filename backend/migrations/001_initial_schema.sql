-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('super_admin', 'manager', 'staff')),
    assigned_router_id UUID,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
);

-- Routers table
CREATE TABLE routers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) UNIQUE NOT NULL,
    location VARCHAR(255) NOT NULL,
    ip_address VARCHAR(50) UNIQUE NOT NULL,
    api_port INTEGER DEFAULT 8728,
    api_username VARCHAR(100) NOT NULL,
    api_password_encrypted TEXT NOT NULL,
    router_model VARCHAR(100),
    active BOOLEAN DEFAULT true,
    last_sync TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Token packages table
CREATE TABLE token_packages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    duration_hours INTEGER NOT NULL,
    data_limit_mb INTEGER NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    description TEXT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Token transactions table
CREATE TABLE token_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    voucher_code VARCHAR(50) UNIQUE NOT NULL,
    package_id UUID NOT NULL REFERENCES token_packages(id),
    staff_id UUID NOT NULL REFERENCES users(id),
    router_id UUID NOT NULL REFERENCES routers(id),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'expired', 'used')),
    expected_revenue DECIMAL(10, 2) NOT NULL,
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    activated_at TIMESTAMP,
    expires_at TIMESTAMP,
    client_mac VARCHAR(50),
    client_ip VARCHAR(50)
);

-- Usage logs table
CREATE TABLE usage_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_id UUID REFERENCES token_transactions(id),
    router_id UUID NOT NULL REFERENCES routers(id),
    voucher_code VARCHAR(50) NOT NULL,
    bytes_uploaded BIGINT DEFAULT 0,
    bytes_downloaded BIGINT DEFAULT 0,
    total_bytes BIGINT DEFAULT 0,
    session_duration_seconds INTEGER DEFAULT 0,
    session_start TIMESTAMP,
    session_end TIMESTAMP,
    synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Revenue records table
CREATE TABLE revenue_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_id UUID NOT NULL REFERENCES token_transactions(id),
    staff_id UUID NOT NULL REFERENCES users(id),
    router_id UUID NOT NULL REFERENCES routers(id),
    amount DECIMAL(10, 2) NOT NULL,
    payment_status VARCHAR(20) DEFAULT 'expected' CHECK (payment_status IN ('expected', 'confirmed', 'disputed')),
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT
);

-- Sessions table
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    session_token VARCHAR(255) UNIQUE NOT NULL,
    clock_in TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    clock_out TIMESTAMP,
    active BOOLEAN DEFAULT true,
    ip_address VARCHAR(50)
);

-- Audit logs table (immutable)
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    resource VARCHAR(100) NOT NULL,
    changes JSONB,
    ip_address VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Router health table
CREATE TABLE router_health (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    router_id UUID NOT NULL REFERENCES routers(id),
    is_online BOOLEAN DEFAULT false,
    active_users INTEGER DEFAULT 0,
    cpu_usage FLOAT,
    memory_usage FLOAT,
    bandwidth_usage BIGINT,
    checked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Alerts table
CREATE TABLE alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type VARCHAR(50) NOT NULL CHECK (type IN ('revenue_mismatch', 'unusual_activity', 'router_offline', 'token_abuse')),
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    user_id UUID REFERENCES users(id),
    router_id UUID REFERENCES routers(id),
    message TEXT NOT NULL,
    details JSONB,
    resolved BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP
);

-- Reconciliation reports table
CREATE TABLE reconciliation_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    router_id UUID NOT NULL REFERENCES routers(id),
    report_date DATE NOT NULL,
    tokens_generated INTEGER DEFAULT 0,
    tokens_used INTEGER DEFAULT 0,
    expected_revenue DECIMAL(10, 2) DEFAULT 0,
    confirmed_revenue DECIMAL(10, 2) DEFAULT 0,
    variance DECIMAL(10, 2) DEFAULT 0,
    discrepancies JSONB,
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(router_id, report_date)
);

-- Indexes for performance
CREATE INDEX idx_token_transactions_staff ON token_transactions(staff_id);
CREATE INDEX idx_token_transactions_router ON token_transactions(router_id);
CREATE INDEX idx_token_transactions_status ON token_transactions(status);
CREATE INDEX idx_token_transactions_generated_at ON token_transactions(generated_at);
CREATE INDEX idx_usage_logs_router ON usage_logs(router_id);
CREATE INDEX idx_usage_logs_voucher ON usage_logs(voucher_code);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX idx_alerts_resolved ON alerts(resolved);
CREATE INDEX idx_sessions_active ON sessions(active);

-- Add foreign key constraint
ALTER TABLE users ADD CONSTRAINT fk_users_router 
    FOREIGN KEY (assigned_router_id) REFERENCES routers(id);

-- Add Zimbabwe Province, District, Town fields to routers table
ALTER TABLE routers 
ADD COLUMN IF NOT EXISTS province VARCHAR(100),
ADD COLUMN IF NOT EXISTS district VARCHAR(100),
ADD COLUMN IF NOT EXISTS town VARCHAR(100);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_routers_province ON routers(province);
CREATE INDEX IF NOT EXISTS idx_routers_district ON routers(district);
CREATE INDEX IF NOT EXISTS idx_routers_town ON routers(town);

-- Insert default token packages
INSERT INTO token_packages (name, duration_hours, data_limit_mb, price, description) VALUES
('1 Hour Package', 1, 500, 1.00, '1 hour browsing with 500MB data'),
('3 Hours Package', 3, 1500, 2.50, '3 hours browsing with 1.5GB data'),
('Daily Package', 24, 5120, 5.00, 'Full day access with 5GB data'),
('Weekly Package', 168, 20480, 15.00, 'One week access with 20GB data');

