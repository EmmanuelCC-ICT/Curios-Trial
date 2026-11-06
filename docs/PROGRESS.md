# Separate Year 8 prototype — 6 November 2026

## Authorised scope
Replicate Career Empire's world, avatars, buildings and NPCs as a neutral learning environment. Remove careers-specific content and requirements. Teachers determine purpose and may keep, remove, rename, replace or add NPCs and optional dialogue. Keep the original game and Blueprint untouched. User separately authorised creating a repository in the ICT GitHub organisation.

## Source and plan
Source: Emmanuel-ICT-Support/GTCEM-Career-Empire, published main d3544e129682381d397417c08bed0242d5e58d88, confirmed through the GitHub connector. A pinned source archive was downloaded and runtime/assets copied into this independent folder. Original local checkouts were read only; no shared asset hard links or Git remote were copied.

Retain environment, original visual assets, avatar editor, movement/collision, interiors, market/community architecture and cast. Replace career orchestration with free exploration and optional configured NPC text. Isolate browser storage. Remove original service/lesson entry points and unused curriculum/media from deliverable. Provide configuration and ICT setup instructions. Test before presenting a review URL.

## Visual assets
Existing game visual assets reused; none generated or redesigned. Record retained file hashes and any exclusions in the provenance report. Check rendered signs and interiors for residual careers information.

## GitHub
Connector supports existing repositories but not repository creation. Browser reached GitHub login; Tania asked to sign in. Repository creation pending, not claimed complete.

## Implementation and local checks

Retained original world/physics/renderer, avatar editor and eight whole-character choices; extracted market/community geometry and cast from the careers simulation. Removed old lesson orchestration, films/source documents, compulsory discovery route, economy/portfolio bridges and original cloud/feedback entry scripts. Added independent browser storage and configuration validation. Replaced career signs and wall film with neutral signs/blank display while retaining the underlying structures.

Added plain-language teacher editor for names, room labels, NPC visibility/dialogue, adding character copies, local draft preview and settings download. Native browser changed the world title to Curios Science Preview and Basil's dialogue to a science invitation; the draft ran with those changes while canonical world-config.json retained the original values. Downloaded settings were read back and matched that draft; reset then restored the canonical defaults.

User additionally requested a Mr Psandodakis clone named Basil at the opening, with a humorous acknowledgement that the resource can be adapted. Basil reuses the exact original model and dedicated NPC loader/collision, standing beside the player at (-5.9,23.3). Original oval NPC remains separate. Greeting corrected only 'sadi' to 'said' and the split word 'needs'; no audio generated. User is reviewing an alternative longer greeting; it is not yet substituted.

65 runtime modules parse and local import references resolve. Six focused tests pass: neutral original NPC defaults, editable NPC content, valid/invalid extra characters, malformed configuration, isolation from original save keys and restricted-storage fallback. Native Metal browser rendered the full campus with no scenery errors, market/community cast 20/20 assets ready, avatar change Antonio→Cerys, save/return and reload persistence, walking and the neutral Learning Hall. Evidence includes Basil opening and teacher-changed preview. Native phone/layout and final post-upload checks remain in progress; no full upstream CI or physical school-device clearance claimed.

## Repository and publication authority

Tania created EmmanuelCC-ICT/Curios-Trial and supplied the repository URL. It is a separate empty private repository, accessible through her signed-in browser but not yet through the GitHub connector. GitHub Pages reports 'Upgrade or make this repository public to enable Pages'. Tania explicitly approved 'make Curios-Trial public and publish'. Remote upload and live verification remain pending. Earlier requested emmanuel-ict-support address is superseded by this user-selected repository; Archon Engine/ArtQuest remain untouched.

## Basil wording revision
User asks for the ease, elapsed time and prompts to appear in Basil’s dialogue. Updated the teacher-configured greeting with the neutral-school explanation, three key plain-English instructions and the old-NPC joke. Timing is explicitly the first explorable prototype (about 15 minutes, supported by pinned-source download around 13:03 and rendered neutral world by 13:13), not total completion; teacher controls/testing/publication are separate subsequent work. Overall work was already about half an hour at 13:33 Perth. No fabricated full-delivery time or claim that prompting alone eliminated development/testing.

## Remote source and publishing setup
Initial source upload f7cb6c1402a1335cf2b5cc2dd98043bdf7822f0e, publishing workflow84ff176faf78b40ad9ad92ae2b6db8fe89e8455d. First run42169925770 verified the pinned source archive/217 retained asset/vendor hashes, passed65-module source checks and6tests, then committed complete independent source/assets asc067101f18bab7b431528595ef138b57e71a9c31. It stopped at configure-pages because Pages was not enabled; no live claim. Tania completed the public visibility change in Edge after session-specific password confirmation. Fresh connector metadata confirms public/admin/push access. Pages UI now confirms GitHub Actions source saved. Final refinements keep the dialog title/close control at the top, show all originally gated audience NPCs without rewards, and apply configurable market labels to physical signs.

## Final local layout check
Actual390×844native-browser viewport verified from rendered DOM. Basil’s longer dialogue opens at its start, scrolls within the viewport and retains a visible top Close button. Phone Places menu and joystick remain available after closing it. Basil spawn shifted0.5m nearer the player to keep both characters in the narrow opening frame. This is browser viewport evidence, not a physical-phone qualification. Local image docs/evidence/basil-opening-phone.png retained; no generated artwork.

## Curios identity and app-room expansion
Tania supplied Desktop/Curios.png and requested light re-badging, map app logos, building signs and access to Archon Engine, ArtQuest and Loopy Tunes. She explicitly confirmed Avatar Studio must remain. Reused the supplied poster for header/loading/teacher identity, teal/gold accents and Reuse · Repurpose · Recycle. No original visual files changed or AI artwork generated. App badges use existing published artwork from each app; sources/hashes in curios-assets.json.

Mappings: former EST hall → Archon Engine; former Careers Centre → ArtQuest; English & Media front entrance → Loopy Tunes. Original campus architecture and Avatar Studio retained. Added a schematic interactive campus map with app badges, an entrance-travel action, relevant world signs, walk/proximity entry and framed app rooms with Return to Curios / Open separately. The original external app sites are embedded and remain separate software; their repositories were not changed. World rendering/input pauses while a room app is open, and iframe source is cleared on return to stop its audio. Teachers can edit app names/HTTPS URLs/availability alongside NPC configuration.

Native browser at390×844 confirmed all three app documents inside their room iframes: Archon Engine command/board UI and board-unlock interaction; ArtQuest start screen/guide/load controls; Loopy Tunes soundtrack editor. Return to Curios restored world/map travel between the rooms. No original app save was reset and no teacher/student account records were accessed. Final live route/sign/Avatar Studio checks still pending.

Existing GitHub CLI sign-in was valid once network access was permitted; earlier invalid-token status was caused by restricted network access. This new folder is now a separate Git checkout of Curios-Trial atc067101, with no changes to any Career Empire checkout. Final publication uses this repository directly and removes the redundant bootstrap archive; the workflow no longer writes source commits or overwrites teacher edits from an archive.

## Mini welcome film, following the user’s entrance clarification
Replaced Basil’s default paginated greeting with a non-modal, world-anchored mini video beside his existing entrance character. Campus stays undimmed and movement remains available. Autoplay starts muted, with Sound on, native playback/caption controls, Close and an optional transcript. Leaving Basil’s vicinity pauses/hides the panel; Talk to Basil reopens it. Teacher conversation edits disable the stock video automatically; an explicit checkbox can restore it.

Created a 62.25-second 1280×720 H.264/AAC motion-graphics film (2.77 MiB) from the supplied Curios poster and actual campus/map/teacher captures. Narration uses the installed macOS Daniel synthetic voice, not the actual colleague’s voice. Short visual headings replace text-heavy pages. The script distinguishes the first ~15-minute explorable copy from subsequent tools, branding, testing and publication. Full decode succeeds; source script, transcript, captions and asset hashes retained. No original visual asset modified. Native desktop verified muted autoplay, sound-on playback and walking while the video remains present. Final responsive/live release checks pending.
Phone-sized 390×844 native browser check found the initial world anchor obscured the characters; changed small-screen placement to dock just below the header, with a compact 200px panel and small title. Desktop remains beside Basil. Evidence: docs/evidence/basil-mini-phone.jpg (before the final one-line title tightening). This is viewport evidence, not physical school-phone qualification.

## Public release checks
GitHub Pages deployments42174148111 (9f800619) and42174409059 (f80a6e7) succeeded. Public root resolves to /Curios-Trial/playable-3d/. Native browser verified full campus, animated Basil clone, muted playing62.25-second welcome (readyState4), actual walking into Archon Engine, ArtQuest and Loopy Tunes embedded UIs, Return to Curios, and Avatar Studio’s eight original character options. Screenshots include basil-mini-live-desktop.jpg. Narrow live check exposed browser-cached earlier welcome placement; versioned the changed stylesheet/module chain to deliver the compact layout to returning visitors. Final cache-refresh release verification follows. No physical school-device/network qualification or full upstream CI claimed.
Final refresh release1be3325ac3d41bbe75f7364f60710ff0df1b9c91 published successfully via workflow_dispatch run42174774852. Native live390×844 verified the updated200px panel docked at top193px, with campus/characters and joystick visible; screenshot basil-mini-live-phone.jpg replaced with the final result. Desktop1280×800 evidence is basil-mini-live-desktop.jpg. Temporary viewport override reset; live game left as the deliverable. Source checks67 / tests8 / original asset hashes217 pass. Task complete; original Career Empire, Blueprint and external app repositories untouched.
