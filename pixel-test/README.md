# Snap Pixel Test Harness

A throwaway static page for verifying that Snapchat Pixels are wired up correctly. Enter one or more
pixel IDs, fire `PURCHASE` at all of them, and read back exactly what was sent so you can match it
against Snap Events Manager.

This exists because Events Manager won't show you events from `localhost` — you need a real hosted
URL to confirm a pixel actually reports.

## Using it

Open the page, paste pixel IDs into the box (one per line, or comma-separated), set price/currency,
and hit **Fire PURCHASE**. Nothing fires until you do — a plain visit to the bare URL only prefills
the form from your last session.

`Fire again` re-fires at the current pixels without reloading. Every fire gets a fresh
`transaction_id`, so Snap logs each as a distinct purchase instead of deduping them into one. A
single fire sends the *same* transaction_id to every listed pixel, which is correct: it's one
purchase reported to several pixels.

Invalid entries are flagged and skipped, and duplicate IDs collapse so a pixel is never double-fired.

## Query string

| Param      | Default | Notes                                             |
|------------|---------|---------------------------------------------------|
| `pixel`    | —       | Comma-separated IDs. **Presence of this fires on load.** |
| `price`    | `1.00`  | Purchase value                                     |
| `currency` | `USD`   | ISO code, upper-cased automatically                |
| `count`    | `1`     | Purchases per pixel, clamped to 1–20               |
| `auto`     | on      | `?auto=0` fills the form but doesn't fire on load  |

So `…/?pixel=ID_A,ID_B&price=160&currency=QAR&count=3` is a self-contained test — open it and it
fires 3 purchases at each of the two pixels.

## Why editing the pixel list reloads

Snap's library fires `track` at every pixel `init`-ed on the page, and there's no way to un-init one.
If you edited the list in place, events would keep going to pixels from the previous set. Submitting
the form reloads with the new list in the URL so the init set is always exactly what's on screen.

## Verifying

1. Open the URL with `?pixel=…`.
2. Check the on-page log shows `init` per pixel, then `PAGE_VIEW` and `PURCHASE`.
3. The [Snap Pixel Helper](https://chromewebstore.google.com/detail/snap-pixel-helper/hedgklpbhpjjmoncdaoglfnhdjahbhdd)
   extension confirms the browser-side fire independently.
4. Snap Events Manager → the pixel → Event Activity. Allow a few minutes.

If events never show up, check the pixel ID is actually owned by the Snapchat business you're looking
at (Business Manager → Pixels). Events fired at a pixel your account doesn't own are accepted by
Snapchat with HTTP 200 and simply never appear in your dashboard — it looks identical to a broken
pixel.

## Deploy

Netlify project `snap-pixel-test`, deploying from `keychain-qa` on `main`, base directory
`pixel-test`, publish `.`, no build command. `netlify.toml` sets `X-Robots-Tag: noindex` and
`robots.txt` disallows everything.

## Take it down when you're done

While a `?pixel=…` URL is live, **every visitor who opens it is reported to Snapchat as a completed
purchase.** That trains the optimizer on conversions that never happened and inflates the purchase
count in Ads Manager. On a client's pixel, that's the number they're being billed against.

Only ever point this at a pixel you own. It's a bench tool — verify, then delete the deploy.
