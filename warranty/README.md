# UD Store – Warranty System

A simple, static warranty verification and registration system hosted on **GitHub Pages**.  
No backend, no tokens shown to customers — just a flat-file database (`warranties.txt`) updated via the GitHub API by admins.

---

## 📁 File Structure

```
/
├── index.html          ← Public warranty check page
├── warranties.txt      ← Flat-file database (pipe-delimited)
├── register/
│   └── index.html      ← Admin-only registration page
└── README.md
```

---

## 🚀 Setup on GitHub Pages

### Step 1 — Push this repo to GitHub
```bash
git init
git add .
git commit -m "Initial warranty system"
git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPO.git
git push -u origin main
```

### Step 2 — Enable GitHub Pages
1. Go to your repo → **Settings → Pages**
2. Set Source to **Deploy from a branch → main → / (root)**
3. Click **Save**
4. Your site will be live at: `https://YOUR-USERNAME.github.io/YOUR-REPO/`

### Step 3 — Create a GitHub Personal Access Token (PAT)
1. GitHub → **Settings → Developer settings → Personal access tokens → Fine-grained tokens**
2. Click **Generate new token**
3. Set **Repository access** → Only selected → pick your warranty repo
4. Under **Permissions → Contents → Read and write**
5. Generate and **copy the token**

### Step 4 — Configure the Admin Page
1. Go to `https://YOUR-USERNAME.github.io/YOUR-REPO/register/`
2. Login with password: `udstore123` *(change this in `register/index.html`)*
3. Open **⚙ GitHub Settings** at the bottom
4. Enter your GitHub username, repo name, and PAT
5. Click **Save Settings**

> ⚠ Your PAT is stored **only in your browser's localStorage** — it is never committed to the repo.

---

## 🔑 Changing the Admin Password

Open `register/index.html` and find this line near the top of the `<script>`:

```js
const ADMIN_PASSWORD = 'udstore123';
```

Change it to whatever you want and push the update.

---

## 📄 Database Format (`warranties.txt`)

Each row is pipe-delimited:

```
SERIAL|INVOICE|PRODUCT|CUSTOMER|PURCHASE_DATE|EXPIRY_DATE|PHONE
SN-202501-001|INV-0001|HP LaserJet Pro|John Doe|2025-01-15|2026-01-15|03001234567
```

You can also manually add rows by editing the file directly in GitHub.

---

## ✅ How It Works

| Who | What |
|-----|------|
| **Customer** | Visits `index.html`, enters serial or invoice number → system fetches `warranties.txt` and shows status |
| **Admin** | Visits `register/index.html`, logs in with password → fills form → system calls GitHub API to append the new record to `warranties.txt` |

No server required. No database. Works 100% on GitHub Pages free tier.
