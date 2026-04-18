#!/bin/bash
set -e

# ─── Colors ───────────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

print_header() {
  echo ""
  echo -e "${BLUE}${BOLD}╔══════════════════════════════════════════════╗${NC}"
  echo -e "${BLUE}${BOLD}║      TPS Pro — One-Click Deploy              ║${NC}"
  echo -e "${BLUE}${BOLD}║      Total Property Solutions Pro            ║${NC}"
  echo -e "${BLUE}${BOLD}╚══════════════════════════════════════════════╝${NC}"
  echo ""
}

ok()   { echo -e "  ${GREEN}✔${NC}  $1"; }
info() { echo -e "  ${CYAN}→${NC}  $1"; }
warn() { echo -e "  ${YELLOW}⚠${NC}  $1"; }
ask()  { echo -e "  ${BOLD}?${NC}  $1"; }
step() { echo ""; echo -e "${BOLD}${BLUE}── $1 ──${NC}"; }

print_header

# ─── 1. Check Node ─────────────────────────────────────────────────────────────
step "Checking requirements"

if ! command -v node &>/dev/null; then
  echo -e "${RED}Node.js is required but not installed.${NC}"
  echo "  Install from https://nodejs.org then re-run this script."
  exit 1
fi
ok "Node.js $(node -v)"

if ! command -v npm &>/dev/null; then
  echo -e "${RED}npm is required but not installed.${NC}"
  exit 1
fi
ok "npm $(npm -v)"

# ─── 2. Install Railway CLI ────────────────────────────────────────────────────
step "Railway CLI"

if ! command -v railway &>/dev/null; then
  info "Installing Railway CLI..."
  npm install -g @railway/cli --silent
  ok "Railway CLI installed"
else
  ok "Railway CLI already installed ($(railway --version 2>/dev/null || echo 'ok'))"
fi

# ─── 3. Install Turso CLI ──────────────────────────────────────────────────────
step "Turso CLI (free cloud database)"

if ! command -v turso &>/dev/null; then
  info "Installing Turso CLI..."
  curl -sSfL https://get.tur.so/install.sh | bash -s -- --yes 2>/dev/null
  export PATH="$HOME/.turso:$PATH"
  ok "Turso CLI installed"
else
  ok "Turso CLI already installed"
fi

# Ensure turso is in PATH for this session
export PATH="$HOME/.turso:$PATH"

# ─── 4. Collect user config ───────────────────────────────────────────────────
step "Configuration"

echo ""
echo -e "  ${YELLOW}Enter your settings. Press Enter to skip optional fields.${NC}"
echo ""

ask "Your email address (used for admin notifications):"
read -r ADMIN_EMAIL
while [[ -z "$ADMIN_EMAIL" ]]; do
  ask "Email is required:"
  read -r ADMIN_EMAIL
done

ask "Gmail address for sending emails (or press Enter to skip):"
read -r SMTP_USER

SMTP_PASS=""
if [[ -n "$SMTP_USER" ]]; then
  ask "Gmail App Password (16 chars, from Google Account → Security → App Passwords):"
  read -rs SMTP_PASS
  echo ""
fi

ask "Twilio Account SID (press Enter to skip SMS):"
read -r TWILIO_SID

TWILIO_TOKEN=""
TWILIO_PHONE=""
if [[ -n "$TWILIO_SID" ]]; then
  ask "Twilio Auth Token:"
  read -rs TWILIO_TOKEN
  echo ""
  ask "Twilio Phone Number (e.g. +15550000000):"
  read -r TWILIO_PHONE
fi

# Generate a secure JWT secret
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(48).toString('hex'))")
ok "JWT secret generated"

# ─── 5. Login to Turso ────────────────────────────────────────────────────────
step "Setting up database (Turso)"

info "Opening Turso login in your browser..."
turso auth login

DB_NAME="tps-pro-$(date +%s)"
info "Creating database '$DB_NAME'..."
turso db create "$DB_NAME"

TURSO_URL=$(turso db show "$DB_NAME" --url)
TURSO_TOKEN=$(turso db tokens create "$DB_NAME")

ok "Database ready: $TURSO_URL"

# ─── 6. Login to Railway ──────────────────────────────────────────────────────
step "Deploying to Railway"

info "Opening Railway login in your browser..."
railway login

info "Creating Railway project..."
railway init --name "tps-pro"

# ─── 7. Set environment variables ─────────────────────────────────────────────
info "Setting environment variables..."

railway variables set \
  NODE_ENV=production \
  JWT_SECRET="$JWT_SECRET" \
  TURSO_DATABASE_URL="$TURSO_URL" \
  TURSO_AUTH_TOKEN="$TURSO_TOKEN" \
  ADMIN_EMAIL="$ADMIN_EMAIL"

if [[ -n "$SMTP_USER" && -n "$SMTP_PASS" ]]; then
  railway variables set \
    SMTP_HOST=smtp.gmail.com \
    SMTP_PORT=587 \
    SMTP_USER="$SMTP_USER" \
    SMTP_PASS="$SMTP_PASS" \
    FROM_EMAIL="$SMTP_USER"
  ok "Email (SMTP) configured"
else
  warn "Email skipped — you can add SMTP_USER / SMTP_PASS later in Railway dashboard"
fi

if [[ -n "$TWILIO_SID" && -n "$TWILIO_TOKEN" && -n "$TWILIO_PHONE" ]]; then
  railway variables set \
    TWILIO_ACCOUNT_SID="$TWILIO_SID" \
    TWILIO_AUTH_TOKEN="$TWILIO_TOKEN" \
    TWILIO_PHONE_NUMBER="$TWILIO_PHONE"
  ok "SMS (Twilio) configured"
else
  warn "SMS skipped — you can add Twilio vars later in Railway dashboard"
fi

ok "All variables set"

# ─── 8. Deploy ────────────────────────────────────────────────────────────────
info "Deploying... (this takes ~2 minutes)"
railway up --detach

# ─── 9. Get URL ───────────────────────────────────────────────────────────────
info "Fetching your live URL..."
sleep 5
APP_URL=$(railway domain 2>/dev/null || echo "")

if [[ -z "$APP_URL" ]]; then
  info "Generating domain..."
  railway domain
  APP_URL=$(railway domain 2>/dev/null || echo "")
fi

# ─── Done ─────────────────────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}${BOLD}╔══════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}${BOLD}║            Deploy Complete! 🎉               ║${NC}"
echo -e "${GREEN}${BOLD}╚══════════════════════════════════════════════╝${NC}"
echo ""
if [[ -n "$APP_URL" ]]; then
  echo -e "  ${BOLD}Your app:${NC} ${CYAN}https://$APP_URL${NC}"
else
  echo -e "  ${BOLD}Your app URL:${NC} run ${CYAN}railway domain${NC} to get it"
fi
echo ""
echo -e "  ${BOLD}Install on phone:${NC}"
echo -e "  → Open the URL in Chrome (Android) or Safari (iPhone)"
echo -e "  → Tap Share → 'Add to Home Screen'"
echo ""
echo -e "  ${BOLD}Install on computer:${NC}"
echo -e "  → Open in Chrome → click the ${CYAN}⊕${NC} install icon in the address bar"
echo ""
echo -e "  ${BOLD}Railway dashboard:${NC} ${CYAN}railway open${NC}"
echo ""
