import sqlite3
import json
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs

# Simple SQLite Database Wrapper
DB_FILE = "warranty.db"

def init_db():
    conn = sqlite3.connect(DB_FILE)
    with open('schema.sql', 'r') as f:
        conn.executescript(f.read())
    conn.close()

class WarrantyHandler(BaseHTTPRequestHandler):
    def _set_headers(self, status=200):
        self.send_response(status)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_OPTIONS(self):
        self._set_headers()

    def do_GET(self):
        parsed_path = urlparse(self.path)
        if parsed_path.path == '/api/verify':
            params = parse_qs(parsed_path.query)
            query = params.get('q', [None])[0]
            
            if query:
                conn = sqlite3.connect(DB_FILE)
                conn.row_factory = sqlite3.Row
                cursor = conn.cursor()
                cursor.execute("SELECT * FROM warranties WHERE serial_number = ? OR invoice_number = ?", (query, query))
                row = cursor.fetchone()
                conn.close()
                
                if row:
                    self._set_headers(200)
                    self.wfile.write(json.dumps(dict(row)).encode())
                else:
                    self._set_headers(404)
                    self.wfile.write(json.dumps({"error": "Not found"}).encode())
            else:
                self._set_headers(400)
        else:
            self._set_headers(404)

    def do_POST(self):
        if self.path == '/api/register':
            content_length = int(self.headers['Content-Length'])
            post_data = json.loads(self.rfile.read(content_length))
            
            try:
                conn = sqlite3.connect(DB_FILE)
                cursor = conn.cursor()
                cursor.execute("""
                    INSERT INTO warranties (customer_name, invoice_number, item_name, serial_number, purchase_date, expiry_date)
                    VALUES (?, ?, ?, ?, ?, ?)
                """, (
                    post_data['customerName'],
                    post_data['invoiceNumber'],
                    post_data['itemName'],
                    post_data['serialNumber'],
                    post_data['purchaseDate'],
                    post_data['expiryDate']
                ))
                conn.commit()
                conn.close()
                self._set_headers(201)
                self.wfile.write(json.dumps({"status": "success"}).encode())
            except sqlite3.IntegrityError:
                self._set_headers(400)
                self.wfile.write(json.dumps({"error": "Serial number already registered"}).encode())
            except Exception as e:
                self._set_headers(500)
                self.wfile.write(json.dumps({"error": str(e)}).encode())

if __name__ == "__main__":
    init_db()
    server = HTTPServer(('localhost', 8000), WarrantyHandler)
    print("Server running on http://localhost:8000")
    server.serve_forever()
