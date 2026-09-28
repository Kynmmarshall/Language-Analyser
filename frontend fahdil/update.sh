#!/usr/bin/env bash
# The frontend is plain HTML/CSS/JS — there's no build step, so "deploying" it just
# means Nginx serves this folder's current files (see deploy/nginx.conf.sample).
#
# By default Nginx is expected to serve straight out of this frontend/ folder — nothing
# needs copying. If you'd rather Nginx serve from a separate web root, set WEB_ROOT
# before running:
#   WEB_ROOT=/var/www/yo-b ./update.sh
#
# Usage on the VPS:
#   cd /path/to/yo-b/frontend
#   ./update.sh
#
# One-time setup before the first run:
#   sudo apt install nginx
#   sudo cp deploy/nginx.conf.sample /etc/nginx/sites-available/yo-b
#   sudo ln -s /etc/nginx/sites-available/yo-b /etc/nginx/sites-enabled/
#   (edit the copied file: server_name, and the root path)
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$REPO_ROOT"

echo "==> [1/2] Pulling latest code"
if [ -d .git ]; then
  git pull --ff-only
else
  echo "    (not a git checkout — skipping pull; deploy your files here manually)"
fi

if [ -n "${WEB_ROOT:-}" ]; then
  echo "==> [2/2] Syncing this folder to $WEB_ROOT"
  mkdir -p "$WEB_ROOT"
  rsync -a --delete --exclude deploy --exclude update.sh ./ "$WEB_ROOT/"
else
  echo "==> [2/2] WEB_ROOT not set — leaving files in place"
  echo "    (make sure Nginx's root points at $REPO_ROOT)"
fi

echo "==> Reloading Nginx"
sudo nginx -t
sudo systemctl reload nginx

echo "==> Done."
