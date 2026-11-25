import json
import urllib.parse
from http.server import HTTPServer, BaseHTTPRequestHandler
import hashlib
import math
import os
import re
import secrets
import sqlite3
import sys
import time

# Add backend directory to sys.path
sys.path.append(os.path.dirname(__file__))
import database
from werkzeug.security import check_password_hash, generate_password_hash

PORT = int(os.environ.get("PORT", 8000))
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "Urbab366Admin2026!")
CUSTOMER_SESSION_SECONDS = 30 * 24 * 60 * 60
EXPERTISE_LEVELS = {"Fresher", "Intermediate", "Expert"}
AVAILABILITY_STATUSES = {"Available", "Busy", "Inactive"}
APPROVAL_STATUSES = {"Approved", "Pending"}
SERVICE_OPTIONS = {
    "Carpenter", "Plumber", "Electrician", "Painter", "Mechanic",
    "Technician", "Appliance Repair", "AC Repair", "Mason", "Cleaning",
}
LOCALITY_OPTIONS = {
    "Koramangala", "Indiranagar", "Whitefield", "HSR Layout", "Jayanagar",
    "Electronic City", "Marathahalli", "Hebbal", "Richmond Town",
    "Malleshwaram", "Bellandur",
}
EMAIL_PATTERN = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")
PHONE_PATTERN = re.compile(r"^[6-9][0-9]{9}$")
RATE_PATTERN = re.compile(r"^(?:₹\s*)?([0-9]+(?:\.[0-9]+)?)(?:\s*/\s*visit)?$", re.IGNORECASE)


class FieldValidationError(Exception):
    def __init__(self, errors):
        super().__init__("Please correct the highlighted fields.")
        self.errors = errors


class InvalidRequestBody(Exception):
    pass


class LaborerPhoneConflict(Exception):
    pass


def _validation_response(errors):
    return {
        "success": False,
        "message": "Please correct the highlighted fields.",
        "errors": errors,
    }


def _valid_person_name(value):
    clean = value.strip()
    letters = [character for character in clean if character != " "]
    return (
        len(letters) >= 2
        and all(character.isalpha() or character == " " for character in clean)
    )


def _valid_optional_number(value, maximum=None):
    if isinstance(value, bool) or not isinstance(value, (str, int, float)):
        return None
    if isinstance(value, str) and not value.strip():
        return ""
    try:
        number = float(value)
    except (TypeError, ValueError):
        return None
    if not math.isfinite(number) or number < 0:
        return None
    if maximum is not None and number > maximum:
        return None
    return number


def _customer_profile(customer):
    return {key: customer[key] for key in ("id", "name", "email", "phone")}


def _create_customer_session(customer_id):
    token = secrets.token_urlsafe(32)
    token_hash = hashlib.sha256(token.encode("utf-8")).hexdigest()
    now = int(time.time())
    database.execute_write("DELETE FROM customer_sessions WHERE expires_at <= ?", (now,))
    database.execute_write(
        "INSERT INTO customer_sessions (customer_id, token_hash, expires_at) VALUES (?, ?, ?)",
        (customer_id, token_hash, now + CUSTOMER_SESSION_SECONDS)
    )
    return token


def _customer_from_token(token):
    token_hash = hashlib.sha256(token.encode("utf-8")).hexdigest()
    return database.query_one("""
        SELECT c.id, c.name, c.email, c.phone
        FROM customer_sessions s
        JOIN customers c ON c.id = s.customer_id
        WHERE s.token_hash = ? AND s.expires_at > ?
    """, (token_hash, int(time.time())))


def _laborer_payload(body, existing=None, registered_by="Admin"):
    current = existing or {}

    def value(key, default=""):
        return body[key] if key in body else current.get(key, default)

    errors = {}
    name_value = value("name")
    name = name_value.strip() if isinstance(name_value, str) else ""
    if not isinstance(name_value, str) or not _valid_person_name(name_value):
        errors["name"] = "Enter worker's full name (min 2 letters)."

    phone_value = value("phone")
    phone = phone_value if isinstance(phone_value, str) and PHONE_PATTERN.fullmatch(phone_value) else ""
    if not phone:
        errors["phone"] = "Enter a valid 10-digit Indian mobile number."

    services_value = value("service_categories", value("service_category"))
    if isinstance(services_value, str):
        raw_services = services_value.split(",")
    elif isinstance(services_value, list):
        raw_services = services_value
    else:
        raw_services = []
    services = [item.strip() for item in raw_services if isinstance(item, str)]
    service_by_casefold = {option.casefold(): option for option in SERVICE_OPTIONS}
    service_valid = (
        1 <= len(raw_services) <= 3
        and len(services) == len(raw_services)
        and all(services)
        and len({item.casefold() for item in services}) == len(services)
        and all(item.casefold() in service_by_casefold for item in services)
    )
    if not service_valid:
        errors["service_categories"] = "Select at least 1 service (maximum 3)."
    else:
        services = [service_by_casefold[item.casefold()] for item in services]

    expertise_value = value("expertise_level")
    expertise = expertise_value.strip() if isinstance(expertise_value, str) else ""
    if expertise not in EXPERTISE_LEVELS:
        errors["expertise_level"] = "Select an expertise level."

    address_value = value("full_address")
    address = address_value.strip() if isinstance(address_value, str) else ""
    if (
        not isinstance(address_value, str)
        or len(address) < 10
        or not any(character.isalnum() for character in address)
    ):
        errors["full_address"] = "Enter a complete street/area address (min 10 characters)."

    localities_value = value("preferred_localities")
    if isinstance(localities_value, str):
        raw_localities = localities_value.split(",")
    elif isinstance(localities_value, list):
        raw_localities = localities_value
    else:
        raw_localities = []
    localities = [item.strip() for item in raw_localities if isinstance(item, str)]
    locality_by_casefold = {option.casefold(): option for option in LOCALITY_OPTIONS}
    locality_valid = (
        len(localities) == len(raw_localities)
        and bool(localities)
        and all(localities)
        and len({item.casefold() for item in localities}) == len(localities)
        and all(item.casefold() in locality_by_casefold for item in localities)
    )
    if not locality_valid:
        errors["preferred_localities"] = "Select at least 1 Bangalore locality."
    else:
        localities = [locality_by_casefold[item.casefold()] for item in localities]

    alternate_value = value("alternate_phone")
    alternate_phone = ""
    if not isinstance(alternate_value, str):
        errors["alternate_phone"] = "Enter a valid 10-digit Indian mobile number."
    elif alternate_value:
        if not PHONE_PATTERN.fullmatch(alternate_value):
            errors["alternate_phone"] = "Enter a valid 10-digit Indian mobile number."
        elif phone and alternate_value == phone:
            errors["alternate_phone"] = "Alternate phone must be different from primary phone."
        else:
            alternate_phone = alternate_value

    years_value = value("experience_years")
    years = _valid_optional_number(years_value, maximum=60)
    if years is None:
        errors["experience_years"] = "Enter valid experience between 0 and 60 years."
        years = 0
    elif years == "":
        years = 0

    rate_value = value("rate")
    rate = ""
    if not isinstance(rate_value, (str, int, float)) or isinstance(rate_value, bool):
        errors["rate"] = "Enter a valid non-negative rate."
    elif isinstance(rate_value, str):
        rate = rate_value.strip()
        if rate:
            rate_match = RATE_PATTERN.fullmatch(rate)
            rate_amount = _valid_optional_number(rate_match.group(1)) if rate_match else None
            if rate_amount is None:
                errors["rate"] = "Enter a valid non-negative rate."
    else:
        rate_amount = _valid_optional_number(rate_value)
        if rate_amount is None:
            errors["rate"] = "Enter a valid non-negative rate."
        else:
            rate = str(rate_value)

    languages_value = value("languages_spoken")
    languages = languages_value.strip() if isinstance(languages_value, str) else ""
    if not isinstance(languages_value, str):
        errors["languages_spoken"] = "Enter languages as text."

    availability_value = value("availability_status", "Available")
    availability = availability_value.strip() if isinstance(availability_value, str) else ""
    if availability not in AVAILABILITY_STATUSES:
        errors["availability_status"] = "Select a valid availability status."

    approval_value = value("approval_status", "Pending" if registered_by == "Self" else "Approved")
    approval = approval_value.strip() if isinstance(approval_value, str) else ""
    if approval not in APPROVAL_STATUSES:
        errors["approval_status"] = "Select a valid approval status."

    if existing:
        required_fields = {
            "name": "Enter worker's full name (min 2 letters).",
            "phone": "Enter a valid 10-digit Indian mobile number.",
            "service_categories": "Select at least 1 service (maximum 3).",
            "expertise_level": "Select an expertise level.",
            "full_address": "Enter a complete street/area address (min 10 characters).",
            "preferred_localities": "Select at least 1 Bangalore locality.",
        }
        for field, message in required_fields.items():
            if field not in body and not (field == "service_categories" and "service_category" in body):
                errors[field] = message

    if errors:
        raise FieldValidationError(errors)

    return {
        "name": name,
        "phone": phone,
        "alternate_phone": alternate_phone,
        "service_categories": ", ".join(services),
        "expertise_level": expertise,
        "experience_years": years,
        "full_address": address,
        "preferred_localities": ", ".join(localities),
        "rate": rate,
        "languages_spoken": languages,
        "registered_by": current.get("registered_by", registered_by),
        "approval_status": approval if registered_by != "Self" or existing else "Pending",
        "availability_status": availability,
    }


def _save_laborer(payload, laborer_id=None):
    duplicate = database.query_one(
        "SELECT id FROM laborers WHERE phone = ? AND id != COALESCE(?, -1)",
        (payload["phone"], laborer_id)
    )
    if duplicate:
        raise LaborerPhoneConflict("A laborer with this phone number is already registered.")

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
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, Accept, Origin, x-admin-key, X-Admin-Key")
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
        try:
            content_length = int(self.headers.get("Content-Length", 0))
            if content_length > 0:
                raw_data = self.rfile.read(content_length)
                return json.loads(raw_data.decode("utf-8"))
            return {}
        except (ValueError, UnicodeDecodeError) as error:
            raise InvalidRequestBody("Request body must be valid JSON.") from error

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        query_params = urllib.parse.parse_qs(parsed.query)

        if path == "/api/health":
            self._send_json({"status": "ok", "city": "Bengaluru"})

        elif path == "/api/auth/me":
            authorization = self.headers.get("Authorization", "")
            scheme, separator, token = authorization.partition(" ")
            customer = _customer_from_token(token.strip()) if separator and scheme.lower() == "bearer" else None
            if not customer:
                return self._send_json({"error": "Invalid or expired customer session."}, status=401)
            self._send_json({"customer": _customer_profile(customer)})

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
        try:
            body = self._parse_body()
        except InvalidRequestBody:
            return self._send_json(
                _validation_response({"form": "Request body must be valid JSON."}),
                status=400
            )

        if path == "/api/auth/signup":
            if not isinstance(body, dict):
                return self._send_json(
                    _validation_response({"name": "Enter a valid full name (at least 2 letters)."}),
                    status=400
                )
            errors = {}
            name_value = body.get("name")
            name = name_value.strip() if isinstance(name_value, str) else ""
            if not isinstance(name_value, str) or not _valid_person_name(name_value):
                errors["name"] = "Enter a valid full name (at least 2 letters)."
            email_value = body.get("email")
            email = email_value.strip().lower() if isinstance(email_value, str) else ""
            if not isinstance(email_value, str) or not EMAIL_PATTERN.fullmatch(email):
                errors["email"] = "Enter a valid email address."
            phone_value = body.get("phone")
            phone = phone_value if isinstance(phone_value, str) and PHONE_PATTERN.fullmatch(phone_value) else ""
            if not phone:
                errors["phone"] = "Enter a valid 10-digit Indian mobile number."
            password = body.get("password")
            if (
                not isinstance(password, str)
                or not password.strip()
                or len(password) < 6
            ):
                errors["password"] = "Password must be at least 6 characters."
            if errors:
                return self._send_json(_validation_response(errors), status=400)
            if database.query_one("SELECT id FROM customers WHERE email = ?", (email,)):
                return self._send_json(
                    _validation_response({"email": "An account with this email already exists."}),
                    status=409
                )
            if database.query_one("SELECT id FROM customers WHERE phone = ?", (phone,)):
                return self._send_json(
                    _validation_response({"phone": "An account with this phone number already exists."}),
                    status=409
                )
            try:
                customer_id = database.execute_write("""
                    INSERT INTO customers (name, email, phone, password_hash)
                    VALUES (?, ?, ?, ?)
                """, (name, email, phone, generate_password_hash(password)))
            except sqlite3.IntegrityError:
                if database.query_one("SELECT id FROM customers WHERE email = ?", (email,)):
                    return self._send_json(
                        _validation_response({"email": "An account with this email already exists."}),
                        status=409
                    )
                if database.query_one("SELECT id FROM customers WHERE phone = ?", (phone,)):
                    return self._send_json(
                        _validation_response({"phone": "An account with this phone number already exists."}),
                        status=409
                    )
                raise
            customer = database.query_one(
                "SELECT id, name, email, phone FROM customers WHERE id = ?", (customer_id,)
            )
            self._send_json({
                "token": _create_customer_session(customer_id),
                "customer": _customer_profile(customer)
            }, status=201)

        elif path == "/api/auth/login":
            if not isinstance(body, dict):
                return self._send_json(
                    _validation_response({"email": "Enter a valid email address."}),
                    status=400
                )
            errors = {}
            email_value = body.get("email")
            email = email_value.strip().lower() if isinstance(email_value, str) else ""
            if not isinstance(email_value, str) or not EMAIL_PATTERN.fullmatch(email):
                errors["email"] = "Enter a valid email address."
            password = body.get("password")
            if not isinstance(password, str) or not password.strip():
                errors["password"] = "Password is required."
            if errors:
                return self._send_json(_validation_response(errors), status=400)
            customer = database.query_one("SELECT * FROM customers WHERE email = ?", (email,))
            if not customer or not check_password_hash(customer["password_hash"], password):
                return self._send_json({"error": "Invalid email or password."}, status=401)
            profile = _customer_profile(customer)
            self._send_json({"token": _create_customer_session(customer["id"]), "customer": profile})

        elif path == "/api/cart":
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
                if not isinstance(body, dict):
                    raise FieldValidationError({
                        "name": "Enter worker's full name (min 2 letters).",
                        "phone": "Enter a valid 10-digit Indian mobile number.",
                        "service_categories": "Select at least 1 service (maximum 3).",
                        "expertise_level": "Select an expertise level.",
                        "full_address": "Enter a complete street/area address (min 10 characters).",
                        "preferred_localities": "Select at least 1 Bangalore locality.",
                    })
                laborer = _save_laborer(_laborer_payload(body, registered_by="Self"))
                self._send_json(laborer, status=201)
            except LaborerPhoneConflict as error:
                self._send_json(_validation_response({"phone": str(error)}), status=409)
            except FieldValidationError as error:
                self._send_json(_validation_response(error.errors), status=400)

        elif path == "/api/admin/verify":
            admin_key = self.headers.get("x-admin-key") or self.headers.get("X-Admin-Key")
            if not admin_key:
                self._send_json(
                    _validation_response({"password": "Admin password is required."}),
                    status=400
                )
            elif self._is_admin_authorized():
                self._send_json({"status": "ok", "message": "Admin authorized"})
            else:
                self._send_json(
                    _validation_response({"password": "Invalid admin password."}),
                    status=401
                )

        elif path == "/api/admin/laborers":
            if not self._is_admin_authorized():
                return self._send_json({"error": "Unauthorized: Invalid admin key"}, status=401)
            try:
                if not isinstance(body, dict):
                    raise FieldValidationError({
                        "name": "Enter worker's full name (min 2 letters).",
                        "phone": "Enter a valid 10-digit Indian mobile number.",
                        "service_categories": "Select at least 1 service (maximum 3).",
                        "expertise_level": "Select an expertise level.",
                        "full_address": "Enter a complete street/area address (min 10 characters).",
                        "preferred_localities": "Select at least 1 Bangalore locality.",
                    })
                laborer = _save_laborer(_laborer_payload(body, registered_by="Admin"))
                self._send_json(laborer, status=201)
            except LaborerPhoneConflict as error:
                self._send_json(_validation_response({"phone": str(error)}), status=409)
            except FieldValidationError as error:
                self._send_json(_validation_response(error.errors), status=400)

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

                try:
                    body = self._parse_body()
                except InvalidRequestBody:
                    self._send_json(
                        _validation_response({"form": "Request body must be valid JSON."}),
                        status=400
                    )
                    return
                if not isinstance(body, dict):
                    raise FieldValidationError({
                        "name": "Enter worker's full name (min 2 letters).",
                        "phone": "Enter a valid 10-digit Indian mobile number.",
                        "service_categories": "Select at least 1 service (maximum 3).",
                        "expertise_level": "Select an expertise level.",
                        "full_address": "Enter a complete street/area address (min 10 characters).",
                        "preferred_localities": "Select at least 1 Bangalore locality.",
                    })
                updated = _save_laborer(_laborer_payload(body, existing), laborer_id)
                self._send_json(updated)
            except LaborerPhoneConflict as e:
                self._send_json(_validation_response({"phone": str(e)}), status=409)
            except FieldValidationError as e:
                self._send_json(_validation_response(e.errors), status=400)
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
