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

## Android

The Android app wraps the same static build with [Capacitor](https://capacitorjs.com). Inside the app, printing the report uses the Android print dialog, which can also save a PDF. Backups open the share sheet. A notification an hour after each dose asks whether it helped.

```bash
npm run android:sync                       # build the site and copy it into android/
cd android && ./gradlew assembleRelease    # unsigned APK in app/build/outputs/apk/release/
```

Needs JDK 21 and the Android SDK (platform 36).

### Publishing an APK on GitHub

The **Android release** workflow builds a signed APK and attaches it to a GitHub Release named `v<version>`. Before the first run:

1. Create a signing key once and keep it safe. Every later update must be signed with the same key.
   ```bash
   keytool -genkeypair -v -keystore pehriod-release.jks -alias pehriod -keyalg RSA -keysize 4096 -validity 10000
   base64 -w0 pehriod-release.jks > pehriod-release.jks.b64
   ```
2. In the repository's **Settings → Secrets and variables → Actions**, add `ANDROID_KEYSTORE_BASE64` (the `.b64` file's contents), `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS` (`pehriod`) and `ANDROID_KEY_PASSWORD`.
3. Run **Actions → Android release → Run workflow**, or push a tag matching `package.json`, e.g. `v3.0.0`.

For each new version, bump `version` in `package.json` (versionCode is derived from it: 3.1.2 → 30102) and add `fastlane/metadata/android/en-US/changelogs/<versionCode>.txt`.

### F-Droid and other stores

Store listing text, icon and screenshots are in `fastlane/metadata/android/`, the layout F-Droid and IzzyOnDroid read. The APK has no Google Play Services, no tracking, and no Google dependency-metadata block.

- **Obtainium**: add the GitHub repository URL; it installs and updates from Releases directly.
- **IzzyOnDroid**: request inclusion on its GitLab; it picks up the APK from GitHub Releases.
- **F-Droid main repository**: submit a merge request with build metadata to `fdroiddata` on GitLab. F-Droid builds from source and signs with its own key, unless the build is reproducible.

## License

ISC
