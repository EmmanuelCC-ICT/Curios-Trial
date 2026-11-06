# Year 8 Learning World

Independent prototype derived from Career Empire's published source d3544e129682381d397417c08bed0242d5e58d88 on 6 November 2026.

- Work only in this separate project. Never change or publish the original Career Empire or its Blueprint.
- Keep discussion, plans, progress and visual evidence in docs/PROGRESS.md, updating this file at task close.
- Retain the existing environment, avatars, buildings and NPC visual assets. Curriculum, dialogue, quests, rewards and educational purpose belong to the Year 8 teachers.
- No original school accounts, student records, Supabase configuration, analytics or feedback services. Browser saves use a separate namespace.
- Static HTML/JavaScript. Keep paths relative so the project can live in its own ICT GitHub repository.
- Teacher configuration: world-config.json. Optional dialogue defaults to empty. Render teacher text as text, never executable HTML.
- Validate asset references and run node --test tests/*.test.mjs after substantive changes. Verify affected navigation, avatars and characters in a browser; distinguish source checks from actual visual acceptance.
- No new assets generated. Original asset ownership/licences still apply; provenance is not a licence transfer.

Status: local prototype and teacher editor implemented. Six focused tests and 65-module source checks pass; native campus/market/avatar/hall and teacher-preview/export checks passed. Basil clone/greeting added at user request; original remains independent. Destination EmmanuelCC-ICT/Curios-Trial supplied by user; explicit public publication approved. Source and independent asset copies are saved in Curios-Trial. Tania completed public visibility; Pages source is configured for GitHub Actions. Initial run passed checks/materialisation but stopped before deployment because Pages was not enabled at that time. Final popup/market-label refinements and phone/live verification are in progress. See docs/PROGRESS.md.

## Curios app hub — 6 November 2026
User supplied Curios branding; retain original campus/Avatar Studio/avatars/NPCs. Curios map and relevant exterior signs route former EST→Archon Engine, former Careers→ArtQuest, Media→Loopy Tunes. Apps are embedded external software, with return/fallback links; their source repositories remain untouched. Teacher settings include names/links/availability. Logo/art provenance: docs/curios-assets.json. Native iframe/return checks pass; final GitHub Pages verification pending. Reuse · Repurpose · Recycle is the requested theme.

## Entrance welcome refinement
Basil now has a small non-modal narrated motion-graphics video, anchored beside his entrance model. World stays visible and walking remains enabled; autoplay muted, optional sound/captions/transcript. Teachers editing his dialogue automatically disable the stock film. Media script/provenance and checks are recorded in docs/PROGRESS.md and docs/curios-assets.json. Original Career Empire and Blueprint remain untouched. Current source checks: 67 modules; focused tests: 8. Publication and live verification pending below.

Public release: Curios-Trial is live at https://emmanuelcc-ict.github.io/Curios-Trial/ . Native browser confirmed campus, Basil welcome playback, all three app rooms/return and original eight-avatar Studio. 217 original asset hashes, 67-module checks and 8 focused tests passed. Final refresh versioning added for updated narrow-screen welcome; deployment evidence in docs/PROGRESS.md. Keep future work inside this separate repository, not Career Empire/Blueprint.
Final task closure: refresh release1be3325 deployed successfully (run42174774852); final live phone panel200px wide at top193px confirmed, desktop entrance captured, app rooms and Avatar Studio verified. No remaining task blocker. Release evidence and limitations remain in docs/PROGRESS.md. Documentation-only closure follows with CI skipped.
