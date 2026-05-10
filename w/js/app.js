// UI Helper Functions
function calculateExpiry() {
    const purchaseDateInput = document.getElementById('purchaseDate');
    const monthsInput = document.getElementById('warrantyMonths');
    const expiryOutput = document.getElementById('expiryDate');

    if (purchaseDateInput.value && monthsInput.value) {
        const purchaseDate = new Date(purchaseDateInput.value);
        const months = parseInt(monthsInput.value);
        
        const expiryDate = new Date(purchaseDate);
        expiryDate.setMonth(expiryDate.getMonth() + months);
        
        expiryOutput.value = expiryDate.toISOString().split('T')[0];
    }
}

async function handleRegistration() {
    const data = {
        customerName: document.getElementById('customerName').value,
        invoiceNumber: document.getElementById('invoiceNumber').value,
        itemName: document.getElementById('itemName').value,
        serialNumber: document.getElementById('serialNumber').value,
        purchaseDate: document.getElementById('purchaseDate').value,
        expiryDate: document.getElementById('expiryDate').value
    };

    const resultBox = document.getElementById('registerResult');
    
    try {
        const result = await saveWarranty(data);
        
        if (result.success) {
            resultBox.style.display = 'block';
            if (result.warning) {
                resultBox.className = 'result-box error'; // Use error color for warnings
                resultBox.innerHTML = `<strong>Local Only!</strong> ${result.warning}`;
            } else {
                resultBox.className = 'result-box success';
                resultBox.innerHTML = `<strong>Success!</strong> Product registered to Cloud. <br> Serial: ${data.serialNumber}`;
                document.getElementById('registerForm').reset();
                document.getElementById('expiryDate').value = '';
            }
        }
    } catch (error) {
        resultBox.style.display = 'block';
        resultBox.className = 'result-box error';
        resultBox.innerHTML = `<strong>Sync Failed!</strong> ${error.message}`;
    }
}

// GitHub Config Handlers
function toggleGithubSettings() {
    const el = document.getElementById('githubSettings');
    el.style.display = el.style.display === 'none' ? 'block' : 'none';
    
    // Load existing config if showing
    if (el.style.display === 'block') {
        const config = getGitHubConfig();
        if (config) {
            document.getElementById('ghOwner').value = config.owner || '';
            document.getElementById('ghRepo').value = config.repo || '';
            document.getElementById('ghToken').value = config.token || '';
        }
    }
}

function updateGithubConfig() {
    const config = {
        owner: document.getElementById('ghOwner').value,
        repo: document.getElementById('ghRepo').value,
        token: document.getElementById('ghToken').value,
        branch: 'main'
    };
    
    saveGitHubConfig(config);
    alert('GitHub Configuration Saved! Data will now sync to the cloud.');
    toggleGithubSettings();
}

async function verifyWarranty() {
    const query = document.getElementById('serialSearch').value;
    const resultBox = document.getElementById('resultArea');
    
    if (!query) return;

    resultBox.style.display = 'block';
    resultBox.className = 'result-box';
    resultBox.innerHTML = 'Searching...';

    try {
        const record = await findWarranty(query);
        
        if (record) {
            const today = new Date();
            const expiry = new Date(record.expiryDate);
            const isExpired = today > expiry;
            
            resultBox.className = 'result-box success';
            resultBox.innerHTML = `
                <div style="text-align: left;">
                    <h3 style="margin-bottom: 1rem; color: ${isExpired ? 'var(--error)' : 'var(--accent)'}">
                        ${isExpired ? 'Warranty Expired' : 'Warranty Active'}
                    </h3>
                    <p><strong>Customer:</strong> ${record.customerName}</p>
                    <p><strong>Item:</strong> ${record.itemName}</p>
                    <p><strong>Invoice:</strong> ${record.invoiceNumber}</p>
                    <p><strong>Purchase Date:</strong> ${record.purchaseDate}</p>
                    <p><strong>Expiry Date:</strong> ${record.expiryDate}</p>
                </div>
            `;
        } else {
            resultBox.className = 'result-box error';
            resultBox.innerHTML = `<strong>No Record Found!</strong> We couldn't find a warranty for "${query}". Please check the number and try again.`;
        }
    } catch (error) {
        resultBox.className = 'result-box error';
        resultBox.innerHTML = `<strong>Error!</strong> An error occurred while searching.`;
    }
}
