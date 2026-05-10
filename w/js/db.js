/**
 * Database abstraction layer for GitHub-hosted data
 * Stores and retrieves warranty data from a 'warranties.json' file in the GitHub repository.
 */

const GITHUB_CONFIG_KEY = 'udstore_github_config';
const LOCAL_STORAGE_KEY = 'udstore_warranty_db'; // Fallback

// Helper to get GitHub configuration
function getGitHubConfig() {
    const config = localStorage.getItem(GITHUB_CONFIG_KEY);
    return config ? JSON.parse(config) : null;
}

// Helper to save GitHub configuration
function saveGitHubConfig(config) {
    localStorage.setItem(GITHUB_CONFIG_KEY, JSON.stringify(config));
}

async function findWarranty(query) {
    const config = getGitHubConfig();
    let data = [];

    try {
        // Try to fetch from GitHub if configured, otherwise use local warranties.json
        // If config exists, we use the raw github url which is updated on push
        const url = config 
            ? `https://raw.githubusercontent.com/${config.owner}/${config.repo}/${config.branch || 'main'}/warranties.json`
            : '../warranties.json';
        
        const response = await fetch(url + '?t=' + new Date().getTime()); // Avoid caching
        if (response.ok) {
            data = await response.json();
        } else {
            console.warn('GitHub data not found, falling back to local storage');
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
    
    if (!config || !config.token) {
        // Fallback to local storage if no GitHub config
        const db = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '[]');
        db.push(newRecord);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(db));
        return { success: true, mode: 'local' };
    }

    try {
        const filePath = 'warranties.json';
        const apiUrl = `https://api.github.com/repos/${config.owner}/${config.repo}/contents/${filePath}`;
        
        // 1. Get the current file to get its SHA
        const getResponse = await fetch(apiUrl, {
            headers: { 'Authorization': `token ${config.token}` }
        });
        
        let currentData = [];
        let sha = null;

        if (getResponse.ok) {
            const fileInfo = await getResponse.json();
            sha = fileInfo.sha;
            // Decode base64 content
            const content = decodeURIComponent(escape(atob(fileInfo.content)));
            currentData = JSON.parse(content);
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
        throw error;
    }
}
