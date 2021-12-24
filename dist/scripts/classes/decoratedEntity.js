import { compactEntity } from "./compactEntity.js";
export class decoratedEntity extends compactEntity {
    constructor() {
        super();
        this.damageDealt = [];
        this.damageTypes = [];
        this.matchedPacks = [];
        this.matchedPacksString = '';
        this.classes = [];
        this.hasSpells = false;
    }
    /**
    *
    * @param {Item|Actor5e|JournalEntry|RollTable} entityData
    * @param {string} entityType
    * @param {Compendium} packList
    * @param {object} classList
    * @param {object} subClasses
    *
    * @returns {object} decoratedItem
    */
    static decorate(entity, entityType, packList = null, classList = null, subClasses = null) {
        let decorated = new decoratedEntity(), entityData = entity.data;
        decorated._id = entity.id;
        decorated.name = entity.name || entityData.name;
        decorated.img = entity.img;
        decorated.type = entity.type || '';
        decorated.data.details = {};
        decorated.flags = entityData.flags;
        // getting pack(s)
        let matchedPacks = [];
        for (let pack in packList) {
            for (let packItem of packList[pack]) {
                if (entity.name.toLowerCase() === packItem.toLowerCase()) {
                    matchedPacks.push(pack);
                    break;
                }
            }
        }
        decorated.matchedPacks = matchedPacks;
        decorated.matchedPacksString = matchedPacks.join(', ');
        // handle common stuff
        switch (entityType) {
            case 'Feat':
            case 'Item':
            case 'Spell':
                // getting damage types (common to all Items, although some won't have any)
                decorated.damageTypes = [];
                if (entityData.damage && entityData.damage.parts.length > 0) {
                    for (let part of entityData.damage.parts) {
                        let type = part[1];
                        if (decorated.damageTypes.indexOf(type) === -1) {
                            decorated.damageTypes.push(type);
                        }
                    }
                }
                // getting uses/ressources status
                decorated.usesRessources = entityData.hasLimitedUses;
                decorated.hasSave = entityData.hasSave;
        }
        // handle inidividual stuff
        switch (entityType) {
            // no break is intentional, specific entitytype cases are handled below
            case 'Actor':
                // challengeRating display
                let challengeRating = () => {
                    let cr = Number(entityData.data.details.cr) || 0;
                    cr = (cr > 0 && cr < 1) ? "1/" + (1 / cr) : cr;
                    return cr;
                };
                decorated.displayCR = challengeRating();
                decorated.orderCR = Number(entityData.data.details?.cr) || 0;
                decorated.displaySize = 'unset';
                decorated.filterSize = 2;
                if (entityData.data.details?.type instanceof String) {
                    let temp = entityData.data.details.type;
                    decorated.data.details.type = { value: temp };
                }
                setProperty(decorated, 'data.details.type', entityData.data.details.type);
                if (CONFIG.DND5E.actorSizes[entityData.data.traits.size] !== undefined) {
                    entityData.displaySize = CONFIG.DND5E.actorSizes[entityData.data.traits.size];
                }
                switch (entityData.data.traits.size) {
                    case 'grg':
                        decorated.filterSize = 5;
                        break;
                    case 'huge':
                        decorated.filterSize = 4;
                        break;
                    case 'lg':
                        decorated.filterSize = 3;
                        break;
                    case 'sm':
                        decorated.filterSize = 1;
                        break;
                    case 'tiny':
                        decorated.filterSize = 0;
                        break;
                    case 'med':
                    default:
                        decorated.filterSize = 2;
                        break;
                }
                // getting value for HasSpells and damage types
                decorated.hasSpells = false;
                for (let item of entityData.items) {
                    if (item.type == 'spell') {
                        decorated.hasSpells = true;
                    }
                    if (item.data.damage && item.data.damage.parts && item.data.damage.parts.length > 0) {
                        for (let part of item.data.damage.parts) {
                            let type = part[1];
                            if (decorated.damageDealt.indexOf(type) === -1) {
                                decorated.damageDealt.push(type);
                            }
                        }
                    }
                }
                break;
            case 'Feat':
                let reqString = entityData.requirements?.replace(/[0-9]/g, '').trim();
                let matchedClass = [];
                for (let subClass in subClasses) {
                    if (reqString && reqString.toLowerCase().indexOf(subClass) !== -1) {
                        matchedClass.push(subClass);
                    }
                    else {
                        for (let sub of subClasses[subClass]) {
                            if (reqString && reqString.indexOf(sub) !== -1) {
                                matchedClass.push(sub);
                                break;
                            }
                        }
                    }
                }
                decorated.classRequirement = matchedClass;
                decorated.classRequirementString = matchedClass.join(', ');
                // getting uses/ressources status
                decorated.usesRessources = entityData.hasLimitedUses;
                decorated.hasSave = entityData.hasSave;
                break;
            case 'Item':
                decorated.data.rarity = entityData.data.rarity.toLowerCase().replace(/ /g, '') || 'common';
                break;
            case 'RollTable':
                decorated.data.displayRoll = entityData.displayRoll;
                decorated.data.formula = entityData.formula;
                decorated.type = 'RollTable';
                decorated.data.details.type = entityData.flags?.['better-rolltables']?.['table-type'] || 'none';
                break;
            case 'Spell':
                decorated.data.components = entityData.data.components;
                decorated.data.level = entityData.data.level;
                // determining classes that can use the spell
                let cleanSpellName = entity.name.toLowerCase().replace(/[^一-龠ぁ-ゔァ-ヴーa-zA-Z0-9ａ-ｚＡ-Ｚ０-９々〆〤]/g, '').replace("'", '').replace(/ /g, '');
                if (classList && classList[cleanSpellName]) {
                    let classes = classList[cleanSpellName];
                    decorated.classRequirement = classes.split(',');
                }
                break;
            case 'Scene':
                decorated.data.dimensions = entityData.height + ' * ' + entityData.width;
                decorated.img = entityData.thumb;
        }
        return decorated;
    }
}
