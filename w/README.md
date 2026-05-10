# UD Store Warranty Portal

A professional, high-end warranty management system designed for **UD Store**. This portal allows customers to verify their product warranty status and register new purchases.

## Features
- **Premium Design**: Dark mode aesthetic with glassmorphism and smooth animations.
- **Warranty Verification**: Instant lookup using Serial Number or Invoice Number.
- **Product Registration**: Easy-to-use form with auto-calculating expiry dates.
- **Multi-Path Support**: Designed for `udstore.in/warranty` and `udstore.in/register`.
- **Hybrid Data Model**: 
  - Frontend ready for GitHub Pages (uses `localStorage` / Mock DB for instant demo).
  - Backend ready for SQLite (Python server included for real-world deployment).

## Project Structure
- `w/index.html`: Main portal landing page.
- `w/warranty/index.html`: Warranty verification page.
- `w/register/index.html`: Warranty registration page.
- `w/css/style.css`: Shared premium styling.
- `w/js/app.js`: Application logic.
- `w/js/db.js`: Database abstraction layer.
- `w/assets/`: Branding and images.
- `w/server.py`: Python/SQLite backend for production use.
- `w/schema.sql`: Database schema.

## How to Host on GitHub
1. Upload all files to your GitHub repository.
2. Go to **Settings > Pages**.
3. Select the `main` branch and `/ (root)` folder.
4. Your site will be live at `https://your-username.github.io/repo-name/`.
5. To use `udstore.in/w/warranty`, point your custom domain to GitHub Pages and ensure the files are in the `w` folder.

## Using with SQLite
If you want to use a real database instead of browser storage:
1. Run the Python server: `python server.py`.
2. Update `js/db.js` to use `fetch('http://localhost:8000/api/...')` instead of `localStorage`.
3. The server will automatically create `warranty.db` using `schema.sql`.

---
*Created by Antigravity for UD Store.*
