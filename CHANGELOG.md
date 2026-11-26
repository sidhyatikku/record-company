# Changelog

Notable changes to this project. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added

- Search by song name. A song match shows the album that contains it on the shelf.
- Loading states while previews are fetched from Deezer: a status line, a spinner on the play button, and a tracklist banner.
- A disabled preview state for songs Deezer has no clip for. They are tagged **No preview**, show a notice in the player, and are skipped during playback.
- A disc peeking out of the jewel case on the CD stage.
- Project documentation: README, architecture, API reference, guide to adding albums, contributing guide, and GitHub templates.

### Changed

- The CD case and disc are centered in the detail stage.
- Hovered items near a shelf edge stay inside the bookcase in every format.

### Fixed

- Hovered records, cassettes, and CDs stay held while the cursor moves onto them, so they can be clicked.
- The CD case no longer overlaps the player controls.

## Earlier

- Cassette, CD, and Digital shelf views with an iOS 6–style segmented toggle.
- Hovering a cassette or CD pulls its case out and tilts it.
- Vinyl shelf with A–Z sections, an album detail dialog, and Deezer 30-second previews.
