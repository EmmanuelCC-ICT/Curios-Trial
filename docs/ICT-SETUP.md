# ICT setup

Destination authorised by Tania: `EmmanuelCC-ICT/Curios-Trial`. Expected Pages address: `https://emmanuelcc-ict.github.io/Curios-Trial/` once publication succeeds. Do not change Career Empire, Archon Engine or ArtQuest.

The prototype is static HTML/CSS/JavaScript with local Three.js/Rapier libraries and original game assets. There is no application build, database, student login, Supabase config or paid API. Serve over HTTP/HTTPS; opening HTML directly from disk does not support the modules/assets correctly.

## Local

`python3 tools/serve.py` starts a threaded loopback preview on port 8848. The project uses no installed npm dependencies; Node is used only for checks. Browser character saves are independent of Career Empire even when both games share an origin. Preview settings are scoped to the project URL path.

## GitHub Pages

Keep the complete folder structure and exact asset filename casing. Publish the repository root with `.nojekyll` present. Default root entry redirects to `playable-3d/`; teacher setup lives at `teacher.html`. Tania explicitly approved making Curios-Trial public and publishing on 6 November 2026 after GitHub reported Pages unavailable for this private repository's plan. Do not change another repository's visibility or hosting.

The original source archive is pinned by commit and SHA-256. The optional first-time materialisation helper downloads only to the new project, verifies each retained asset, and never writes to the original repository. Once committed, the new repository has its own asset copies; the running game needs no requests to Career Empire.

Run `node tools/check.mjs` and `node --test tests/*.test.mjs` before publication. Check the opening/Basil, avatar saving, interiors, markets, original oval teachers, teacher preview/export and phone layout. Verify the actual live site after Pages completes. A source check is not school-device qualification.

## Maintenance

Teachers can preview changes and download settings. A maintainer reviews and replaces `world-config.json`; refresh the site to see published updates. New activity mechanics remain a development task. New graphics should retain provenance and appropriate ownership/licences. Keep this project's documentation separate from the Career Empire Blueprint.
