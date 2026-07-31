# Gelos Shopify Redirect Theme

Based on [Shopify’s hydrogen-redirect-theme](https://github.com/Shopify/hydrogen-redirect-theme).

After checkout, **Continue shopping** (and other Online Store links) hit
`*.myshopify.com`. This theme immediately redirects visitors to the Gelos
Next.js storefront on **www.gelosglobal.com**.

## Install (Shopify Admin)

1. Zip this folder (see command below), **or** use `shopify-redirect-theme.zip` if present in the repo root / `exports/`.
2. Shopify Admin → **Online Store** → **Themes** → **Add theme** → **Upload zip file**
3. Open the uploaded theme → **Customize**
4. **Theme settings** → **Storefront**
   - Hostname should already be `www.gelosglobal.com` (no `https://`)
   - Custom redirects already map `/products/` → `/product/`
5. **Publish** the theme (replace the old live Online Store theme)

## Test

1. Open `https://304deb-d0.myshopify.com` → should bounce to `https://www.gelosglobal.com`
2. Complete a test checkout → Thank you → **Continue shopping** → should land on `www.gelosglobal.com`

## Notes

- Does **not** change checkout. Checkout stays on `checkout.gelosglobal.com`.
- Keep this theme published as the live Online Store theme.
- Bot checkpoint / discount links still work (theme skips those paths).

## Zip from this repo

```bash
cd shopify-redirect-theme
zip -r ../exports/gelos-shopify-redirect-theme.zip . -x "*.git*" -x "*node_modules*" -x "*.DS_Store"
```
