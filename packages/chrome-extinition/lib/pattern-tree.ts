import { PatternTreeNode as PatternTreeNodeData } from "@chrome-patterns/shared/pattern-tree";
import { getFrom, ObjectMap, setTo } from "./object-map";

export type PatternTreeNodeID = `pattern_tree_node (id = ${string})`

export const patternTreeNodeIDRegex = /^pattern_tree_node \(id = .*\)$/

export function asPatternTreeNodeID(str : string) : PatternTreeNodeID | undefined{
    if (patternTreeNodeIDRegex.test(str)) {
        return str as PatternTreeNodeID
    }
    else
        return undefined
}

type PatternTreeIncrement1 = {
    lastActionTraits : unknown,
    enterCount : number,
    parentID : PatternTreeNodeID
}

export type PatternTreeNode1 = {
    increment? : PatternTreeIncrement1
    consequences : ObjectMap<PatternTreeNodeID>
}

// export type ChildPatternTreeNode = PatternTreeNode1 & {increment : PatternTreeIncrement1}

type PatternTreeNodesStorage = Record<PatternTreeNodeID, PatternTreeNode1 | undefined>

export type PatternTreeStorage = PatternTreeNodesStorage & {rootPatternTreeNode : PatternTreeNodeID}

export function createPatternTreeNodeFromData(data: PatternTreeNodeData, storage : PatternTreeNodesStorage, increment?: PatternTreeIncrement1) : PatternTreeNodeID {
    let id : PatternTreeNodeID = `pattern_tree_node (id = ${crypto.randomUUID()})`
    let node : PatternTreeNode1 = {
        increment : increment,
        consequences : {}
    }
    for (let cons of data.consequences) {
        setTo(
            node.consequences, 
            cons.traits, 
            createPatternTreeNodeFromData(
                cons.node,
                storage,
                {
                    lastActionTraits : cons.traits,
                    enterCount : cons.enterCount,
                    parentID : id
                }
            )
        )
    }
    storage[id] = node
    return id
}

export function createPatternTreeFromData(data : PatternTreeNodeData) : PatternTreeStorage {
    let storage : PatternTreeNodesStorage & {rootPatternTreeNode : PatternTreeNodeID | undefined}
        = {
            rootPatternTreeNode : undefined
        }
    storage.rootPatternTreeNode = createPatternTreeNodeFromData(data, storage)
    return storage as PatternTreeStorage
}

export function getConsequenceOfNode(node : PatternTreeNode1, traits : unknown) : PatternTreeNodeID | undefined {
    return getFrom(node.consequences, traits)
}

export type AutomationSetID = `automation for ${PatternTreeNodeID}`

export const automationSetIDRegex = /^automation for pattern_tree_node \(id = .*\)$/

export function asAutomationSetID(str : string) : AutomationSetID | undefined {
    if (automationSetIDRegex.test(str))
        return str as AutomationSetID
    else
        return undefined
}

export type Automation = {
    lastNode : PatternTreeNodeID,
    chanseMetric : number,
    lenght : number
}

export type AutomationsStorage = Record<AutomationSetID, Automation[] | undefined>

export function getAutomationSetID(node : PatternTreeNodeID) : AutomationSetID {
    return `automation for ${node}`
}

export function collectBestAutomations(tree : PatternTreeStorage, storage : AutomationsStorage, nodeID : PatternTreeNodeID | undefined) : AutomationSetID {
    if (nodeID === undefined){
        nodeID = tree.rootPatternTreeNode
        console.log("start collecting automations. tree: ", tree)
    }
    let automations : Automation[] = []
    let node = tree[nodeID]
    if (node === undefined) 
        throw Error(`Wrong pattern tree storage struct: wrong ref ${nodeID}`)
    else{
        let childs : [PatternTreeNodeID, AutomationSetID][] = []
        for(let [strTraits, childID] of Object.entries(node.consequences)) {
            if (childID !== undefined) {
                childs.push([childID, collectBestAutomations(tree, storage, childID)])
            }
        }
        let nodeEnterCount = node.increment?.enterCount 
        if ((nodeEnterCount === undefined) || (nodeEnterCount === 0)) {
            nodeEnterCount = 0
            for (let [childID, childAutoID] of childs) {
                nodeEnterCount = tree[childID]!.increment!.enterCount
            }
        }
        for(let [childID, childAutoID] of childs) {
            let childNode = tree[childID] !!
            if (childNode.increment!.enterCount !== 0) {
                for (let automation of storage[childAutoID] !!) {
                    automations.push(
                        {
                            lastNode : automation.lastNode,
                            chanseMetric : automation.chanseMetric * childNode.increment!.enterCount / nodeEnterCount,
                            lenght : automation.lenght + 1
                        }
                    )
                }
                automations.push(
                    {
                        lastNode : childID,
                        chanseMetric : childNode.increment!.enterCount / nodeEnterCount,
                        lenght : 1
                    }
                )
            }
        }
        automations.sort(
            (a, b) => a.chanseMetric * a.lenght - b.chanseMetric * b.lenght
        )
        console.log("automations: ", automations)
        storage[getAutomationSetID(nodeID)] = automations
        return getAutomationSetID(nodeID)
    }
}