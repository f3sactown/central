# Changelog

All notable changes to Central are listed here. Versions follow
[semantic versioning](https://semver.org); while the app is in alpha, every
version ends in `-alpha.N`. Format: [Keep a Changelog](https://keepachangelog.com).

## [Unreleased]

## [0.1.0-alpha.2] - 2026-10-26

A redesign that works like a phone app.

### Changed

- New navigation: a tab bar along the bottom (Home, Calendar, Chats, Regions, Me), which becomes a side column on larger screens.
- A region filter at the top of Home, Calendar and Chats. Calendar and Chats now cover all your regions at once.
- Posts show as a flat list, and new posts open from a floating + button.
- Each region has an overview page with shortcuts, notices, invites, members and settings.
- Your profile, sign-out and the app version are together on the Me tab.
- New blue and grey color scheme, with light and dark modes that follow the device setting.
- The Supabase project URL is accepted with or without a trailing `/rest/v1/`, and the key can be stored as a repository secret or variable.
- `version.json` reports whether the site runs on Supabase or in demo mode.
- Every merge to `main` gets the next build number and publishes its own pre-release, tagged `v<version>+build.<n>`.

## [0.1.0-alpha.1] - 2026-10-25

First alpha release.

### Added

- PAX accounts with name, bio and avatar.
- Invite-only regions. Any PAX can create one region per day and becomes its admin.
- Main feed across all of a PAX's regions, plus a page for each region.
- Posts with text, photos, links and events; emoji reactions and comments.
- Notices pinned to the top of a region page by admins.
- Region calendar with any number of events per day.
- Open region chats and invite-only private chats, with live updates.
- Demo mode that runs entirely in the browser when no Supabase project is connected.
- Alpha label with version and build number shown in the app.
