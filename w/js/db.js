/**
 * Database abstraction layer for GitHub-hosted data
 * Stores and retrieves warranty data from a 'warranties.txt' file in the GitHub repository.
 */

const GITHUB_CONFIG_KEY = 'udstore_github_config';
const LOCAL_STORAGE_KEY = 'udstore_warranty_db';
const DATA_FILE_PATH = 'warranties.txt'; 

// Helper to get GitHub configuration (stored in browser for merchant)
function getGitHubConfig() {
    const config = localStorage.getItem(GITHUB_CONFIG_KEY);
    return config ? JSON.parse(config) : null;
}

// Helper to save GitHub configuration
function saveGitHubConfig(config) {
    localStorage.setItem(GITHUB_CONFIG_KEY, JSON.stringify(config));
}

// Helper to parse the simple txt database
// Format: Serial|Invoice|Item|Customer|PurchaseDate|ExpiryDate
function parseTxtDatabase(text) {
    if (!text) return [];
    const lines = text.split('\n');
    const data = [];
    
    for (const line of lines) {
        if (!line || line.trim() === '') continue;
        const parts = line.split('|');
        if (parts.length >= 6) {
            data.push({
                serialNumber: parts[0].trim(),
                invoiceNumber: parts[1].trim(),
                itemName: parts[2].trim(),
                customerName: parts[3].trim(),
                purchaseDate: parts[4].trim(),
                expiryDate: parts[5].trim()
            });
        }
    }
    return data;
}

// Helper to convert data array back to txt string
function serializeTxtDatabase(dataArray) {
    return dataArray.map(item => 
        `${item.serialNumber}|${item.invoiceNumber}|${item.itemName}|${item.customerName}|${item.purchaseDate}|${item.expiryDate}`
    ).join('\n');
}

async function findWarranty(query) {
    let data = [];

    // Always fetch relative to the current site to avoid repository name mismatch
    // Using a cache-busting timestamp to bypass GitHub Pages caching
    const url = `../${DATA_FILE_PATH}?t=${new Date().getTime()}`;

    try {
        const response = await fetch(url, { cache: 'no-store' });
        if (response.ok) {
            const text = await response.text();
            data = parseTxtDatabase(text);
        } else {
            console.warn('Remote file not found, checking local storage fallback');
            data = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '[]');
        }
    } catch (e) {
        console.error('Error fetching warranty data:', e);
        data = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '[]');
    }

    const q = query.toLowerCase();
    return data.find(item => 
        item.serialNumber.toLowerCase() === q || 
        item.invoiceNumber.toLowerCase() === q
    );
}

async function saveWarranty(newRecord) {
    const config = getGitHubConfig();
    
    // Check if we have the necessary credentials to push to GitHub
    if (!config || !config.token || !config.owner || !config.repo) {
        const db = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '[]');
        db.push(newRecord);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(db));
        return { 
            success: true, 
            mode: 'local', 
            warning: 'Not synced! Please configure GitHub settings in the registration page.' 
        };
    }

    try {
        // Use the GitHub API to update the file in the repository
        const apiUrl = `https://api.github.com/repos/${config.owner}/${config.repo}/contents/${DATA_FILE_PATH}`;
        
        const getResponse = await fetch(apiUrl, {
            headers: { 'Authorization': `token ${config.token}` }
        });
        
        let currentText = '';
        let sha = null;

        if (getResponse.ok) {
            const fileInfo = await getResponse.json();
            sha = fileInfo.sha;
            // Decode base64 text content
            currentText = decodeURIComponent(escape(atob(fileInfo.content)));
        } else if (getResponse.status !== 404) {
            throw new Error('Could not access GitHub repository. Check your token/repo settings.');
        }

        // Parse existing, append new, and reserialize
        const currentData = parseTxtDatabase(currentText);
        
        // Prevent duplicate serial numbers
        if (currentData.some(item => item.serialNumber === newRecord.serialNumber)) {
            throw new Error('This serial number is already registered.');
        }

        currentData.push(newRecord);
        const newTextContent = serializeTxtDatabase(currentData);
        
        // Push updated text file back to GitHub
        const putResponse = await fetch(apiUrl, {
            method: 'PUT',
            headers: {
                'Authorization': `token ${config.token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: `Register warranty: ${newRecord.serialNumber}`,
                content: btoa(unescape(encodeURIComponent(newTextContent))),
                sha: sha
            })
        });

        if (putResponse.ok) {
            // Also update local storage as a fallback
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(currentData));
            return { success: true, mode: 'github' };
        } else {
            const err = await putResponse.json();
            throw new Error(err.message || 'Failed to update file on GitHub');
        }
    } catch (error) {
        console.error('GitHub Sync Error:', error);
        throw new Error(error.message);
    }
}
