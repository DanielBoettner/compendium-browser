#v0.6.0
- new: Export to a world/compendium rolltable
- new: UI inspired by TidySheet5e
- new: Light (default) and dark mode color scheme
- new: the source files are structured to give developers a cleaner environment
  -  most parts of the module are now TypeScript
  - `hooks` for event related js
  - `scripts` as the base folder for app related js
  - `data` holding json files with data used to filter results

- added: JournalEntry Browser
- added: RollTable Browser
- added: code documentation
- added: user documentation
- added: german translation

- changed: Used native JS calls instead of jQuery wherever possible
- changed: The style definitions are now written in less

#v0.5.0
- Fixed: Issue #17 (error in filtering NPCs by Creature Type)

#v0.4.5
- Fixed: [Suggestion] Show compendium source in results; Issue #11
- Fixed: Spells from non-system compendium show up in items tab. Issue#10

#v0.4.3

#v0.3.1
  - fixed a bug that prevented loading when Class type items were loaded.
  - fixed a bug that prevented disabled the scrollbar in the settings tab.

#v0.3.0
 - improved load times by lazyloading images
 - fixed some css problems
 - new Feature: Feat Browser
    - Compendium Browser now has a new section for Feats
    - lets you filter by source, class (as set in the requirements field), activation cost, damage type and if it uses ressources
 - new Feature: Item Browser
    - Compendium Browser now has a new section for all inventory Items
    - All item Packs (such as Explorer's Pack) are configured and you can browse a List of all Items contained in a pack!
      - this list can be modified by editing the "item-packs.json" file to customize your packs
    - many further filters available!

#v0.2.1
 - fixed an issue that prevented the rendering of the Button to open the browser

#v0.2
  - fixed a bug that could prevent proper npc loading
  - added a filter for "Source" for both spells and npcs
  - migrated to the new TabsV2
  - added a Reset Filters button
  - Added the Artificer class, thanks to Tielc#7191 for that

