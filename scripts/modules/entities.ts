import { Filter } from './filter.js';
import { CMPBrowser, STOP_SEARCH } from './settings.js';

import { compactEntity } from '../classes/compactEntity.js';
import { decoratedEntity } from '../classes/decoratedEntity.js';
import { compactList } from '../classes/compactList.js';

export class Entities {
    private packList: { [key: string]: Object } | null = null;
    private classList: { [key: string]: Object } | null = null;
    private subClassList: { [key: string]: Object } | null = null;
    private itemsLoaded: boolean = false;
    private currentSearchNumber: number | null = null;

    /**
     * 
     * @param {string} entityType 
     * @param {any} updateLoading 
     * 
     * @returns {Promise<compactList>}
     */
    async loadAndFilter(entityType: string = "Item", updateLoading: any = null): Promise<compactList> {
        console.log(`Load and Filter Items | Started loading ${entityType}s`);
        console.time("loadAndFilterItems");

        await this.checkListsLoaded();
        const Category = (entityType === 'Spell' || entityType === 'Feat') ? 'Item' : entityType;
        const maxLoad = game.settings.get(CMPBrowser.MODULE_NAME, "maxload") ?? CMPBrowser.MAXLOAD;
        const ActiveFilters = game.compendiumBrowser.filters.getByName(entityType).activeFilters;
        const packs = game.packs.filter((pack) => pack.metadata.entity === Category);
        const searchNumber = Date.now();

        this.currentSearchNumber = searchNumber;

        //0.4.1: Load and filter just one of spells, feats, and items (specified by browserTab)
        let unfoundSpells = '',
            numItemsLoaded = 0,
            numPacks = packs.length,
            comp_list = new compactList(),
            tmp_array;

        comp_list.activeFilters = JSON.stringify(ActiveFilters);

        try {
            for (let pack of packs) {
                if (game.compendiumBrowser.settings.loadedCompendium[pack.metadata.entity][pack.collection].load) {
                    await pack.getDocuments().then((content: Collection<Item | Actor | RollTable | JournalEntry | Scene>) => {
                        content.reduce((
                                itemsList: any,
                                currentEntity: Item | Actor | RollTable | JournalEntry | Scene
                            ) => {
                                
                            if (this.currentSearchNumber != searchNumber) throw STOP_SEARCH;

                            numItemsLoaded = comp_list.size();

                            if (maxLoad <= numItemsLoaded) {
                                if (updateLoading) {ui.notifications.info(`Loaded ${numItemsLoaded} ${entityType}s from ${numPacks} Compendia.`);}
                                throw STOP_SEARCH;
                            }

                            // fail fast
                            if (currentEntity.data.type != entityType.toLowerCase() && entityType != Category) return itemsList;
                            if (!Filter.passesFilter(currentEntity, ActiveFilters)) return itemsList;

                            let decorated = decoratedEntity.decorate(currentEntity, entityType, this.packList, this.classList, this.subClassList);
                            let compact = new compactEntity();

                            // set common properties for all entities
                            
                            compact._id = decorated._id;
                            compact.name = decorated.name;
                            compact.compendium = pack.collection;
                            compact.img = decorated.img;
                            compact.type = decorated.type;
                            compact.data = decorated.data;
                            compact.flags = decorated.flags;

                            if (ActiveFilters) {
                                for (let index in ActiveFilters) {
                                    setProperty(compact, `tags.${ActiveFilters[index].path}`, ActiveFilters[index].value);
                                }
                            }

                            if (Category == 'Item') {
                                compact.dae = (decorated.effects?.size) || false;
                            }

                            switch (entityType) {
                                case "Spell":
                                case "Feat":
                                    if (entityType === 'Spell' || ["feat", "class"].includes(decorated.type)) {
                                        compact.classRequirement = decorated.classRequirement;
                                    }
                                    break;
                                case "Item":
                                    //0.4.5: Itm type for true items could be many things (weapon, consumable, etc) so we just look for everything except spells, feats, classes
                                    if (!["spell", "feat", "class"].includes(decorated.type)) {
                                        compact.rarity = decorated.data.rarity;
                                        compact.ac = (decorated.data?.armor?.type) ? decorated.data?.armor?.value || false : false;

                                        if (compact.type == 'weapon' && (decorated.data?.range?.value)) {
                                            setProperty(compact, `tags.range`, decorated.data?.range?.value + decorated.data?.range?.units);
                                        }
                                    }
                                    break;
                                case "Actor":
                                        compact.displayCR = decorated.displayCR;
                                        compact.displaySize = decorated.displaySize;
                                        compact.displayType = decorated.data?.details?.type;
                                        compact.orderCR = decorated.orderCR;
                                        compact.orderSize = decorated.filterSize;
                                        compact.data.details = decorated.data.details;
                                    break;
                                default:
                                    break;
                            }

                            itemsList[compact._id] = compact;
                            comp_list.addEntity(compact);

                            return itemsList;
                        }, []);
                    }); // get Entities
                }
            }//for packs
            
            numItemsLoaded = comp_list.size();
            if (updateLoading) {ui.notifications.info(`Loaded ${numItemsLoaded} ${entityType}s from ${numPacks} Compendia.`);}
        } catch(e){
            if (e === STOP_SEARCH){
                //stopping search early
            } else{
                throw e;
            }
        }

        console.timeEnd("loadAndFilterItems");
        console.log(`Load and Filter Items | Finished loading ${comp_list.size()} ${entityType}s`);
        return comp_list;
    }

    /**
     * 
     * @param {compactList} list 
     * @param {string} entityType 
     * @param {string} orderBy 
     * @returns {compactList}
     */
    static _sortList(list: compactList, entityType: string, orderBy: string | undefined): compactList {
        const SortCollator = new Intl.Collator(game.i18n.lang, {numeric: true, sensitivity: 'base'});
        if (entityType === 'Actor') {
            switch (orderBy) {
                case 'name':
                    list.entities.sort((left: compactEntity, right: compactEntity) => SortCollator.compare(left.name, right.name));
                    break;
                case 'cr':
                    list.entities.sort((left: compactEntity, right: compactEntity) => {
                        return left.displayCR - right.displayCR || SortCollator.compare(left.name, right.name);
                    });
                    break;
                case 'size':
                    list.entities.sort((left: compactEntity, right: compactEntity) => {
                        return left.orderSize - right.orderSize || SortCollator.compare(left.name, right.name);
                    });
                    break;
            }
        } else {
            if (orderBy) {
                list.entities.sort((left: compactEntity, right: compactEntity) => left.name.localeCompare(right.name));
            } else {
                let defaultSort = new Map([
                    ['Item', 'type'],
                    ['Spell', 'data.level'],
                    ['Feats', 'data.class'],                    
                    ['RollTable', 'compendium'],
                    ['JounralEntry', 'name'],
                    ['Scene', 'name'],
                ]);

                list.entities.sort((left: compactEntity, right: compactEntity) => {
                    let sort = defaultSort.get(entityType) || '',
                    result = SortCollator.compare(getProperty(left, sort),getProperty(right, sort));

                    return result || SortCollator.compare(left.name, right.name);
                });
            }
        }
        return list;
    }

    /**
     * Check all the prepared list with extra info are loaded
     */
    async checkListsLoaded() {
        const dataPath = '/modules/compendium-browser/data/';
        //Provides extra info not in the standard SRD, like which classes can learn a spell
        if (!this.classList) {
            this.classList = await fetch(dataPath + 'spell-classes.json').then(result => {
                return result.json();
            }).then(list => {
                return list;
            });
        }

        if (!this.packList) {
            this.packList = await fetch(dataPath + 'item-packs.json').then(result => {
                return result.json();
            }).then(list => {
                return list;
            });
        }

        if (!this.subClassList) {
            this.subClassList = await fetch(dataPath + 'sub-classes.json').then(result => {
                return result.json();
            }).then(list => {
                return list;
            });
        }
    }
}