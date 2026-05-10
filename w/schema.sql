CREATE TABLE IF NOT EXISTS warranties (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_name TEXT NOT NULL,
    invoice_number TEXT NOT NULL,
    item_name TEXT NOT NULL,
    serial_number TEXT UNIQUE NOT NULL,
    purchase_date DATE NOT NULL,
    expiry_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
