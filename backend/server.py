import json
import urllib.parse
from http.server import HTTPServer, BaseHTTPRequestHandler
import sys
import os

# Add backend directory to sys.path
sys.path.append(os.path.dirname(__file__))
import database

PORT = int(os.environ.get("PORT", 8000))
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "Urbab366Admin2026!")
EXPERTISE_LEVELS = {"Fresher", "Intermediate", "Expert"}
AVAILABILITY_STATUSES = {"Available", "Busy", "Inactive"}
APPROVAL_STATUSES = {"Approved", "Pending"}


def _service_list(value):
    if isinstance(value, list):
        values = value
    elif isinstance(value, str):
        values = value.split(",")
    else:
        values = []
    services = []
    for service in values:
        clean = str(service).strip()
        if clean and clean.casefold() not in {item.casefold() for item in services}:
            services.append(clean)
    if not 1 <= len(services) <= 3:
        raise ValueError("Select between 1 and 3 services")
    return services


def _laborer_payload(body, existing=None, registered_by="Admin"):
    current = existing or {}

    def value(key, default=""):
        return body.get(key, current.get(key, default))

    services = _service_list(value("service_categories", value("service_category", "")))
    localities = value("preferred_localities", "")
    if isinstance(localities, list):
        localities = ", ".join(str(item).strip() for item in localities if str(item).strip())
    expertise = str(value("expertise_level", "Intermediate")).strip()
    availability = str(value("availability_status", "Available")).strip()
    approval = str(value("approval_status", "Pending" if registered_by == "Self" else "Approved")).strip()
    try:
        years = int(value("experience_years", 0))
    except (TypeError, ValueError):
        raise ValueError("experience_years must be a non-negative integer")
    if years < 0:
        raise ValueError("experience_years must be a non-negative integer")
    if expertise not in EXPERTISE_LEVELS:
        raise ValueError("expertise_level must be Fresher, Intermediate, or Expert")
    if availability not in AVAILABILITY_STATUSES:
        raise ValueError("availability_status must be Available, Busy, or Inactive")
    if approval not in APPROVAL_STATUSES:
        raise ValueError("approval_status must be Approved or Pending")

    name = str(value("name")).strip()
    phone = str(value("phone")).strip()
    address = str(value("full_address")).strip()
    localities = str(localities).strip()
    if not name or not phone:
        raise ValueError("Name and phone are required")
    if not existing and (not address or not localities):
        raise ValueError("Full address and preferred localities are required")

    return {
        "name": name,
        "phone": phone,
        "alternate_phone": str(value("alternate_phone")).strip(),
        "service_categories": ", ".join(services),
        "expertise_level": expertise,
        "experience_years": years,
        "full_address": address,
        "preferred_localities": localities,
        "rate": str(value("rate")).strip(),
        "languages_spoken": str(value("languages_spoken")).strip(),
        "registered_by": current.get("registered_by", registered_by),
        "approval_status": approval if registered_by != "Self" or existing else "Pending",
        "availability_status": availability,
    }


def _save_laborer(payload, laborer_id=None):
    columns = [
        "name", "phone", "alternate_phone", "service_categories", "expertise_level",
        "experience_years", "full_address", "preferred_localities", "rate",
        "languages_spoken", "registered_by", "approval_status", "availability_status",
    ]
    values = [payload[column] for column in columns]
    legacy_column = any(column["name"] == "service_category" for column in database.query_all("PRAGMA table_info(laborers)"))
    if legacy_column:
        columns.append("service_category")
        values.append(payload["service_categories"])
    if laborer_id is None:
        placeholders = ", ".join("?" for _ in columns)
        new_id = database.execute_write(
            f"INSERT INTO laborers ({', '.join(columns)}) VALUES ({placeholders})", tuple(values)
        )
        return database.query_one("SELECT * FROM laborers WHERE id = ?", (new_id,))
    assignments = ", ".join(f"{column} = ?" for column in columns)
    database.execute_write(
        f"UPDATE laborers SET {assignments} WHERE id = ?", tuple(values + [laborer_id])
    )
    return database.query_one("SELECT * FROM laborers WHERE id = ?", (laborer_id,))

class Urbab366Handler(BaseHTTPRequestHandler):
    def _send_cors_headers(self):
        origin = self.headers.get("Origin", "*")
        self.send_header("Access-Control-Allow-Origin", origin if origin else "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, X-Requested-With, Accept, Origin, x-admin-key, X-Admin-Key")
        self.send_header("Access-Control-Max-Age", "86400")

    def _is_admin_authorized(self):
        key = self.headers.get("x-admin-key") or self.headers.get("X-Admin-Key")
        return bool(key and key == ADMIN_PASSWORD)

    def do_OPTIONS(self):
        self.send_response(204)
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

        elif path == "/api/admin/verify":
            if not self._is_admin_authorized():
                return self._send_json({"error": "Unauthorized: Invalid admin key"}, status=401)
            self._send_json({"status": "ok", "message": "Admin authorized"})

        elif path == "/api/laborers/search":
            service = query_params.get("service", [""])[0].strip()
            locality = query_params.get("locality", [""])[0].strip()
            expertise = query_params.get("expertise", [""])[0].strip()
            if not service or not locality:
                return self._send_json({"error": "service and locality are required"}, status=400)
            sql = """
                SELECT * FROM laborers
                WHERE approval_status = 'Approved' AND availability_status = 'Available'
            """
            params = []
            if expertise:
                if expertise not in EXPERTISE_LEVELS:
                    return self._send_json({"error": "Invalid expertise level"}, status=400)
                sql += " AND expertise_level = ?"
                params.append(expertise)
            rows = database.query_all(sql + " ORDER BY id DESC", tuple(params))
            matching = []
            for laborer in rows:
                services = [item.strip() for item in (laborer.get("service_categories") or "").split(",") if item.strip()]
                if service.casefold() not in {item.casefold() for item in services}:
                    continue
                location_text = "{}, {}".format(
                    laborer.get("preferred_localities", ""), laborer.get("full_address", "")
                ).casefold()
                if locality.casefold() not in location_text:
                    continue
                laborer["service_list"] = services
                matching.append(laborer)
            self._send_json(matching)

        elif path == "/api/admin/laborers":
            if not self._is_admin_authorized():
                return self._send_json({"error": "Unauthorized: Invalid admin key"}, status=401)
            sql = "SELECT * FROM laborers WHERE 1=1"
            params = []
            if "locality" in query_params and query_params["locality"][0].strip():
                loc = query_params["locality"][0].strip()
                sql += " AND preferred_localities LIKE ?"
                params.append(f"%{loc}%")
            if "service" in query_params and query_params["service"][0].strip():
                service = query_params["service"][0].strip()
                sql += " AND service_categories LIKE ?"
                params.append(f"%{service}%")
            if "availability" in query_params and query_params["availability"][0].strip():
                sql += " AND availability_status = ?"
                params.append(query_params["availability"][0].strip())
            if "search" in query_params and query_params["search"][0].strip():
                term = query_params["search"][0].strip()
                sql += " AND (name LIKE ? OR phone LIKE ? OR preferred_localities LIKE ?)"
                params.extend([f"%{term}%", f"%{term}%", f"%{term}%"])
            sql += " ORDER BY id DESC"
            laborers = database.query_all(sql, tuple(params))
            for laborer in laborers:
                laborer["service_list"] = [
                    item.strip() for item in (laborer.get("service_categories") or "").split(",") if item.strip()
                ]
            self._send_json(laborers)

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

        elif path == "/api/laborers/register":
            try:
                laborer = _save_laborer(_laborer_payload(body, registered_by="Self"))
                self._send_json(laborer, status=201)
            except ValueError as error:
                self._send_json({"error": str(error)}, status=400)

        elif path == "/api/admin/verify":
            if self._is_admin_authorized():
                self._send_json({"status": "ok", "message": "Admin authorized"})
            else:
                self._send_json({"error": "Unauthorized: Invalid admin key"}, status=401)

        elif path == "/api/admin/laborers":
            if not self._is_admin_authorized():
                return self._send_json({"error": "Unauthorized: Invalid admin key"}, status=401)
            try:
                laborer = _save_laborer(_laborer_payload(body, registered_by="Admin"))
                self._send_json(laborer, status=201)
            except ValueError as error:
                self._send_json({"error": str(error)}, status=400)

        else:
            self._send_json({"error": "Not found"}, status=404)

    def do_PUT(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path

        if path.startswith("/api/admin/laborers/"):
            if not self._is_admin_authorized():
                return self._send_json({"error": "Unauthorized: Invalid admin key"}, status=401)
            try:
                laborer_id = int(path.split("/api/admin/laborers/")[1])
                existing = database.query_one("SELECT * FROM laborers WHERE id = ?", (laborer_id,))
                if not existing:
                    self._send_json({"error": "Laborer not found"}, status=404)
                    return

                body = self._parse_body()
                updated = _save_laborer(_laborer_payload(body, existing), laborer_id)
                self._send_json(updated)
            except ValueError as e:
                self._send_json({"error": str(e)}, status=400)
            except Exception as e:
                self._send_json({"error": str(e)}, status=400)
        else:
            self._send_json({"error": "Not found"}, status=404)

    def do_DELETE(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path

        if path.startswith("/api/admin/laborers/"):
            if not self._is_admin_authorized():
                return self._send_json({"error": "Unauthorized: Invalid admin key"}, status=401)
            try:
                laborer_id = int(path.split("/api/admin/laborers/")[1])
                existing = database.query_one("SELECT * FROM laborers WHERE id = ?", (laborer_id,))
                if not existing:
                    self._send_json({"error": "Laborer not found"}, status=404)
                    return
                database.execute_write("DELETE FROM laborers WHERE id = ?", (laborer_id,))
                self._send_json({"status": "success", "message": f"Laborer #{laborer_id} deleted."})
            except Exception as e:
                self._send_json({"error": str(e)}, status=400)

        elif path.startswith("/api/cart/"):
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
