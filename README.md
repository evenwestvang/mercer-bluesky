# mercer-bluesky
A weekend project to pummel you with the Bluesky firehose.
Host yourself, or check out the one running at [bigmood.blue](https://bigmood.blue).
👋 [Even](https://bsky.app/profile/even.westvang.com)

## Run it
* `npm install && npm run start` in both client and server directories. tensorflow-js seems to want v20.17.0.
* There are no authed APIs so there are no keys to get or secret handshakes to do with anyone

## Notes
As of mid November 2024 the Bluesky feed has tens of images per second in the feed. As I wanted a SFW option, I'm running content filtering server-side. To make this tractable on vCPUs I've throttled the feed down to 4 images/second. If you want to see all of it, you could disable the filtering and remove the throttling. You can't really absorb that many different images so I personally prefer a small stack of images being cropped, recycled and thrown out for a new batch.

## Why this thing?
In Philip K. Dick's "Do Androids Dream of Electric Sheep?", Mercer's empathy box created a shared fusion state through crude tactile interfaces. This digital experiment pulses the bluesky real-time feed at 60fps with forced black frames between each image, creating after-image burns across the retina. Multiple crops of the same source material phase and interlace with unrelated images, building a perceptual static. The effect might be empathy, might be noise, might be neither.
```
     /\
    /  \
   /:.  \
  /:::   \
 /:::::   \
/::::::    \
     |  |
     |  |
   --+--+--
    Æ0N
```

## Warnings
- Limit exposure to 5 minutes
- 30 minute minimum rest between attempts
- Absolutely not for those with photosensitive conditions 
- Effects subjective and unverified
- No warranty expressed or implied
