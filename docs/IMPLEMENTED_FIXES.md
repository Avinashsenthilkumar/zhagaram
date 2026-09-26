# ZHAGARAM EXIM – Applied Fixes

This archive is based on the supplied project and keeps the existing visual layout while applying the requested functional and responsive changes.

## Public website
- Homepage product/category cards use Swiper on mobile and tablet and retain the desktop grid.
- Product listing and related products use the same responsive slider/grid pattern.
- Product listing no longer renders the category thumbnail on the right side of each category heading.
- Product detail layout has responsive image framing, spacing and typography adjustments without changing the page structure.
- Product review data is loaded from the real `/api/products/:slug/reviews` endpoint.
- `Write a Review` opens a modal and submits through the real review API.
- Homepage testimonials load approved review data from `/api/testimonials`.
- Footer product links are loaded from the live `/api/categories` endpoint, so newly created categories appear automatically.
- WhatsApp widget is not mounted in the site shell.
- Login page is rendered without the public header/footer and has a password visibility toggle.

## Admin
- Admin has its own non-clickable logo header.
- Public footer and WhatsApp widget are not mounted on admin pages.
- Desktop sidebar is fixed below the admin header; content reserves the sidebar width.
- Mobile admin navigation is horizontally scrollable.
- Category and product create/edit forms open in modals.
- Category and product lists have pagination.
- Admin has a refresh button.
- Product/category edits preserve existing image data when no replacement image is selected.

## API/performance
- Public product/category responses no longer include stored base64 image payloads in their normal JSON responses.
- Product/category images are served through dedicated cached image endpoints.
- TanStack Router uses intent preloading and a short preload stale time to reduce navigation delay.
- Approved testimonial API filters to approved reviews and active products.
- Review moderation clears reviewer metadata when a review is moved back to Pending.
- Enquiry email templates and supplier/customer server validation remain connected to the existing SMTP flow.

## Hydration
- Root body uses `suppressHydrationWarning` for browser-injected extension attributes.
- The `bis_*` attributes shown in the reported warning are browser-extension injected attributes, not application attributes.
