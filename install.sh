#!/bin/bash

# Lol. Micro instance on gcp so check if service is running and stop it
if systemctl --user is-active --quiet mercer-bluesky; then
    echo "Stopping existing service..."
    systemctl --user stop mercer-bluesky
    sleep 2  # Give it time to fully stop
fi

# Wait for memory to settle
echo "Waiting for memory to free up..."
sleep 2

# Check available memory
FREE_MEM=$(free -m | awk '/^Mem:/{print $4}')
if [ $FREE_MEM -lt 500 ]; then
    echo "Warning: Low memory ($FREE_MEM MB). Waiting additional time..."
    sleep 30
fi

# Install dependencies and build client
cd client
npm install
npm run build
cd ..

# Install server dependencies
cd server
npm install
cd ..

# Ensure systemd user directory exists
mkdir -p ~/.config/systemd/user/

# Copy service file
cp ./systemd/mercer-bluesky.service ~/.config/systemd/user/

# Reload systemd user daemon
systemctl --user daemon-reload

# Enable and start service
systemctl --user enable mercer-bluesky
systemctl --user start mercer-bluesky

echo "Service installed and started. Check status with:"
echo "systemctl --user status mercer-bluesky"
