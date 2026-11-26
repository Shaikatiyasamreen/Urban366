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
from datetime import date, datetime, timedelta, timezone

# Add backend directory to sys.path
sys.path.append(os.path.dirname(__file__))
import database
from werkzeug.security import check_password_hash, generate_password_hash

PORT = int(os.environ.get("PORT", 8000))
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "Urbab366Admin2026!")
CUSTOMER_SESSION_SECONDS = 30 * 24 * 60 * 60
EMPLOYEE_SESSION_SECONDS = 30 * 24 * 60 * 60
INDIA_TIMEZONE = timezone(timedelta(hours=5, minutes=30))
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
TIME_SLOTS = (
    "09:00 AM - 11:00 AM",
    "11:00 AM - 01:00 PM",
    "02:00 PM - 04:00 PM",
    "04:00 PM - 06:00 PM",
)


class FieldValidationError(Exception):
    def __init__(self, errors):
        super().__init__("Please correct the highlighted fields.")
        self.errors = errors


class InvalidRequestBody(Exception):
    pass


class LaborerPhoneConflict(Exception):
    pass


class EmployeeEmailConflict(Exception):
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


def _employee_profile(employee):
    return {
        key: employee[key]
        for key in (
            "id", "name", "email", "phone", "alternate_phone", "service_categories",
            "expertise_level", "experience_years", "full_address", "preferred_localities",
            "rate", "languages_spoken", "availability_status",
        )
    }


def _laborer_api_profile(laborer):
    profile = dict(laborer)
    profile.pop("password_hash", None)
    return profile


def _create_employee_session(employee_id):
    token = secrets.token_urlsafe(32)
    token_hash = hashlib.sha256(token.encode("utf-8")).hexdigest()
    now = int(time.time())
    database.execute_write("DELETE FROM employee_sessions WHERE expires_at <= ?", (now,))
    database.execute_write(
        "INSERT INTO employee_sessions (employee_id, token_hash, expires_at) VALUES (?, ?, ?)",
        (employee_id, token_hash, now + EMPLOYEE_SESSION_SECONDS)
    )
    return token


def _employee_from_token(token):
    token_hash = hashlib.sha256(token.encode("utf-8")).hexdigest()
    return database.query_one("""
        SELECT l.*
        FROM employee_sessions s
        JOIN laborers l ON l.id = s.employee_id
        WHERE s.token_hash = ? AND s.expires_at > ?
    """, (token_hash, int(time.time())))


def _bearer_token(handler):
    authorization = handler.headers.get("Authorization", "")
    scheme, separator, token = authorization.partition(" ")
    return token.strip() if separator and scheme.lower() == "bearer" else ""


def _valid_signup_password(password):
    return (
        isinstance(password, str)
        and len(password) >= 6
        and bool(password.strip())
        and re.search(r"[A-Z]", password) is not None
        and re.search(r"[0-9]", password) is not None
        and re.search(r"[^A-Za-z0-9\s*/]", password) is not None
        and "*" not in password
        and "/" not in password
    )


def _parse_slot(time_slot):
    start_text, end_text = time_slot.split(" - ", 1)
    start = datetime.strptime(start_text, "%I:%M %p").time()
    end = datetime.strptime(end_text, "%I:%M %p").time()
    return start, end


def sync_job_statuses(now=None):
    current = now or datetime.now(INDIA_TIMEZONE)
    rows = database.query_all("""
        SELECT id, status, job_date, time_slot
        FROM bookings
        WHERE employee_id IS NOT NULL
          AND status IN ('New Task Assigned', 'Pending', 'In Progress')
    """)
    for row in rows:
        scheduled_date = date.fromisoformat(row["job_date"])
        start_time, end_time = _parse_slot(row["time_slot"])
        starts_at = datetime.combine(scheduled_date, start_time, INDIA_TIMEZONE)
        ends_at = datetime.combine(scheduled_date, end_time, INDIA_TIMEZONE)
        next_status = row["status"]
        if next_status in {"New Task Assigned", "Pending"} and current >= starts_at:
            next_status = "In Progress"
        if next_status == "In Progress" and current >= ends_at:
            next_status = "Completed"
        if next_status != row["status"]:
            database.execute_write(
                "UPDATE bookings SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
                (next_status, row["id"])
            )


def _laborer_payload(body, existing=None, registered_by="Admin", self_approval="Pending"):
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
        "approval_status": approval if registered_by != "Self" or existing else self_approval,
        "availability_status": availability,
    }


def _save_laborer(payload, laborer_id=None):
    duplicate = database.query_one(
        "SELECT id FROM laborers WHERE phone = ? AND id != COALESCE(?, -1)",
        (payload["phone"], laborer_id)
    )
    if duplicate:
        raise LaborerPhoneConflict("A laborer with this phone number is already registered.")
    if payload.get("email"):
        duplicate_email = database.query_one(
            "SELECT id FROM laborers WHERE email = ? COLLATE NOCASE AND id != COALESCE(?, -1)",
            (payload["email"], laborer_id)
        )
        if duplicate_email:
            raise EmployeeEmailConflict("An employee with this email already exists.")

    columns = [
        "name", "phone", "alternate_phone", "service_categories", "expertise_level",
        "experience_years", "full_address", "preferred_localities", "rate",
        "languages_spoken", "registered_by", "approval_status", "availability_status",
    ]
    for optional_column in ("email", "password_hash"):
        if optional_column in payload:
            columns.append(optional_column)
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
        self.send_header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
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

        elif path == "/api/employee/me":
            employee = _employee_from_token(_bearer_token(self))
            if not employee:
                return self._send_json({"error": "Invalid or expired employee session."}, status=401)
            self._send_json({"employee": _employee_profile(employee)})

        elif path == "/api/employee/jobs":
            employee = _employee_from_token(_bearer_token(self))
            if not employee:
                return self._send_json({"error": "Invalid or expired employee session."}, status=401)
            sync_job_statuses()
            jobs = database.query_all("""
                SELECT id, customer_name, customer_phone, address, service_address,
                       service, job_date, time_slot, work_description, status,
                       created_at, updated_at
                FROM bookings
                WHERE employee_id = ?
                ORDER BY job_date ASC, time_slot ASC, id ASC
            """, (employee["id"],))
            self._send_json({"jobs": jobs})

        elif path == "/api/employee/slot-alerts":
            employee = _employee_from_token(_bearer_token(self))
            if not employee:
                return self._send_json({"error": "Invalid or expired employee session."}, status=401)
            alerts = database.query_all("""
                SELECT id, job_date, time_slot, service, customer_name, customer_phone,
                       address, work_description, status, created_at
                FROM slot_alerts
                WHERE employee_id = ? AND status = 'Requested'
                ORDER BY created_at DESC
            """, (employee["id"],))
            self._send_json({"alerts": alerts})

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
            if not self._is_admin_authorized():
                return self._send_json({"error": "Unauthorized: Invalid admin key"}, status=401)
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
                SELECT id, name, phone, alternate_phone, service_categories,
                       expertise_level, experience_years, full_address, preferred_localities,
                       rate, languages_spoken, registered_by, approval_status, availability_status
                FROM laborers
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

        elif path.startswith("/api/laborers/") and path.endswith("/slots"):
            try:
                laborer_id = int(path.split("/")[3])
            except (ValueError, IndexError):
                return self._send_json({"error": "Invalid employee id."}, status=400)
            job_date = query_params.get("date", [""])[0]
            try:
                requested_date = date.fromisoformat(job_date)
            except ValueError:
                return self._send_json(
                    _validation_response({"job_date": "Enter a valid job date."}), status=400
                )
            if requested_date < datetime.now(INDIA_TIMEZONE).date():
                return self._send_json(
                    _validation_response({"job_date": "Choose today or a future date."}), status=400
                )
            employee = database.query_one(
                "SELECT id FROM laborers WHERE id = ? AND approval_status = 'Approved' "
                "AND availability_status = 'Available'",
                (laborer_id,)
            )
            if not employee:
                return self._send_json({"error": "Available employee not found."}, status=404)
            bookings = database.query_all("""
                SELECT time_slot FROM bookings
                WHERE employee_id = ? AND job_date = ?
                  AND status IN ('New Task Assigned', 'Pending', 'In Progress')
            """, (laborer_id, job_date))
            unavailable = {booking["time_slot"] for booking in bookings}
            current = datetime.now(INDIA_TIMEZONE)
            if requested_date == current.date():
                for slot in TIME_SLOTS:
                    start_time, _ = _parse_slot(slot)
                    if datetime.combine(requested_date, start_time, INDIA_TIMEZONE) <= current:
                        unavailable.add(slot)
            self._send_json({
                "time_slots": list(TIME_SLOTS),
                "unavailable_slots": [slot for slot in TIME_SLOTS if slot in unavailable],
            })

        elif path == "/api/admin/laborers":
            if not self._is_admin_authorized():
                return self._send_json({"error": "Unauthorized: Invalid admin key"}, status=401)
            sql = """
                SELECT id, name, phone, alternate_phone, service_categories,
                       expertise_level, experience_years, full_address, preferred_localities,
                       rate, languages_spoken, registered_by, approval_status,
                       availability_status, email, created_at
                FROM laborers WHERE 1=1
            """
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

        elif path == "/api/admin/overview":
            if not self._is_admin_authorized():
                return self._send_json({"error": "Unauthorized: Invalid admin key"}, status=401)
            sync_job_statuses()
            filters = []
            params = []
            if query_params.get("date", [""])[0].strip():
                filters.append("b.job_date = ?")
                params.append(query_params["date"][0].strip())
            if query_params.get("employee_id", [""])[0].strip():
                try:
                    params.append(int(query_params["employee_id"][0]))
                except ValueError:
                    return self._send_json({"error": "Invalid employee filter."}, status=400)
                filters.append("b.employee_id = ?")
            if query_params.get("status", [""])[0].strip():
                status_filter = query_params["status"][0].strip()
                if status_filter == "Pending":
                    filters.append("b.status IN ('New Task Assigned', 'Pending')")
                elif status_filter in {"In Progress", "Completed"}:
                    filters.append("b.status = ?")
                    params.append(status_filter)
                else:
                    return self._send_json({"error": "Invalid status filter."}, status=400)
            where_clause = " AND ".join(filters) if filters else "1=1"
            employees = database.query_all("""
                SELECT l.id, l.name, l.phone, l.service_categories, l.preferred_localities,
                       COUNT(b.id) AS total_jobs,
                       SUM(CASE WHEN b.status IN ('New Task Assigned', 'Pending') THEN 1 ELSE 0 END) AS pending_jobs,
                       SUM(CASE WHEN b.status = 'In Progress' THEN 1 ELSE 0 END) AS in_progress_jobs,
                       SUM(CASE WHEN b.status = 'Completed' THEN 1 ELSE 0 END) AS completed_jobs,
                       (SELECT COUNT(*) FROM slot_alerts a
                        WHERE a.employee_id = l.id) AS missed_slot_demand
                FROM laborers l
                LEFT JOIN bookings b ON b.employee_id = l.id
                WHERE l.email IS NOT NULL AND l.email <> ''
                GROUP BY l.id
                ORDER BY l.name COLLATE NOCASE
            """)
            for employee in employees:
                completed = employee["completed_jobs"] or 0
                total = employee["total_jobs"] or 0
                employee["completion_rate"] = round((completed / total) * 100, 1) if total else 0
                for key in ("pending_jobs", "in_progress_jobs", "completed_jobs", "total_jobs"):
                    employee[key] = employee[key] or 0
            totals = database.query_one("""
                SELECT
                    (SELECT COUNT(*) FROM laborers WHERE email IS NOT NULL AND email <> '') AS total_employees,
                    COUNT(*) AS total_jobs,
                    SUM(CASE WHEN status IN ('New Task Assigned', 'Pending') THEN 1 ELSE 0 END) AS pending_jobs,
                    SUM(CASE WHEN status = 'In Progress' THEN 1 ELSE 0 END) AS in_progress_jobs,
                    SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) AS completed_jobs
                FROM bookings WHERE employee_id IS NOT NULL
            """)
            jobs = database.query_all(f"""
                SELECT b.id, b.employee_id, l.name AS employee_name,
                       b.customer_name, b.customer_phone, b.service_address, b.address,
                       b.service, b.job_date, b.time_slot, b.work_description,
                       b.status, b.created_at, b.updated_at
                FROM bookings b
                JOIN laborers l ON l.id = b.employee_id
                WHERE {where_clause}
                ORDER BY b.job_date DESC, b.time_slot DESC, b.id DESC
            """, tuple(params))
            self._send_json({
                "totals": {key: value or 0 for key, value in totals.items()},
                "employees": employees,
                "jobs": jobs,
            })

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
            if not _valid_signup_password(password):
                errors["password"] = (
                    "Password must contain at least 6 characters, one uppercase letter, "
                    "one digit, and one special character (excluding * and /), and must "
                    "not contain * or /."
                )
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

        elif path == "/api/employee/register":
            if not isinstance(body, dict):
                return self._send_json(
                    _validation_response({"name": "Enter worker's full name (min 2 letters)."}),
                    status=400
                )
            registration = dict(body)
            registration["approval_status"] = "Approved"
            registration["availability_status"] = "Available"
            try:
                email_value = body.get("email")
                email = email_value.strip().lower() if isinstance(email_value, str) else ""
                password = body.get("password")
                errors = {}
                if not isinstance(email_value, str) or not EMAIL_PATTERN.fullmatch(email):
                    errors["email"] = "Enter a valid email address."
                if not _valid_signup_password(password):
                    errors["password"] = (
                        "Password must contain at least 6 characters, one uppercase letter, "
                        "one digit, and one special character (excluding * and /), and must "
                        "not contain * or /."
                    )
                if errors:
                    return self._send_json(_validation_response(errors), status=400)
                profile = _laborer_payload(
                    registration, registered_by="Self", self_approval="Approved"
                )
                profile["email"] = email
                profile["password_hash"] = generate_password_hash(password)
                employee = _save_laborer(profile)
                self._send_json({
                    "token": _create_employee_session(employee["id"]),
                    "employee": _employee_profile(employee),
                }, status=201)
            except LaborerPhoneConflict as error:
                self._send_json(_validation_response({"phone": str(error)}), status=409)
            except EmployeeEmailConflict as error:
                self._send_json(_validation_response({"email": str(error)}), status=409)
            except FieldValidationError as error:
                self._send_json(_validation_response(error.errors), status=400)

        elif path == "/api/employee/login":
            if not isinstance(body, dict):
                return self._send_json(
                    _validation_response({
                        "identifier": "Enter a valid email address or 10-digit Indian mobile number.",
                        "password": "Password is required.",
                    }),
                    status=400
                )
            identifier_value = body.get("identifier")
            identifier = identifier_value.strip() if isinstance(identifier_value, str) else ""
            password = body.get("password")
            errors = {}
            if "@" in identifier:
                identifier = identifier.lower()
                if not EMAIL_PATTERN.fullmatch(identifier):
                    errors["identifier"] = "Enter a valid email address or 10-digit Indian mobile number."
            elif not PHONE_PATTERN.fullmatch(identifier):
                errors["identifier"] = "Enter a valid email address or 10-digit Indian mobile number."
            if not isinstance(password, str) or not password.strip():
                errors["password"] = "Password is required."
            if errors:
                return self._send_json(_validation_response(errors), status=400)
            column = "email" if "@" in identifier else "phone"
            employee = database.query_one(
                f"SELECT * FROM laborers WHERE {column} = ? COLLATE NOCASE",
                (identifier,)
            )
            if not employee or not employee.get("password_hash") or not check_password_hash(
                employee["password_hash"], password
            ):
                return self._send_json({"error": "Invalid email/phone or password."}, status=401)
            self._send_json({
                "token": _create_employee_session(employee["id"]),
                "employee": _employee_profile(employee),
            })

        elif path.startswith("/api/employee/slot-alerts/"):
            employee = _employee_from_token(_bearer_token(self))
            if not employee:
                return self._send_json({"error": "Invalid or expired employee session."}, status=401)
            route_parts = path.strip("/").split("/")
            try:
                alert_id = int(route_parts[3])
            except (ValueError, IndexError):
                return self._send_json({"error": "Invalid slot alert id."}, status=400)
            action = route_parts[4] if len(route_parts) > 4 else ""
            if action not in {"accept", "dismiss"}:
                return self._send_json({"error": "Unknown slot alert action."}, status=404)
            connection = database.get_db_connection()
            try:
                connection.execute("BEGIN IMMEDIATE")
                alert = connection.execute("""
                    SELECT * FROM slot_alerts
                    WHERE id = ? AND employee_id = ? AND status = 'Requested'
                """, (alert_id, employee["id"])).fetchone()
                if not alert:
                    connection.rollback()
                    return self._send_json(
                        {"error": "Slot request not found or already handled."}, status=404
                    )
                if action == "dismiss":
                    connection.execute(
                        "UPDATE slot_alerts SET status = 'Dismissed', updated_at = CURRENT_TIMESTAMP WHERE id = ?",
                        (alert_id,)
                    )
                    connection.commit()
                    return self._send_json({"status": "Dismissed"})
                cursor = connection.execute("""
                    INSERT INTO bookings
                        (customer_name, customer_phone, address, scheduled_date, scheduled_time,
                         total_amount, payment_method, items_json, status, employee_id, job_date,
                         time_slot, service, service_address, work_description)
                    VALUES (?, ?, ?, ?, ?, 0, 'Employee booking', ?, 'Pending', ?, ?, ?, ?, ?, ?)
                """, (
                    alert["customer_name"], alert["customer_phone"], alert["address"],
                    alert["job_date"], alert["time_slot"], json.dumps([{"title": alert["service"]}]),
                    employee["id"], alert["job_date"], alert["time_slot"], alert["service"],
                    alert["address"], alert["work_description"],
                ))
                booking_id = cursor.lastrowid
                connection.execute("""
                    UPDATE slot_alerts
                    SET status = 'Accepted', booking_id = ?, updated_at = CURRENT_TIMESTAMP
                    WHERE id = ?
                """, (booking_id, alert_id))
                connection.commit()
            except Exception:
                connection.rollback()
                raise
            finally:
                connection.close()
            return self._send_json({"status": "Accepted", "booking_id": booking_id}, status=201)

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
            if isinstance(body, dict) and "employee_id" in body:
                employee_customer = _customer_from_token(_bearer_token(self))
                if not employee_customer:
                    return self._send_json(
                        {"error": "Sign in to your customer account before booking."}, status=401
                    )
                errors = {}
                employee_id = body.get("employee_id")
                if isinstance(employee_id, bool) or not isinstance(employee_id, int) or employee_id < 1:
                    errors["employee_id"] = "Choose a valid employee."
                service_value = body.get("service")
                service = service_value.strip() if isinstance(service_value, str) else ""
                service_by_casefold = {option.casefold(): option for option in SERVICE_OPTIONS}
                if service.casefold() not in service_by_casefold:
                    errors["service"] = "Choose a valid service."
                else:
                    service = service_by_casefold[service.casefold()]
                job_date = body.get("job_date")
                if not isinstance(job_date, str):
                    errors["job_date"] = "Enter a valid job date."
                else:
                    try:
                        parsed_date = date.fromisoformat(job_date)
                        if parsed_date < datetime.now(INDIA_TIMEZONE).date():
                            errors["job_date"] = "Choose today or a future date."
                    except ValueError:
                        errors["job_date"] = "Enter a valid job date."
                time_slot = body.get("time_slot")
                if not isinstance(time_slot, str) or time_slot not in TIME_SLOTS:
                    errors["time_slot"] = "Choose a valid time slot."
                elif isinstance(job_date, str) and re.fullmatch(r"\d{4}-\d{2}-\d{2}", job_date):
                    requested_start, _ = _parse_slot(time_slot)
                    current = datetime.now(INDIA_TIMEZONE)
                    if job_date == current.date().isoformat() and datetime.combine(
                        current.date(), requested_start, INDIA_TIMEZONE
                    ) <= current:
                        errors["time_slot"] = "Choose a future time slot."
                address_value = body.get("service_address")
                address = address_value.strip() if isinstance(address_value, str) else ""
                if not isinstance(address_value, str) or len(address) < 10:
                    errors["service_address"] = "Enter a complete service address (min 10 characters)."
                elif not any(city in address.casefold() for city in ("bengaluru", "bangalore")):
                    errors["service_address"] = "Enter a service address in Bengaluru."
                description_value = body.get("work_description", "")
                description = description_value.strip() if isinstance(description_value, str) else ""
                if not isinstance(description_value, str):
                    errors["work_description"] = "Enter work notes as text."
                if errors:
                    return self._send_json(_validation_response(errors), status=400)

                employee = database.query_one(
                    "SELECT * FROM laborers WHERE id = ? AND approval_status = 'Approved' "
                    "AND availability_status = 'Available'",
                    (employee_id,)
                )
                if not employee:
                    return self._send_json({"error": "Available employee not found."}, status=404)
                supported_services = {
                    item.strip().casefold()
                    for item in (employee.get("service_categories") or "").split(",")
                    if item.strip()
                }
                if service.casefold() not in supported_services:
                    return self._send_json(
                        _validation_response({"service": "This employee does not offer that service."}),
                        status=400
                    )

                connection = database.get_db_connection()
                try:
                    connection.execute("BEGIN IMMEDIATE")
                    active_jobs = connection.execute("""
                        SELECT time_slot FROM bookings
                        WHERE employee_id = ? AND job_date = ?
                          AND status IN ('New Task Assigned', 'Pending', 'In Progress')
                    """, (employee_id, job_date)).fetchall()
                    requested_start, requested_end = _parse_slot(time_slot)
                    requested_start_minutes = requested_start.hour * 60 + requested_start.minute
                    requested_end_minutes = requested_end.hour * 60 + requested_end.minute
                    has_conflict = False
                    for active_job in active_jobs:
                        existing_start, existing_end = _parse_slot(active_job["time_slot"])
                        existing_start_minutes = existing_start.hour * 60 + existing_start.minute
                        existing_end_minutes = existing_end.hour * 60 + existing_end.minute
                        if (
                            requested_start_minutes < existing_end_minutes
                            and existing_start_minutes < requested_end_minutes
                        ):
                            has_conflict = True
                            break
                    if has_conflict:
                        connection.execute("""
                            INSERT INTO slot_alerts
                                (employee_id, job_date, time_slot, service, customer_id,
                                 customer_name, customer_phone, address, work_description)
                            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                        """, (
                            employee_id, job_date, time_slot, service, employee_customer["id"],
                            employee_customer["name"], employee_customer["phone"], address, description,
                        ))
                        connection.commit()
                        return self._send_json({
                            "error": (
                                "This employee is already booked for this time slot. Please choose "
                                "another available slot (available slots for this date are highlighted)."
                            ),
                            "unavailable_slots": [job["time_slot"] for job in active_jobs],
                        }, status=409)
                    cursor = connection.execute("""
                        INSERT INTO bookings
                            (customer_name, customer_phone, customer_email, address,
                             scheduled_date, scheduled_time, total_amount, payment_method,
                             items_json, status, employee_id, job_date, time_slot, service,
                             service_address, work_description)
                        VALUES (?, ?, ?, ?, ?, ?, 0, 'Employee booking', ?, 'Pending',
                                ?, ?, ?, ?, ?, ?)
                    """, (
                        employee_customer["name"], employee_customer["phone"], employee_customer["email"],
                        address, job_date, time_slot, json.dumps([{"title": service}]),
                        employee_id, job_date, time_slot, service, address, description,
                    ))
                    booking_id = cursor.lastrowid
                    connection.commit()
                except Exception:
                    connection.rollback()
                    raise
                finally:
                    connection.close()
                self._send_json({
                    "status": "success",
                    "booking_id": booking_id,
                    "message": f"Your {service} booking for {job_date} at {time_slot} is confirmed.",
                }, status=201)
                return

            if not isinstance(body, dict):
                return self._send_json(
                    _validation_response({
                        "customer_name": "Enter a valid full name (at least 2 letters).",
                        "customer_phone": "Enter a valid 10-digit Indian mobile number.",
                    }),
                    status=400
                )
            customer_name_value = body.get("customer_name")
            customer_name = customer_name_value.strip() if isinstance(customer_name_value, str) else ""
            customer_phone = body.get("customer_phone")
            customer_email = body.get("customer_email", "")
            address_value = body.get("address", "3, Norris Rd, Richmond Town, Bengaluru")
            address = address_value.strip() if isinstance(address_value, str) else ""
            scheduled_date = body.get("scheduled_date", "Today")
            scheduled_time = body.get("scheduled_time", "03:00 PM - 04:00 PM")
            payment_method = body.get("payment_method", "Cash on Delivery")
            booking_errors = {}
            if not isinstance(customer_name_value, str) or not _valid_person_name(customer_name_value):
                booking_errors["customer_name"] = "Enter a valid full name (at least 2 letters)."
            if not isinstance(customer_phone, str) or not PHONE_PATTERN.fullmatch(customer_phone):
                booking_errors["customer_phone"] = "Enter a valid 10-digit Indian mobile number."
            if not isinstance(address_value, str) or len(address) < 10:
                booking_errors["address"] = "Enter a complete service address (min 10 characters)."
            if not isinstance(scheduled_date, str) or not scheduled_date.strip():
                booking_errors["scheduled_date"] = "Choose a booking date."
            if not isinstance(scheduled_time, str) or not scheduled_time.strip():
                booking_errors["scheduled_time"] = "Choose a booking time."
            if not isinstance(customer_email, str):
                booking_errors["customer_email"] = "Enter a valid email address."
            elif customer_email.strip() and not EMAIL_PATTERN.fullmatch(customer_email.strip()):
                booking_errors["customer_email"] = "Enter a valid email address."
            if not isinstance(payment_method, str) or payment_method not in {
                "Cash on Delivery", "UPI on Visit", "Card"
            }:
                booking_errors["payment_method"] = "Choose a valid payment method."
            if booking_errors:
                return self._send_json(_validation_response(booking_errors), status=400)
            customer_email = customer_email.strip().lower()
            scheduled_date = scheduled_date.strip()
            scheduled_time = scheduled_time.strip()

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
                self._send_json(_laborer_api_profile(laborer), status=201)
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
                self._send_json(_laborer_api_profile(laborer), status=201)
            except LaborerPhoneConflict as error:
                self._send_json(_validation_response({"phone": str(error)}), status=409)
            except FieldValidationError as error:
                self._send_json(_validation_response(error.errors), status=400)

        else:
            self._send_json({"error": "Not found"}, status=404)

    def do_PUT(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path

        if path == "/api/employee/me":
            employee = _employee_from_token(_bearer_token(self))
            if not employee:
                return self._send_json({"error": "Invalid or expired employee session."}, status=401)
            try:
                body = self._parse_body()
                if not isinstance(body, dict):
                    raise FieldValidationError({
                        "name": "Enter worker's full name (min 2 letters).",
                        "phone": "Enter a valid 10-digit Indian mobile number.",
                        "service_categories": "Select at least 1 service (maximum 3).",
                        "expertise_level": "Select an expertise level.",
                        "full_address": "Enter a complete street/area address (min 10 characters).",
                        "preferred_localities": "Select at least 1 Bangalore locality.",
                    })
                profile = _laborer_payload(body, employee, registered_by="Self")
                profile["registered_by"] = "Self"
                profile["approval_status"] = employee["approval_status"]
                profile["availability_status"] = employee["availability_status"]
                updated = _save_laborer(profile, employee["id"])
                self._send_json({"employee": _employee_profile(updated)})
            except InvalidRequestBody:
                self._send_json(
                    _validation_response({"form": "Request body must be valid JSON."}),
                    status=400
                )
            except LaborerPhoneConflict as error:
                self._send_json(_validation_response({"phone": str(error)}), status=409)
            except FieldValidationError as error:
                self._send_json(_validation_response(error.errors), status=400)

        elif path.startswith("/api/admin/laborers/"):
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
                self._send_json(_laborer_api_profile(updated))
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

    def do_PATCH(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        if not path.startswith("/api/employee/jobs/") or not path.endswith("/status"):
            return self._send_json({"error": "Not found"}, status=404)
        employee = _employee_from_token(_bearer_token(self))
        if not employee:
            return self._send_json({"error": "Invalid or expired employee session."}, status=401)
        route_parts = path.strip("/").split("/")
        try:
            job_id = int(route_parts[3])
        except (ValueError, IndexError):
            return self._send_json({"error": "Invalid job id."}, status=400)
        try:
            body = self._parse_body()
        except InvalidRequestBody:
            return self._send_json(
                _validation_response({"status": "Choose a valid job status."}), status=400
            )
        if not isinstance(body, dict) or body.get("status") not in {"In Progress", "Completed"}:
            return self._send_json(
                _validation_response({"status": "Choose a valid job status."}), status=400
            )
        job = database.query_one(
            "SELECT id, status FROM bookings WHERE id = ? AND employee_id = ?",
            (job_id, employee["id"])
        )
        if not job:
            return self._send_json({"error": "Assigned job not found."}, status=404)
        requested_status = body["status"]
        allowed = (
            requested_status == "In Progress" and job["status"] in {"New Task Assigned", "Pending"}
        ) or (
            requested_status == "Completed" and job["status"] == "In Progress"
        )
        if not allowed and requested_status != job["status"]:
            return self._send_json(
                {"error": "Job status can only progress from Pending to In Progress to Completed."},
                status=409
            )
        if requested_status != job["status"]:
            database.execute_write(
                "UPDATE bookings SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
                (requested_status, job_id)
            )
        self._send_json({"status": requested_status, "job_id": job_id})

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
