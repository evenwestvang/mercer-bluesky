#!/bin/bash

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
