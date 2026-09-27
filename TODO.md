# Pehriod TODO

## Next
- [ ] Android APK via Capacitor (webDir `out`); disable the service worker in the native build
- [ ] Scheduled local notification for the 60-minute relief question (Capacitor Local Notifications)
- [ ] Health Connect read on Android: menstruation flow/period, cervical mucus, BBT, ovulation test, weight, resting heart rate, exercise
- [ ] Apple Health `export.xml` import, streamed in a worker
- [ ] Ovulation confirmation from basal temperature (three-over-six rule)
- [ ] Monthly NSAID exposure warning (10+ days, 15+ days)
- [ ] PMDD pattern: mood logs concentrated in the luteal phase
- [ ] Naproxen 440 mg first dose option
- [ ] Clinical review of Guide text (heat therapy duration, stress/cortisol claim, "every 6 hours" strategy wording)

## Done in 3.0
- [x] Local-date handling; fixes calendar freeze and off-by-one dates east of UTC
- [x] Reaching a daily limit exactly is allowed (third ibuprofen, 660 mg naproxen, sixth acetaminophen)
- [x] One-tap product logging with PBAC scoring, clots, leaks, cups in mL, auto-start/end of periods
- [x] Relief ratings after each dose, per-medicine stats, NSAID non-response flag
- [x] Visit questionnaire and bilingual doctor report with logged evidence and mismatch marks
- [x] Optional trackers with trends; legacy calendar events migrated
- [x] New design: warm tokens, warm dark mode, Recursive typeface, flat rows, no emoji or sub-text
- [x] Vitest suite, ESLint flat config
