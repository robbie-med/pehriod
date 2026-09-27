# release-apk

Signed Pehriod APKs built outside CI, published as GitHub Releases by `.github/workflows/publish.yml` using the built-in token (no signing secrets needed). Source lives on `main`; `SOURCE_COMMIT` names the commit each APK was built from.

To publish a new build: replace the APK and its `.sha256`, update `SOURCE_COMMIT` and `NOTES.md`, commit, push. Once the signing secrets are set on the repository, prefer the **Android release** workflow on `main`.
