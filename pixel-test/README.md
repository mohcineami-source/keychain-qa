# Snap Pixel Test Harness

A throwaway static page for verifying that a Snapchat Pixel is wired up correctly. It loads the
pixel, fires `PAGE_VIEW`, then fires `PURCHASE`, and prints exactly what it sent on screen so you
can match it against Snap Events Manager.

This exists because Snap's Events Manager won't show you events from `localhost` — you need a real
hosted URL to confirm the pixel actually reports.

## Setup

Either hardcode the pixel ID:

```js
// index.html
var DEFAULT_PIXEL_ID = "PUT-YOUR-PIXEL-ID-HERE";
```

…or leave it and pass the ID at runtime: `https://<site>.netlify.app/?pixel=YOUR_PIXEL_ID`

## Query string overrides

| Param       | Default            | Notes                                        |
|-------------|--------------------|----------------------------------------------|
| `pixel`     | `DEFAULT_PIXEL_ID` | Pixel ID to init                             |
| `price`     | `1.00`             | Purchase value                               |
| `currency`  | `USD`              | ISO currency code                            |
| `txn`       | random per load    | Transaction ID                               |
| `auto`      | on                 | `?auto=0` fires only on button click         |

Transaction IDs are randomized per load and per manual fire, so repeat tests show up as distinct
events instead of being deduped into one.

## Verifying

1. Deploy, open the URL.
2. Check the on-page event log shows `init`, `PAGE_VIEW`, `PURCHASE`.
3. Install the [Snap Pixel Helper](https://chromewebstore.google.com/detail/snap-pixel-helper/hedgklpbhpjjmoncdaoglfnhdjahbhdd)
   extension to confirm the browser-side fire.
4. Open Snap Events Manager → your pixel → Event Activity. Allow a few minutes for it to appear.

## Deploy

Netlify, publish directory `pixel-test`. `netlify.toml` sets `X-Robots-Tag: noindex` and there's a
`robots.txt` disallowing everything, so it stays out of search results.

## Take it down when you're done

While this page is live, **every visitor is reported to Snapchat as a completed purchase.** If it's
reachable from a domain that gets real traffic — or if the pixel belongs to a live campaign — that
trains the optimizer on conversions that never happened and inflates the purchase count in Ads
Manager. On a client's pixel, that's the number they're being billed against.

It's a bench tool. Verify the pixel, then delete the deploy or unpublish the site.
