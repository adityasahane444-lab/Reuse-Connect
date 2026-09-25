# Reuse & Connect Mobile App

Reuse & Connect is installable as a Progressive Web App (PWA). The same deployed Next.js application and Supabase/Mailjet backend are used; users install the site from their mobile browser and launch it like an app.

## Android
1. Open the deployed Reuse & Connect URL in Chrome.
2. Use the browser menu and choose **Install app** or **Add to Home screen**.
3. Launch Reuse & Connect from the phone's home screen.

## iPhone / iPad
1. Open the deployed URL in Safari.
2. Tap **Share**.
3. Choose **Add to Home Screen**.
4. Launch Reuse & Connect from the home screen.

The `/install` page also explains the installation steps and provides the browser install prompt when supported.

## Native Android APK / Play Store
The web app can later be wrapped with Capacitor for an APK/AAB and store distribution. This does not require rewriting the existing Next.js, Supabase, authentication, or Mailjet logic.


### Header install button

The site header includes an Install App button beside the Reuse & Connect name. When the browser exposes the native install prompt it opens it directly; otherwise it opens `/install` with browser-specific instructions.
