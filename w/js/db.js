/**
 * Database abstraction layer for GitHub-hosted data
 * Stores and retrieves warranty data from a 'warranties.txt' file in the GitHub repository.
 */

// ==========================================
// CONFIGURATION - PLEASE FILL THIS OUT
// ==========================================
const PUBLIC_GITHUB_USER = 'kaleem-pirzada'; 
const PUBLIC_GITHUB_REPO = 'Orbit-Accounting-Software'; 
// ==========================================

const GITHUB_CONFIG_KEY = 'udstore_github_config';
const LOCAL_STORAGE_KEY = 'udstore_warranty_db';
const DATA_FILE_PATH = 'warranties.txt'; // Changed from .json to .txt

// Helper to get GitHub configuration (stored in browser for merchant)
function getGitHubConfig() {
    const config = localStorage.getItem(GITHUB_CONFIG_KEY);
    return config ? JSON.parse(config) : null;
}

// Helper to save GitHub configuration
function saveGitHubConfig(config) {
    localStorage.setItem(GITHUB_CONFIG_KEY, JSON.stringify(config));
}

async function findWarranty(query) {
    const merchantConfig = getGitHubConfig();
    let data = [];

    let owner = merchantConfig?.owner || PUBLIC_GITHUB_USER;
    let repo = merchantConfig?.repo || PUBLIC_GITHUB_REPO;
    
    let url;
    if (owner && repo) {
        url = `https://raw.githubusercontent.com/${owner}/${repo}/main/${DATA_FILE_PATH}`;
    } else {
        url = `../${DATA_FILE_PATH}`;
    }

    try {
        const response = await fetch(url + '?t=' + new Date().getTime());
        if (response.ok) {
            const text = await response.text();
            try {
                data = JSON.parse(text);
            } catch (e) {
                console.error('Data in .txt file is not valid JSON, trying fallback');
                data = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '[]');
            }
        } else {
            console.warn('Remote data not found, checking local storage fallback');
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
        const apiUrl = `https://api.github.com/repos/${config.owner}/${config.repo}/contents/${DATA_FILE_PATH}`;
        
        const getResponse = await fetch(apiUrl, {
            headers: { 'Authorization': `token ${config.token}` }
        });
        
        let currentData = [];
        let sha = null;

        if (getResponse.ok) {
            const fileInfo = await getResponse.json();
            sha = fileInfo.sha;
            const content = decodeURIComponent(escape(atob(fileInfo.content)));
            currentData = JSON.parse(content);
        } else if (getResponse.status !== 404) {
            throw new Error('Could not access GitHub repository. Check your token.');
        }

        currentData.push(newRecord);
        
        const putResponse = await fetch(apiUrl, {
            method: 'PUT',
            headers: {
                'Authorization': `token ${config.token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: `Update warranty: ${newRecord.serialNumber}`,
                content: btoa(unescape(encodeURIComponent(JSON.stringify(currentData, null, 4)))),
                sha: sha
            })
        });

        if (putResponse.ok) {
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
