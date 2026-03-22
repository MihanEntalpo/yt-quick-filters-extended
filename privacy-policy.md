# Privacy Policy

`YouTrack Quick Filters Extended` is designed to work locally in your browser on YouTrack pages.

## Summary

- The extension does not send your data to the developer.
- The extension does not use analytics, tracking, advertising, or external telemetry.
- The extension stores its settings and filters locally in your browser using Chrome extension storage.
- If you enable the `Days in Status` feature, the extension reads a YouTrack authentication token from your browser's local storage and uses it only to request issue metadata from your own YouTrack instance.

## What data the extension accesses

The extension may access the following data:

- Quick filters that you create, edit, delete, export, or import
- Extension settings, such as `Days in Status` preferences
- The current YouTrack board query shown in the search field
- A YouTrack authentication token already present in your browser for your signed-in YouTrack session, but only for the optional `Days in Status` feature
- Basic issue metadata needed for `Days in Status`, specifically issue identifiers and timestamps such as created and updated dates

## How the data is used

The extension uses this data only to provide its user-facing features:

- Display and manage quick filters on YouTrack agile boards
- Apply and remove filters in the YouTrack search UI
- Import and export filters as JSON
- Store your filters and settings between browser sessions
- Show issue age markers on cards when `Days in Status` is enabled

## Where data is stored

The extension stores data locally in Chrome extension storage on your device.

This includes:

- Quick filters
- Extension settings
- A cached YouTrack authentication token used only for requests to your own YouTrack instance

The extension does not store your data on the developer's servers.

## Network communication

The extension may communicate with:

- Your own YouTrack instance, to load board pages and apply filters through the page UI
- Your own YouTrack REST API, only when the `Days in Status` feature is enabled

The extension does not send your data to any developer-controlled backend or third-party analytics service.

## Data sharing

The extension does not sell, transfer, or share your data with the developer or with third parties.

The only network requests performed by the extension are requests to the YouTrack instance that you are already using.

## Data retention and control

You control the data stored by the extension.

You can remove stored data by:

- Deleting your saved filters from the extension UI
- Disabling or removing the extension
- Clearing the extension's stored data in Chrome

## Security

The extension is packaged with its logic and does not load remote code.

Any YouTrack authentication token used by the extension is used only locally and only to communicate with your own YouTrack instance for the `Days in Status` feature.

## Changes to this policy

This policy may be updated if the extension's behavior changes. Any published privacy policy should always match the actual behavior of the current version of the extension.

## Contact

Project repository:

https://github.com/MihanEntalpo/yt-quick-filters-extended

Issue tracker:

https://github.com/MihanEntalpo/yt-quick-filters-extended/issues
