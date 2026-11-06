# Make the world your own

1. Open **Teacher setup** from the game.
2. Give your world a title and rename the learning spaces.
3. For each character, choose whether they are present, what they are called, and whether they have a conversation. Empty conversation means no dialogue prompt; the character can still be part of the scenery.
4. **Add a copy of a character** creates a separate character in Arrival Gardens. Set its name, conversation, opening greeting and X/Z position. Basil is an example using the existing Mr Psandodakis model; the original is retained independently.
5. **Preview my changes** opens your draft in this browser. Look for **TEACHER PREVIEW · NOT PUBLISHED**. The normal game URL continues to use the repository settings.
6. **Download settings** exports the draft. Ask the project maintainer to replace `world-config.json` in Curios-Trial. That update shares your settings with everyone; it does not affect Career Empire.
7. **Reload published settings** discards the browser draft and returns to the repository version.

Teacher previews are local to this browser and website address. They do not sync across teachers, computers or devices. No pupil records, submissions or marks are collected.

## Uploaded character models

A maintainer can add a GLB under `playable-3d/assets/`, then configure an extra NPC, for example:

```json
{"id":"garden-guide","name":"Garden guide","enabled":true,"dialogue":"What can you notice here?","position":[-9.5,23.3],"model":"./assets/my-guide.glb","greetOnArrival":false}
```

Use a unique lowercase id, a local model path, and coordinates within -100 to 100. Copies use the same underlying asset without modifying the original. Generic uploaded models are scaled to character height and use an idle animation if supplied; arbitrary rigs, collision, walking routes and animation compatibility are not automatically solved. The Mr Psandodakis copy reuses the original game NPC loader and collision setup.

To replace a supplied NPC with another model, switch the supplied one off and add an extra character. The editor currently changes named characters; visitor extras in the market can also be configured in the `npcs` JSON using ids `customer-a` through `customer-e`.

## What is deliberately open

The four hall stations are blank spaces; they are not configured quizzes or automatic assessment. Dialogue is plain text, not AI-generated conversation or audio. The larger campus contains the original explorable routes and original exterior-only buildings; this prototype does not create interiors that did not exist in Career Empire.

## App rooms and map
The campus map shows the three supplied apps and Avatar Studio. Choose a map destination to travel to its entrance; walk towards it or press E. Each app opens inside a room panel with Return to Curios and an optional separate-tab link. The initial mappings are Archon Engine in the former EST hall, ArtQuest in the former Careers Centre and Loopy Tunes at English & Media. These are links to existing external apps, not copied app source or a shared pupil-account system.

Teacher setup includes app names, HTTPS website links and availability. Names on the dedicated app signs and map follow those settings; room labels can be changed separately. Turning an app off removes its map destination/sign but keeps the underlying school building available. New app badges are local artwork files configured in world-config.json. A teacher’s draft preview does not alter the external app itself.

Basil’s small welcome video plays beside him at the entrance without stopping exploration. Select Sound on to hear the synthetic narration, or use captions/Transcript. Closing it or walking away leaves the campus available. Talk to Basil to reopen. Editing his conversation switches off the stock welcome video so your own words appear instead; the “Use Basil’s welcome video” checkbox can restore it.

Updated welcome: Basil now dances beside silent, automatically advancing text slides. Use Pause, Previous or Next to read at your own pace. When the welcome finishes or closes, the campus map opens with app logos and labelled entrances. Choose a destination, then walk towards its door or press E. The earlier narrated video has been removed.

Final navigation: the welcome now leaves a small tracking map at bottom right. Its You marker follows movement; select an app entrance or Expand map. Teacher setup is in the top bar. Slides show screenshots separately from the text and have no sound controls.

Updated app access: enter ArtQuest + Loopy Tunes (the former Careers Centre), walk to the left PC for Loopy Tunes or right PC for ArtQuest, then press E/select the nearby Open button. Each monitor shows the app artwork. Return to Curios returns to the same PC. Archon remains in the Learning Hall. The arts-building portal has been removed. The room uses a fixed front view so movement remains predictable near walls.
