# Android (TWA) build

This folder holds the Trusted Web Activity configuration that wraps
`https://www.thekaamready.in` into the Play Store app `in.thekaamready.customer`.

The Android project itself is **not** committed — it is regenerated from
`twa-manifest.json` on every build by [Bubblewrap](https://github.com/GoogleChromeLabs/bubblewrap).

## Building

Run the **Build Android AAB (target API 36)** workflow from the Actions tab.
It produces `app-release-bundle.aab` as a downloadable artifact.

Two repository secrets must exist:

| Secret | Value |
|---|---|
| `ANDROID_KEYSTORE_BASE64` | base64 of `signing.keystore` (the Play **upload** key) |
| `ANDROID_KEYSTORE_PASSWORD` | the keystore password — same value is used as the key password |

The keystore is never committed: this repository is public.

## Why Bubblewrap 1.25.0 and not PWABuilder

PWABuilder's hosted Android packager still emits `targetSdkVersion 35`; its build
service was archived in Oct 2025. Google Play requires **API 36** for updates from
31 Aug 2026. Bubblewrap 1.25.0 (31 Jul 2026) is the first release whose template
sets `compileSdkVersion 36` / `targetSdkVersion 36`, so that is what this workflow pins.

The workflow fails the build if `targetSdkVersion 36` is missing, or if an
`android:screenOrientation` / `resizableActivity="false"` restriction reappears
(those trigger separate Play large-screen warnings).

## Bumping the version

`versionCode` and `versionName` are workflow inputs — set them when you click
**Run workflow**. `versionCode` must be strictly higher than anything already
uploaded to Play.
