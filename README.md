# Curios — Learning Without Limits

A separate, curriculum-neutral copy of Career Empire's learning environment. The original game and Blueprint are untouched.

## Explore

Shared site: https://emmanuelcc-ict.github.io/Curios-Trial/ after a successful publishing run.

Curios branding, app badges and the interactive campus map connect Archon Engine (former EST hall), ArtQuest (former Careers Centre) and Loopy Tunes (English & Media). Walk towards an entrance or choose its interaction to open the app; Return to Curios restores the campus. Avatar Studio remains available. The embedded app sites are maintained separately.

Run `python3 tools/serve.py`, then open http://127.0.0.1:8848/playable-3d/ . Use WASD/arrow keys or the on-screen controls to walk, drag to look, and E to interact. Places opens the interiors, markets and oval; Characters opens the original avatar choices and wardrobe.

The same campus, avatar models, buildings and NPC artwork are retained. Careers lessons, compulsory opening, employment simulations, wages, rewards, portfolio/account services and original teaching links are removed. Building signs are neutral labels. The original Mr Psandodakis remains on the oval; a separate copy named Basil stands beside the player at the opening and delivers Tania's requested greeting.

## Teachers

Open `teacher.html` from Teacher setup. Change the world title, room names, NPC names, conversations and visibility. Add copies of the available characters and position them in Arrival Gardens. Preview a draft in your browser, then download `world-config.json`. A maintainer replaces that file in this repository to share the changes with everyone. Preview changes are explicitly labelled and do not publish automatically.

This first prototype supports those content changes. New game rules, quizzes, assessment, branching quests and additional building interiors require development. The environment does not impose a curriculum.

See [the teacher guide](docs/TEACHER-GUIDE.md) and [ICT setup](docs/ICT-SETUP.md).

## Verification and provenance

`node tools/check.mjs` checks runtime syntax/imports; `node --test tests/*.test.mjs` checks configuration and independent saving. Native-browser evidence and limitations are in [progress](docs/PROGRESS.md).

Derived from Emmanuel-ICT-Support/GTCEM-Career-Empire commit `d3544e129682381d397417c08bed0242d5e58d88`. Existing visual asset bytes are retained; hashes are recorded in `docs/asset-provenance.json`. Original ownership/licences remain applicable. This prototype does not connect student accounts or original cloud services. Avatar saves and teacher drafts stay in the browser under a separate namespace.
