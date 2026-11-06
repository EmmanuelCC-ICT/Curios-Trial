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
