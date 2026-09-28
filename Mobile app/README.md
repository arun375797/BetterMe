# BetterMe Health

An Android companion app that imports the available Samsung Health/Fit3 history from Health Connect and syncs it into BetterMe.

## Data flow

`Galaxy Fit3 → Samsung Health → Health Connect → BetterMe Health → BetterMe API`

The app requests read access to sleep, steps, heart rate, resting heart rate, blood oxygen, exercise, distance, calories and floors. It does not store the BetterMe PIN and uploads data only after the user taps **Sync Fit3 history to BetterMe**.

## Open and run

1. Open this `Mobile app` directory in Android Studio.
2. Let Gradle sync and install any requested Android 36 SDK components.
3. Run the `app` configuration on an Android 9+ phone. Use your actual Samsung phone rather than an emulator to read Fit3 data.
4. In Samsung Health, open **Settings → Health Connect** and allow Samsung Health to write Sleep.
5. Open BetterMe Health, tap **Connect Health Connect**, and allow the health categories plus past-data access.
6. Enter your BetterMe PIN and tap **Sync Fit3 history to BetterMe**.

The production API is prefilled as `https://betterme-production.up.railway.app`. Change it in the app only when testing another HTTPS deployment.

## Behavior

- The initial import reads all history Health Connect makes available. Without Android's past-data permission, Health Connect limits other apps' older data.
- Every record keeps its original Health Connect ID, source app, timestamps and timezone offset. Server upserts make repeated imports idempotent.
- Later syncs start one day before the last successful cursor, safely catching late Samsung Health updates without duplicates.
- Reads Health Connect in pages and uploads batches of at most 250 records.
- Sleep sessions continue to populate the existing BetterMe sleep dashboard; all wearable metrics appear on the Galaxy Fit3 dashboard.
- Samsung's stress score is not exposed by Health Connect or the current public Samsung Health Data SDK, so the app does not invent or estimate it.

## Before Play Store publishing

This private build can be installed directly from Android Studio. A Play Store release also requires a public privacy-policy URL and completion of Google's Health apps declaration for the `READ_SLEEP` permission.
