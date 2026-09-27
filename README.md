# Pehriod

Period tracking that measures. Offline, private, in English, 한국어, မြန်မာ and العربية.

**Live:** https://pehriod.robbiemed.org

## What it does

- **One-tap bleeding log.** Pick pad, tampon, cup or liner once; after that each change is a single tap on light, half or soaked. Absorbency is remembered, shown as colored droplets (tampons use the FDA terms Light, Regular, Super, Super Plus, Ultra). Every change is scored with the Pictorial Blood loss Assessment Chart (Higham 1990). A period of 100 points or more, or 80 mL in a cup, is heavy menstrual bleeding.
- **Did it help?** An hour after each painkiller, one tap rates relief from none to complete. Over a few periods you see which medicine works for you, and poor NSAID response is flagged for your doctor.
- **Safe dosing.** 24-hour limits summed by active ingredient across combination products, minimum intervals, and conflicting-product checks.
- **Doctor visit.** A plain-language questionnaire covering bleeding, pain, anemia and bleeding-disorder screening, pregnancy, contraception and estrogen safety. The report prints in the patient's language and the doctor's, with logged data beside each answer and disagreements marked.
- **Optional trackers.** Weight, exercise minutes, resting pulse, stress, travel, sickness, basal temperature, cervical mucus and ovulation tests, with 90-day trends.

All data stays in the browser's localStorage. Export a JSON backup from Settings.

## Development

```bash
npm install
npm run dev     # http://localhost:3000
npm test        # runs in Asia/Seoul and America/Los_Angeles time zones
npm run lint
npm run build   # static export to ./out
```

Pushes to `main` deploy to GitHub Pages. See `CLAUDE.md` for architecture.

## License

ISC
