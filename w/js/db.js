/**
 * Database abstraction layer
 * In a production environment, these would be replaced with fetch() calls to a backend.
 * Since this is designed for a GitHub static site, we use localStorage for persistence
 * and mock the SQLite behavior.
 */

const STORAGE_KEY = 'udstore_warranty_db';

// Initialize with some dummy data if empty
function initDB() {
    if (!localStorage.getItem(STORAGE_KEY)) {
        const dummyData = [
            {
                customerName: "John Doe",
                invoiceNumber: "INV-1001",
                itemName: "High-End Gaming Mouse",
                serialNumber: "SN12345678",
                purchaseDate: "2024-05-10",
                expiryDate: "2025-05-10"
            }
        ];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(dummyData));
    }
}

async function saveWarranty(data) {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const db = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    db.push(data);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
    return true;
}

async function findWarranty(query) {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 600));
    
    const db = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    const q = query.toLowerCase();
    
    return db.find(item => 
        item.serialNumber.toLowerCase() === q || 
        item.invoiceNumber.toLowerCase() === q
    );
}

// Initialize on load
initDB();

/**
 * SQL SCHEMA FOR BACKEND (SQLite)
 * ----------------------------
 * CREATE TABLE warranties (
 *   id INTEGER PRIMARY KEY AUTOINCREMENT,
 *   customer_name TEXT NOT NULL,
 *   invoice_number TEXT NOT NULL,
 *   item_name TEXT NOT NULL,
 *   serial_number TEXT UNIQUE NOT NULL,
 *   purchase_date DATE NOT NULL,
 *   expiry_date DATE NOT NULL,
 *   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
 * );
 */
