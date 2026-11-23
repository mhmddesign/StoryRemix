# StoryRemix Internationalization (i18n) & RTL Architecture

## 1. Multi-Language Support

StoryRemix supports three primary languages:
- **English (`en`)**: Default locale.
- **French (`fr`)**: Full UI coverage.
- **Arabic (`ar`)**: Bidirectional Right-to-Left (RTL) experience with localized typography.

All translations are strictly organized into 16 namespaces across JSON message catalogs:
1. `common`
2. `navigation`
3. `auth`
4. `profile`
5. `stories`
6. `editor`
7. `voting`
8. `discovery`
9. `gamification`
10. `economy`
11. `notifications`
12. `moderation`
13. `validation`
14. `errors`
15. `legal`
16. `accessibility`

---

## 2. Parity Test Enforcement

To prevent missing keys or untranslated UI elements from causing runtime crashes, StoryRemix includes an automated dictionary parity test:

File: `src/lib/__tests__/i18n-parity.test.ts`

### Rules Enforced:
- Every single key present in `messages/en.json` **MUST** exist in `messages/fr.json` and `messages/ar.json`.
- No key may be empty or contain only whitespace.
- Structure must match across all namespaces.

Run the parity test anytime you update messages:
```bash
npx vitest run src/lib/__tests__/i18n-parity.test.ts
```

---

## 3. Right-to-Left (RTL) Implementation

Arabic requires more than simply translating strings; it requires an authentic bidirectional visual interface.

### HTML Document Level Direction:
In `src/app/layout.tsx`:
```tsx
const isRtl = locale === "ar";
return (
  <html lang={locale} dir={isRtl ? "rtl" : "ltr"}>
    ...
  </html>
);
```

### CSS Layout & Typography Rules:
In `src/app/globals.css`:
- Arabic typography overrides:
  ```css
  [dir="rtl"] {
    font-family: var(--font-arabic), -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Tahoma, Arial, sans-serif;
  }
  ```
- Logical margins, paddings, and border radii:
  - Standard CSS logical properties are used where possible (`margin-inline-start`, `padding-inline-end`).
  - Lucide icons with directional meaning (e.g., chevrons, arrows, send icons) are flipped automatically when rendered under `[dir="rtl"]`:
    ```css
    [dir="rtl"] .rtl-flip {
      transform: scaleX(-1);
    }
    ```

---

## 4. Language Selection & Cookie Persistence

- Users can switch their language at any time via the language selector in the navbar and footer.
- The selection is stored in the cookie `NEXT_LOCALE` (`path=/; max-age=31536000; SameSite=Lax`).
- For authenticated users, selecting a language also updates their `profiles.preferred_language` in the database.
- Next.js 16 `src/proxy.ts` detects the cookie on incoming requests to route content without unwanted redirects.
