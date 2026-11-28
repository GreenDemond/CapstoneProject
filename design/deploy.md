# Putting the app on the web server (slice D1)

Only the parent runs this (DECISIONS T7). It copies just `index.html`, `css/` and `js/` to the server, and removes everything else there.

## What it does

1. `npm run build:site` makes a folder called `site/` with only the app files. It stops with a message if any file the app loads is missing.
2. `scripts/deploy-site.sh` copies `site/` to the server with rsync.

## How to run it (from the Mac, in the project folder)

Needs `rsync` (already on a Mac) and `ssh` access to the server.

1. Try it first. This changes nothing and lists what would happen:
   `scripts/deploy-site.sh hagan@ip-10-0-0-34:/var/www/localhost/htdocs/ben/CapstoneProject/`
2. If the list looks right, run it for real by adding `--yes`:
   `scripts/deploy-site.sh hagan@ip-10-0-0-34:/var/www/localhost/htdocs/ben/CapstoneProject/ --yes`

The server user and path above are the example from today; use your own if they differ.

## What gets deleted on the server

Everything not in `site/`. Right now that is these 7 files, which should not be public:
`.gitignore`, `dev-server.mjs`, `eslint.config.js`, `package.json`, `package-lock.json`, `playwright.config.js`, `server/suggest.js` (the `server/` folder goes too).

## Check afterwards

On 2026-11-27 `https://www.cih.com/ben/CapstoneProject/.git/config` was public (W-D6 in `design/web-parity-plan.md`). Open it now. It must say "404 Not Found". Also open the app and click through once.

## Optional extra safety in Apache

Hides any file starting with a dot, even if one lands there by mistake:

```
<FilesMatch "^\.">
  Require all denied
</FilesMatch>
```

or `RedirectMatch 404 /\.git`.
