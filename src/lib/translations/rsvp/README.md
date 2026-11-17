# RSVP translations

The public RSVP page (`/rsvp`) is translated from three JSON files:

| File        | Purpose                                              |
| ----------- | ---------------------------------------------------- |
| `en.json`   | **Source text.** English wording lives here.         |
| `hu.json`   | Hungarian — edit this one.                           |
| `ro.json`   | Romanian — edit this one.                            |

## How to translate

1. Open `hu.json` and `ro.json` and replace the text after each key.
2. Keep every key and the JSON structure exactly as it is — the key names are
   what the page looks up.
3. Keep placeholders exactly as written, including the braces:
   `{name}`, `{venue}`, `{date}`, `{count}`.
4. A missing, renamed or blank value falls back to the English text, so a
   half-finished file will never leave an empty spot on the page.
5. Keep the same tone throughout. The English uses "we/us" for the couple and
   addresses a single guest ("your name", "will you join us?"). If you prefer
   the formal or plural form of address, apply it consistently to every string,
   including the buttons, errors and success message.

The current `hu.json` and `ro.json` are drafts and are meant to be revised in
place.

## Plural forms

`success.partySize` is chosen automatically from the attendee count:

- `one` — used for 1
- `few` — Romanian only, used for 0 and 2–19
- `other` — everything else (English and Hungarian use only `one`/`other`)

Use `{count}` inside each form:

```json
"partySize": {
  "one": "1 person",
  "other": "{count} people"
}
```

```json
"partySize": {
  "one": "{count} persoană",
  "few": "{count} persoane",
  "other": "{count} de persoane"
}
```

## Where the strings appear

- `languageLabel`, `venueLine`, `saveTheDate`, `longDate`, `ceremonyLine`,
  `kindlyReply`, `willYouJoin`, `intro`, `footer` — the page header and intro.
- `form.*` — labels, placeholders, hints, buttons and validation errors.
- `form.errors.*` — shown when validation fails or saving does not work.
- `success.*` — the thank-you screen, including the attendee list heading.
- `meals.*` — the four menu choices: meat, vegetarian, vegan, children's menu.

Dates (`longDate`, `acceptNote`) are free text, so use the natural date format
for the language. The ceremony time is 15:00.
