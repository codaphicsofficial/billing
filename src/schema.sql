-- ============================================================================
-- LOGISTICS & FLEET BILLING MANAGEMENT SYSTEM - DATABASE SCHEMA (PostgreSQL)
-- ============================================================================

-- 1. TRUCK_INFO TABLE
-- Holds the metadata of registered modern trucks
CREATE TABLE IF NOT EXISTS TRUCK_INFO (
    id VARCHAR(36) PRIMARY KEY,
    truck_no VARCHAR(50) UNIQUE NOT NULL,
    date_registered DATE NOT NULL DEFAULT CURRENT_DATE
);

CREATE INDEX IF NOT EXISTS idx_truck_info_truck_no ON TRUCK_INFO(truck_no);

-- 2. TRIP_LOG_MASTER TABLE
-- Primary trip reference logged for the fleet route
CREATE TABLE IF NOT EXISTS TRIP_LOG_MASTER (
    id VARCHAR(36) PRIMARY KEY,
    truck_id VARCHAR(36) NOT NULL,
    date DATE NOT NULL,
    route VARCHAR(255) NOT NULL,
    CONSTRAINT fk_trip_truck FOREIGN KEY (truck_id) 
        REFERENCES TRUCK_INFO(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_trip_log_date ON TRIP_LOG_MASTER(date);
CREATE INDEX IF NOT EXISTS idx_trip_log_truck_id ON TRIP_LOG_MASTER(truck_id);

-- 3. TRANSACTION_LOG TABLE
-- Logs ledger transactions evaluating transport fair calculations
CREATE TABLE IF NOT EXISTS TRANSACTION_LOG (
    id VARCHAR(36) PRIMARY KEY,
    trip_id VARCHAR(36) NOT NULL UNIQUE,
    account_id VARCHAR(100) NOT NULL,
    fair_calc DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
    CONSTRAINT fk_transaction_trip FOREIGN KEY (trip_id) 
        REFERENCES TRIP_LOG_MASTER(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_transaction_log_trip_id ON TRANSACTION_LOG(trip_id);

-- 4. ACCOUNT_MASTER TABLE
-- Accounts receivable / billing reconciliation matrix 
CREATE TABLE IF NOT EXISTS ACCOUNT_MASTER (
    id VARCHAR(36) PRIMARY KEY,
    trip_id VARCHAR(36) NOT NULL UNIQUE,
    account_id VARCHAR(100) NOT NULL,
    advance DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    paid_amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    remaining_balance DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    CONSTRAINT fk_account_trip FOREIGN KEY (trip_id) 
        REFERENCES TRIP_LOG_MASTER(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_account_master_trip_id ON ACCOUNT_MASTER(trip_id);

-- 5. CARGO_MANIFEST TABLE
-- Cargo payload detailing weight, volume density, rate multipliers and computed amounts
CREATE TABLE IF NOT EXISTS CARGO_MANIFEST (
    id VARCHAR(36) PRIMARY KEY,
    trip_id VARCHAR(36) NOT NULL UNIQUE,
    weight DECIMAL(10, 3) NOT NULL DEFAULT 0.000, -- in metric tonnes (e.g. 24.520)
    volume VARCHAR(100) NOT NULL,
    rate DECIMAL(10, 2) NOT NULL DEFAULT 0.00, -- Rate per unit weight/volume
    total_amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00, -- Calculated weight * rate
    CONSTRAINT fk_cargo_trip FOREIGN KEY (trip_id) 
        REFERENCES TRIP_LOG_MASTER(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_cargo_manifest_trip_id ON CARGO_MANIFEST(trip_id);

-- 6. EXPENSE_REGISTER TABLE
-- Tracks operational trip expenditures of drivers/fueling/tolls
CREATE TABLE IF NOT EXISTS EXPENSE_REGISTER (
    id VARCHAR(36) PRIMARY KEY,
    trip_id VARCHAR(36) NOT NULL,
    expense_id VARCHAR(100) NOT NULL,
    description VARCHAR(255) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    CONSTRAINT fk_expense_trip FOREIGN KEY (trip_id) 
        REFERENCES TRIP_LOG_MASTER(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_expense_register_trip_id ON EXPENSE_REGISTER(trip_id);

-- 7. PERFORMANCE_SUMMARY_MART TABLE
-- Real-time consolidated business intelligence analytical summary on trips
CREATE TABLE IF NOT EXISTS PERFORMANCE_SUMMARY_MART (
    id VARCHAR(36) PRIMARY KEY,
    trip_id VARCHAR(36) NOT NULL UNIQUE,
    purchase_id VARCHAR(100) NOT NULL, -- Ties to operational asset / vehicle purchase purchase_id
    fair DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    weight DECIMAL(10, 3) NOT NULL DEFAULT 0.000,
    paid_amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    net_profit DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    CONSTRAINT fk_performance_trip FOREIGN KEY (trip_id) 
        REFERENCES TRIP_LOG_MASTER(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_performance_summary_trip_id ON PERFORMANCE_SUMMARY_MART(trip_id);

-- 8. SYSTEM_AUDIT_LOG TABLE
-- Logs systemic state updates, operations, or driver edits
CREATE TABLE IF NOT EXISTS SYSTEM_AUDIT_LOG (
    id VARCHAR(36) PRIMARY KEY,
    trip_id VARCHAR(36),
    purchase_id VARCHAR(100),
    date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    route VARCHAR(255),
    amount DECIMAL(12, 2),
    user_action VARCHAR(255) NOT NULL
);

-- ============================================================================
-- DESIGNED WITH OPTIMIZED TRIPLE-FOREIGN KEY CASCADES & COMPREHENSIVE INDEXING
-- ============================================================================
