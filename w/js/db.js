/**
 * Database abstraction layer for GitHub-hosted data
 * Stores and retrieves warranty data from a 'warranties.json' file in the GitHub repository.
 */

// ==========================================
// CONFIGURATION - PLEASE FILL THIS OUT
// ==========================================
const PUBLIC_GITHUB_USER = 'kaleem-pirzada'; // e.g. 'kaleem-pirzada'
const PUBLIC_GITHUB_REPO = 'Orbit-Accounting-Software'; // e.g. 'warranty-data'
// ==========================================

const GITHUB_CONFIG_KEY = 'udstore_github_config';
const LOCAL_STORAGE_KEY = 'udstore_warranty_db';

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

    // Determine the best URL to fetch data from
    // 1. Use Merchant Config if available
    // 2. Use Public Constants if available
    // 3. Fallback to relative path (slowest to update on GitHub Pages)

    let owner = merchantConfig?.owner || PUBLIC_GITHUB_USER;
    let repo = merchantConfig?.repo || PUBLIC_GITHUB_REPO;

    let url;
    if (owner && repo) {
        // raw.githubusercontent.com is instant and doesn't wait for GitHub Pages to rebuild
        url = `https://raw.githubusercontent.com/${owner}/${repo}/main/warranties.json`;
    } else {
        url = '../warranties.json';
    }

    try {
        const response = await fetch(url + '?t=' + new Date().getTime());
        if (response.ok) {
            data = await response.json();
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

    // Check if we have the necessary credentials to push to GitHub
    if (!config || !config.token || !config.owner || !config.repo) {
        // No GitHub config? Store locally and warn the user.
        const db = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '[]');
        db.push(newRecord);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(db));
        return {
            success: true,
            mode: 'local',
            warning: 'Not synced to GitHub! Please configure GitHub settings to make this available to customers.'
        };
    }

    try {
        const filePath = 'warranties.json';
        const apiUrl = `https://api.github.com/repos/${config.owner}/${config.repo}/contents/${filePath}`;

        // 1. Get the current file to get its SHA (required for updates)
        const getResponse = await fetch(apiUrl, {
            headers: { 'Authorization': `token ${config.token}` }
        });

        let currentData = [];
        let sha = null;

        if (getResponse.ok) {
            const fileInfo = await getResponse.json();
            sha = fileInfo.sha;
            // Decode base64 content correctly handling UTF-8
            const content = decodeURIComponent(escape(atob(fileInfo.content)));
            currentData = JSON.parse(content);
        } else if (getResponse.status !== 404) {
            throw new Error('Failed to connect to GitHub. Check your token/repo settings.');
        }

        // 2. Add the new record
        currentData.push(newRecord);

        // 3. Update the file on GitHub
        const putResponse = await fetch(apiUrl, {
            method: 'PUT',
            headers: {
                'Authorization': `token ${config.token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: `Add warranty for ${newRecord.customerName} - ${newRecord.serialNumber}`,
                content: btoa(unescape(encodeURIComponent(JSON.stringify(currentData, null, 4)))),
                sha: sha
            })
        });

        if (putResponse.ok) {
            return { success: true, mode: 'github' };
        } else {
            const err = await putResponse.json();
            throw new Error(err.message || 'Failed to update GitHub');
        }
    } catch (error) {
        console.error('GitHub Sync Error:', error);
        throw new Error('Cloud Sync Failed: ' + error.message);
    }
}
