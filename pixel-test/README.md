# Pixel Test Harness — Snapchat + TikTok

A throwaway static page for verifying that Snapchat and/or TikTok pixels are wired up correctly.
Enter pixel IDs, fire a purchase at all of them, and read back exactly what was sent so you can match
it against each platform's dashboard.

This exists because neither Events Manager shows you events from `localhost` — you need a real hosted
URL to confirm a pixel actually reports.

| Platform  | ID format                          | Event fired       |
|-----------|------------------------------------|-------------------|
| Snapchat  | UUID (`ab4c0065-91ac-…`)           | `PURCHASE`        |
| TikTok    | 20-char (`CR1IO6JC77U9OU7LOMOG`)   | `CompletePayment` |

## Using it

Open the page, paste IDs into the Snapchat box and/or the TikTok box (one per line or comma-separated),
set price/currency, and hit **Fire purchase**. You can fill one box or both. Nothing fires until you
hit the button — a plain visit to the bare URL only prefills the form from your last session.

`Fire again` re-fires at the current pixels without reloading. One fire sends the *same* id to every
pixel — Snap's `transaction_id`, TikTok's `event_id` — which is correct: it's one purchase reported to
several pixels. Each fire gets a fresh id, so repeats log as distinct purchases instead of deduping.

Invalid entries are flagged and skipped; duplicates collapse so a pixel is never double-fired. A
TikTok ID in the Snap box (or vice-versa) fails validation because the two formats are distinct.

## Query string

| Param      | Default | Notes                                                        |
|------------|---------|--------------------------------------------------------------|
| `snap`     | —       | Comma-separated Snap IDs. Presence fires on load.            |
| `tiktok`   | —       | Comma-separated TikTok IDs. Presence fires on load.          |
| `pixel`    | —       | Alias for `snap` (backward compatibility).                   |
| `price`    | `1.00`  | Purchase value.                                              |
| `currency` | `USD`   | ISO code, upper-cased automatically.                         |
| `count`    | `1`     | Purchases per pixel, clamped to 1–20.                        |
| `auto`     | on      | `?auto=0` fills the form but doesn't fire on load.           |

So `…/?snap=UUID&tiktok=CR1IO6JC77U9OU7LOMOG&price=160&currency=QAR&count=3` is a self-contained test:
open it and it fires 3 purchases at each listed pixel across both platforms.

## Why editing a pixel list reloads

Both SDKs fire at every pixel loaded on the page and offer no way to un-load one. If you edited a list
in place, events would keep going to pixels from the previous set. Submitting the form reloads with the
lists in the URL so the loaded set is always exactly what's on screen. Only the SDKs you actually use
get loaded — a Snap-only test never pulls in TikTok's script, and vice-versa.

## Verifying

1. Open the URL with `?snap=…` and/or `?tiktok=…`.
2. Check the on-page log shows load/init per pixel, then the page view and purchase events.
3. Browser-side helpers confirm the fire independently:
   [Snap Pixel Helper](https://chromewebstore.google.com/detail/snap-pixel-helper/hedgklpbhpjjmoncdaoglfnhdjahbhdd)
   and [TikTok Pixel Helper](https://chromewebstore.google.com/detail/tiktok-pixel-helper/aelgobmabdmbmbfnnegmowpapglbmdgb).
4. Snapchat: Events Manager → the pixel → Event Activity. TikTok: Events Manager → the pixel → Test
   Events / overview. Allow a few minutes.

If events never show up, check the ID is actually owned by the account you're looking at. Events fired
at a pixel your account doesn't own are accepted with HTTP 200 and simply never appear in your
dashboard — it looks identical to a broken pixel. (This is exactly what happened on the first Snap
test: `ab4c0065-…` wasn't in the LAWAZEM business's pixel list.)

## Deploy

Netlify project `snap-pixel-test`, deploying from `keychain-qa` on `main`, base directory `pixel-test`,
publish `.`, no build command. `netlify.toml` sets `X-Robots-Tag: noindex` and `robots.txt` disallows
everything. Auto-deploys on every push to `main`.

## Take it down when you're done

While a firing URL is live, **every visitor who opens it is reported as a completed purchase** on
whatever pixels are in the URL. That trains the optimizer on conversions that never happened and
inflates the purchase count in Ads Manager. On a client's pixel, that's the number they're being
billed against.

Only ever point this at pixels you own. It's a bench tool — verify, then delete the deploy.
