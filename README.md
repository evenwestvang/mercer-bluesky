# mercer-bluesky
A weekend project from 👋 [Even](https://bsky.app/profile/even.westvang.com) to pummel you with the real-time Bluesky firehose.
Host yourself, or check out the one running on [bigmood.blue](https://bigmood.blue).

## Get it running
* `npm install && npm run start` in both client and server directories
* `TensorFlow.js` seems to not like some nodes newer than v20.17.0
* There are no authed APIs so there are no keys to get or secret handshakes to do with anyone

## Notes
As of mid November 2024 the Bluesky feed has tens of images per second in the feed. As I wanted a SFW option, I'm running content filtering server-side. To make this tractable on vCPUs I've throttled the feed down to 4 images/second. If you want to see all of it, you could disable the filtering and remove the throttling. You can't really absorb that many different images so I personally prefer a small stack of images being cropped, recycled and thrown out for a new batch.

## Why this thing?
In Philip K. Dick's "Do Androids Dream of Electric Sheep?", Mercer's empathy box created a shared fusion state through crude tactile interfaces. This digital experiment pulses the bluesky real-time feed at 60fps with forced black frames between each image, creating after-image burns across the retina. Multiple crops of the same source material phase and interlace with unrelated images, building a perceptual static. The effect might be empathy, might be noise, might be neither.
```
 
    ▲
  ▲|▲
 ◇||||◇
  |╫|
   ┼
 .:┣╋┫:.

    Æ0N
```

## Warnings
- Limit exposure to 5 minutes
- 30 minute minimum rest between attempts
- Absolutely not for those with photosensitive conditions 
- Effects subjective and unverified
- No warranty expressed or implied

## Production Deployment on Free GCP e2-micro Instance
The server is optimized to run on a free Google Cloud Platform e2-micro instance (0.5 vCPU, 1GB RAM). Using systemd for process management ensures reliable operation within these constraints.

Create the following systemd user service file at `~/.config/systemd/user/mercer-bluesky.service`:

```ini
[Unit]
Description=Mercer Bluesky Server
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
WorkingDirectory=/home/even/mercer-bluesky/server
ExecStart=/usr/local/bin/node /home/even/mercer-bluesky/server/server.js
Restart=always
RestartSec=10

# Environment settings
Environment=NODE_ENV=production
Environment=PATH=/usr/local/bin:/usr/bin:/bin

# System limits and monitoring (optimized for e2-micro)
CPUQuota=95%
MemoryHigh=1G
MemoryMax=1.5G

# Logging (using journald)
StandardOutput=journal
StandardError=journal

# Graceful shutdown settings
TimeoutStopSec=30
KillMode=mixed

[Install]
WantedBy=default.target
```

Enable and start the service:
```bash
systemctl --user enable mercer-bluesky.service
systemctl --user start mercer-bluesky.service
```

View logs with:
```bash
journalctl --user-unit mercer-bluesky.service
```
