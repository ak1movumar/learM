# LearM PWA

- Installation: Settings has a native install button when the browser offers it, otherwise manual iPhone/Android instructions. Installed standalone windows hide the instructions.
- Deploy over HTTPS. HTTP localhost works for development, but a phone accessing a LAN IP over HTTP cannot use the complete PWA installation flow.
- The service worker registers only in production (`npm run build`, `npm start`). It caches only the public offline document. Lessons, API responses and account data are never cached. Offline learning is not implemented.
- `src/components/pwa/pwa-provider.tsx` renders the launch overlay; its white/dark background follows the saved `lingua-theme` setting. It appears once per full page load, not during client-side navigation.
- The manifest theme updates to match the selected theme. The operating system controls its initial native splash and may retain the installation-time color. The branded in-app splash follows the current theme and includes COMMUNITY at the bottom.
- Icons in `public/pwa` derive from the existing `src/app/icon.svg` with padding for maskable cropping.
- Device check after HTTPS deployment: install through Android Chrome and iPhone Safari, launch from the home screen in both themes, then disconnect and reopen a page to verify the offline message.
