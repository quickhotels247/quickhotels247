#!/usr/bin/env bash
# One-time setup of a fresh Ubuntu EC2 server for QuickHotels24/7.
# Run on the server as the ubuntu user:  bash setup-server.sh
# Safe to run again: each step skips what's already done.
set -euo pipefail

APP_DIR=/opt/quickhotels

echo "== System updates"
sudo apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get upgrade -y
# Security updates install themselves from now on; fail2ban blocks SSH guessing.
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y ca-certificates curl unattended-upgrades fail2ban
sudo systemctl enable --now fail2ban

echo "== Swap (2 GB): extra room so a busy moment never runs out of memory"
if ! swapon --show | grep -q /swapfile; then
  sudo fallocate -l 2G /swapfile
  sudo chmod 600 /swapfile
  sudo mkswap /swapfile
  sudo swapon /swapfile
  echo "/swapfile none swap sw 0 0" | sudo tee -a /etc/fstab >/dev/null
  echo "vm.swappiness=10" | sudo tee /etc/sysctl.d/99-swappiness.conf >/dev/null
  sudo sysctl --system >/dev/null
fi

echo "== Docker"
if ! command -v docker >/dev/null; then
  curl -fsSL https://get.docker.com | sudo sh
fi
sudo usermod -aG docker ubuntu
sudo systemctl enable --now docker

echo "== App folder"
sudo mkdir -p "$APP_DIR"
sudo chown ubuntu:ubuntu "$APP_DIR"
# Amazon RDS certificate authorities, for a verified database connection.
curl -fsSL -o "$APP_DIR/rds-ca.pem" https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem
if [ ! -f "$APP_DIR/.env.backend" ]; then
  touch "$APP_DIR/.env.backend"
  chmod 600 "$APP_DIR/.env.backend"
fi

echo
echo "Done. Next:"
echo "  1. Log out and back in (so 'docker' works without sudo)."
echo "  2. Fill $APP_DIR/.env.backend (see deploy/aws/.env.backend.example)."
echo "  3. Push to main (or run the 'Deploy to AWS' workflow) to start the site."
