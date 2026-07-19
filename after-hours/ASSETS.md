# After Hours — asset drop guide

Drop files into these folders, then tell Claude in chat what arrived.
Every file replaces an existing placeholder — nothing needs new layout.

## assets/audio/
Your songs. WAV is fine as a source — name them by queue position:
`01-song-title.wav`, `02-song-title.wav`, …

Note: WAVs are ~10MB/minute. For the deployed site they should be
converted to AAC/M4A (~256kbps) so mobile visitors aren't downloading
200MB — flag this at integration time and it will be handled.

## assets/covers/
Album artwork. Square, ideally 1500px+ (JPG or PNG).
Name to match the track: `01-song-title.jpg`.
One shared cover for all seven tracks also works.

## assets/gallery/
Everything else — photography, sketches, garment shots, video stills,
notebook pages. Any size; originals preferred (they get resized and
compressed responsibly at integration). Prefix helps but isn't required:
`photo-…`, `sketch-…`, `garment-…`, `still-…`, `notebook-…`

## Lyrics + captions
Just paste them in chat — one featured line per song is enough for the
gallery's lyric moment. Real captions (place, time, material) beat
invented ones: "35mm — Peckham, 02:14" is the register.
