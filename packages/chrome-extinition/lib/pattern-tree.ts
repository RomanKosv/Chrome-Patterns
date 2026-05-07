import { StrictTraitsSet } from "@chrome-patterns/shared/actions";
import { FractalMap } from "./fractal-map";
import { PatternTreeNode as PatternTreeNodeData } from "@chrome-patterns/shared/pattern-tree";

type PatternTreeIncrement = {
    lastActionTraits : StrictTraitsSet,
    parent : PatternTreeNode,
    enterCount : number
}

export class PatternTreeNode {
    increment? : PatternTreeIncrement;
    consequences : FractalMap<unknown, PatternTreeNode>
    constructor(data: PatternTreeNodeData, increment?: PatternTreeIncrement) {
        this.increment = increment
        this.consequences = new FractalMap()
        for(let cons of data.consequences) {
            this.consequences.set(
                cons.traits, 
                new PatternTreeNode(
                    cons.node, 
                    {
                        parent : this,
                        enterCount : cons.enterCount,
                        lastActionTraits : cons.traits
                    }
                )
            )
        }
    }
    collectBestAutomations(targetMap : Map<PatternTreeNode, [PatternTreeNode, number][]>, topN : number) {
        let automations : [PatternTreeNode, number][] = []
        for(let cons of this.consequences.values()) {
            cons.collectBestAutomations(targetMap, topN)
            for(const auto of targetMap.get(cons) !!) {
                const [node, cost] = auto
                automations.push([node, cost * cons.increment!.enterCount])
            }
            automations.push([cons, cons.increment!.enterCount])
        }
        automations.sort(
            (a, b) => a[1] - b[1]
        )
        targetMap.set(this, automations.slice(-topN))
    }

    getConsequense(traits : StrictTraitsSet) : PatternTreeNode | undefined {
        return this.consequences.get(traits)
    }

    *allSubnodes() : Generator<PatternTreeNode, undefined, void> {
        for (let child of this.consequences.values()) {
            yield child
            yield* child.allSubnodes()
        }
    }
}
