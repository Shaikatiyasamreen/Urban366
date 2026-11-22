import json
import urllib.parse
from http.server import HTTPServer, BaseHTTPRequestHandler
import sys
import os

# Add backend directory to sys.path
sys.path.append(os.path.dirname(__file__))
import database

PORT = int(os.environ.get("PORT", 8000))

class Urbab366Handler(BaseHTTPRequestHandler):
    def _send_cors_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")

    def do_OPTIONS(self):
        self.send_response(200)
        self._send_cors_headers()
        self.end_headers()

    def _send_json(self, data, status=200):
        self.send_response(status)
        self._send_cors_headers()
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.end_headers()
        self.wfile.write(json.dumps(data, ensure_ascii=False, default=str).encode("utf-8"))

    def _parse_body(self):
        content_length = int(self.headers.get("Content-Length", 0))
        if content_length > 0:
            raw_data = self.rfile.read(content_length)
            return json.loads(raw_data.decode("utf-8"))
        return {}

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        query_params = urllib.parse.parse_qs(parsed.query)

        if path == "/api/health":
            self._send_json({"status": "ok", "city": "Bengaluru"})

        elif path == "/api/homepage":
            categories = database.query_all("SELECT * FROM categories ORDER BY display_order ASC")
            regular_categories = [c for c in categories if c["group_type"] == "regular"]
            native_categories = [c for c in categories if c["group_type"] == "native"]

            hero_banner = database.query_one("SELECT * FROM banners WHERE type = 'hero' LIMIT 1")
            spotlight_banners = database.query_all("SELECT * FROM banners WHERE type = 'spotlight' ORDER BY display_order ASC")
            feature_banners = database.query_all("SELECT * FROM banners WHERE type IN ('feature', 'branded') ORDER BY display_order ASC")

            services_all = database.query_all("SELECT s.*, c.name as category_name FROM services s LEFT JOIN categories c ON s.category_id = c.id ORDER BY s.id ASC")
            for s in services_all:
                s["feature_list"] = [f.strip() for f in s["features"].split(",") if f.strip()] if s.get("features") else []

            sections = [
                {
                    "id": "most_booked",
                    "title": "Most booked services",
                    "subtitle": "Trusted by millions across Bengaluru",
                    "services": [s for s in services_all if s["section_group"] == "most_booked"]
                },
                {
                    "id": "cleaning_essentials",
                    "title": "Cleaning essentials",
                    "subtitle": "For a clean & fresh home",
                    "see_all_link": "/services?category=cleaning-pest-control",
                    "services": [s for s in services_all if s["section_group"] == "cleaning_essentials"]
                },
                {
                    "id": "salon_women",
                    "title": "Salon for women",
                    "subtitle": "Pamper yourself with hygienic, mess-free services",
                    "see_all_link": "/services?category=womens-salon-spa",
                    "services": [s for s in services_all if s["section_group"] == "salon_women"]
                },
                {
                    "id": "spa_women",
                    "title": "Spa for women",
                    "subtitle": "Relax & unwind with soothing therapy in your room",
                    "see_all_link": "/services?category=womens-salon-spa",
                    "services": [s for s in services_all if s["section_group"] == "spa_women"]
                },
                {
                    "id": "appliance_repair",
                    "title": "Appliance repair & service",
                    "subtitle": "Keep things running smoothly with 30-day warranty",
                    "see_all_link": "/services?category=ac-appliance-repair",
                    "services": [s for s in services_all if s["section_group"] == "appliance_repair"]
                },
                {
                    "id": "home_repairs",
                    "title": "Home repairs & upgrades",
                    "subtitle": "Quick fixes by trusted verified experts",
                    "see_all_link": "/services?category=electrician-plumber-carpenter",
                    "services": [s for s in services_all if s["section_group"] == "home_repairs"]
                },
                {
                    "id": "massage_men",
                    "title": "Massage for men",
                    "subtitle": "Recharge your body & mind after hectic traffic",
                    "see_all_link": "/services?category=mens-salon-massage",
                    "services": [s for s in services_all if s["section_group"] == "massage_men"]
                },
                {
                    "id": "salon_men",
                    "title": "Salon for men",
                    "subtitle": "Grooming made easy at the comfort of home",
                    "see_all_link": "/services?category=mens-salon-massage",
                    "services": [s for s in services_all if s["section_group"] == "salon_men"]
                }
            ]

            curations = database.query_all("SELECT * FROM curations ORDER BY display_order ASC")
            popular_tags = database.query_all("SELECT * FROM popular_tags ORDER BY display_order ASC")
            default_location = database.query_one("SELECT * FROM locations WHERE is_default = 1") or {
                "area_name": "Richmond Town",
                "locality": "Central Bengaluru",
                "city": "Bengaluru",
                "pincode": "560025",
                "address_line": "3, Norris Rd - Richmond Town - Bengaluru - Karnataka 560025 - India"
            }

            promises = [
                {"title": "366-Day Quality Assurance", "desc": "Standardized SOPs, hospital-grade sanitized tools & gear"},
                {"title": "Top 1% Verified Experts", "desc": "Rigorous criminal background check & trade certification"},
                {"title": "Upfront Transparent Pricing", "desc": "Fixed rate cards with zero surge fees or surprises"},
                {"title": "Unconditional 30-Day Warranty", "desc": "Free re-work covered by Urbab366 customer protection"}
            ]

            self._send_json({
                "regular_categories": regular_categories,
                "native_categories": native_categories,
                "hero_banner": hero_banner,
                "spotlight_banners": spotlight_banners,
                "feature_banners": feature_banners,
                "sections": sections,
                "curations": curations,
                "popular_tags": popular_tags,
                "default_location": default_location,
                "promises": promises
            })

        elif path == "/api/categories":
            categories = database.query_all("SELECT * FROM categories ORDER BY display_order ASC")
            self._send_json(categories)

        elif path == "/api/services":
            category = query_params.get("category", [None])[0]
            section = query_params.get("section", [None])[0]
            q = query_params.get("q", [None])[0]

            query = """
                SELECT s.*, c.name as category_name, c.slug as category_slug 
                FROM services s 
                LEFT JOIN categories c ON s.category_id = c.id
                WHERE 1=1
            """
            params = []
            if category:
                query += " AND (c.slug = ? OR c.name LIKE ?)"
                params.extend([category, f"%{category}%"])
            if section:
                query += " AND s.section_group = ?"
                params.append(section)
            if q:
                query += " AND (s.title LIKE ? OR s.description LIKE ? OR c.name LIKE ?)"
                params.extend([f"%{q}%", f"%{q}%", f"%{q}%"])

            query += " ORDER BY s.rating DESC, s.id ASC"
            rows = database.query_all(query, tuple(params))
            for r in rows:
                r["feature_list"] = [f.strip() for f in r["features"].split(",") if f.strip()] if r.get("features") else []
            self._send_json(rows)

        elif path == "/api/locations":
            locations = database.query_all("SELECT * FROM locations ORDER BY id ASC")
            self._send_json(locations)

        elif path == "/api/cart":
            items = database.query_all("""
                SELECT ci.id as cart_item_id, ci.quantity, s.* 
                FROM cart_items ci
                JOIN services s ON ci.service_id = s.id
                ORDER BY ci.created_at ASC
            """)
            total_amount = sum(item["price"] * item["quantity"] for item in items)
            original_total = sum((item["original_price"] or item["price"]) * item["quantity"] for item in items)
            discount = original_total - total_amount
            item_count = sum(item["quantity"] for item in items)

            self._send_json({
                "items": items,
                "item_count": item_count,
                "total_amount": total_amount,
                "original_total": original_total,
                "discount": discount
            })

        elif path == "/api/bookings":
            bookings = database.query_all("SELECT * FROM bookings ORDER BY created_at DESC")
            for b in bookings:
                b["items"] = json.loads(b["items_json"]) if b.get("items_json") else []
            self._send_json(bookings)

        else:
            self._send_json({"error": "Not found"}, status=404)

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        body = self._parse_body()

        if path == "/api/cart":
            service_id = body.get("service_id")
            quantity = body.get("quantity", 1)

            if not service_id:
                self._send_json({"error": "service_id required"}, status=400)
                return

            service = database.query_one("SELECT * FROM services WHERE id = ?", (service_id,))
            if not service:
                self._send_json({"error": "Service not found"}, status=404)
                return

            existing = database.query_one("SELECT * FROM cart_items WHERE service_id = ?", (service_id,))
            if existing:
                new_qty = existing["quantity"] + quantity
                if new_qty <= 0:
                    database.execute_write("DELETE FROM cart_items WHERE service_id = ?", (service_id,))
                else:
                    database.execute_write("UPDATE cart_items SET quantity = ? WHERE service_id = ?", (new_qty, service_id))
            else:
                if quantity > 0:
                    database.execute_write("INSERT INTO cart_items (service_id, quantity) VALUES (?, ?)", (service_id, quantity))

            # Return updated cart
            items = database.query_all("""
                SELECT ci.id as cart_item_id, ci.quantity, s.* 
                FROM cart_items ci
                JOIN services s ON ci.service_id = s.id
                ORDER BY ci.created_at ASC
            """)
            total_amount = sum(item["price"] * item["quantity"] for item in items)
            original_total = sum((item["original_price"] or item["price"]) * item["quantity"] for item in items)
            discount = original_total - total_amount
            item_count = sum(item["quantity"] for item in items)

            self._send_json({
                "items": items,
                "item_count": item_count,
                "total_amount": total_amount,
                "original_total": original_total,
                "discount": discount
            })

        elif path == "/api/bookings":
            customer_name = body.get("customer_name")
            customer_phone = body.get("customer_phone")
            customer_email = body.get("customer_email", "")
            address = body.get("address", "3, Norris Rd, Richmond Town, Bengaluru")
            scheduled_date = body.get("scheduled_date", "Today")
            scheduled_time = body.get("scheduled_time", "03:00 PM - 04:00 PM")
            payment_method = body.get("payment_method", "Cash on Delivery")

            items = database.query_all("""
                SELECT ci.id as cart_item_id, ci.quantity, s.* 
                FROM cart_items ci
                JOIN services s ON ci.service_id = s.id
            """)
            if not items:
                self._send_json({"error": "Cart is empty"}, status=400)
                return

            total_amount = sum(item["price"] * item["quantity"] for item in items)
            items_json = json.dumps([
                {
                    "service_id": it["id"],
                    "title": it["title"],
                    "price": it["price"],
                    "quantity": it["quantity"]
                } for it in items
            ])

            booking_id = database.execute_write("""
                INSERT INTO bookings (customer_name, customer_phone, customer_email, address, scheduled_date, scheduled_time, total_amount, payment_method, items_json)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                customer_name,
                customer_phone,
                customer_email,
                address,
                scheduled_date,
                scheduled_time,
                total_amount,
                payment_method,
                items_json
            ))

            database.execute_write("DELETE FROM cart_items")

            self._send_json({
                "status": "success",
                "booking_id": booking_id,
                "total_amount": total_amount,
                "message": f"Booking #{booking_id} confirmed for {scheduled_date} at {scheduled_time} in {address}."
            })

        else:
            self._send_json({"error": "Not found"}, status=404)

    def do_DELETE(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path

        if path.startswith("/api/cart/"):
            try:
                service_id = int(path.split("/api/cart/")[1])
                database.execute_write("DELETE FROM cart_items WHERE service_id = ?", (service_id,))
                items = database.query_all("""
                    SELECT ci.id as cart_item_id, ci.quantity, s.* 
                    FROM cart_items ci
                    JOIN services s ON ci.service_id = s.id
                """)
                total_amount = sum(item["price"] * item["quantity"] for item in items)
                item_count = sum(item["quantity"] for item in items)
                self._send_json({"items": items, "item_count": item_count, "total_amount": total_amount})
            except Exception as e:
                self._send_json({"error": str(e)}, status=400)
        else:
            self._send_json({"error": "Not found"}, status=404)

    def log_message(self, format, *args):
        # Quiet standard logging for cleaner terminal
        return

def run():
    database.init_db()
    server_address = ("0.0.0.0", PORT)
    httpd = HTTPServer(server_address, Urbab366Handler)
    print(f"Urbab366 Python Backend listening on 0.0.0.0:{PORT}")
    httpd.serve_forever()

if __name__ == "__main__":
    run()
