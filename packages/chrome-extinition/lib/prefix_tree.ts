import { SerializedAction } from "./serialisation";
import { IsEssentialActionTraitSelector, getEssentialTraitsList } from "./traits";

class FractalMap<Key, Val> {
    static readonly leafID : object = {}
    map : Map<Key, FractalMap<Key, Val>>
    leafObj? : Val
    constructor() {
        this.map = new Map()
    }
    get(key: Key[], startInd : number = 0) : Val | undefined {
        if (startInd === key.length) return this.leafObj;
        else {
            let child = this.map.get(key[startInd]);
            if (child !== undefined) return child.get(key, startInd + 1);
        }
    }
    set(key: Key[], value : Val, startInd : number = 0) : Val | undefined {
        let prev : Val | undefined;
        if (startInd === key.length) {
            prev = this.leafObj;
            this.leafObj = value;
        }
        else{
            let child = this.map.get(key[startInd]);
            if (child !== undefined) {
                prev = child.set(key, value, startInd + 1);
            }
            else{
                child = new FractalMap();
                this.map.set(key[startInd], child);
                prev = child.set(key, value, startInd + 1);
            }
        }
        return prev
    }
    *getKeys() : Generator<Key[], undefined, void> {
        if (this.leafObj !== undefined) yield []
        for(const [key0, sub] of this.map) {
            for(const restKeys of sub.getKeys()) {
                yield [key0].concat(restKeys)
            }
        }
    }
}

export class PrefixTreeCursor{
    node : PrefixTree
    real : boolean
    essentialOnly : boolean
    stepCount : number = 0;
    constructor(node :PrefixTree, real : boolean, essentialOnly : boolean) {
        this.node = node
        this.real = real
        this.essentialOnly = essentialOnly
    }
    public addAction(action : SerializedAction) {
        if ((! this.essentialOnly) || IsEssentialActionTraitSelector.getFrom(action)) {
            let traitList = getEssentialTraitsList(action)
            let subtree = this.node.consequences.get(traitList)
            if (subtree === undefined) {
                let newNode = new PrefixTree(
                    {
                        parent : this.node,
                        enterCount : 0,
                        lastAction : action
                    }
                )
                this.node.consequences.set(
                    traitList,
                    newNode
                )
                this.node = newNode
            }
            else{
                this.node = subtree;
            }
            this.stepCount ++;
            if (this.real) this.node.increment!.enterCount++
        }
    }
}

type PrefixTreeIncrement = {
    enterCount : number;
    parent : PrefixTree;
    lastAction : SerializedAction
}

export class PrefixTree {
    consequences : FractalMap<string | undefined, PrefixTree>
    increment? : PrefixTreeIncrement
    constructor(increment? : PrefixTreeIncrement) {
        this.consequences = new FractalMap()
        this.increment = increment
    } 

    getCursor(real : boolean, essentialOnly : boolean = true) : PrefixTreeCursor {
        return new PrefixTreeCursor(this, real, essentialOnly)
    }
    debug(nTab : number = 0) {
        for(const key of this.consequences.getKeys()) {
            console.log('\t'.repeat(nTab).concat(key.toString()))
            this.consequences.get(key)!.debug(nTab + 1)
        }
    }
    tryActivateOn(document : Document) : {
            result : 'succes' | 'fail';
            preformedActions : number
        } 
    {
        if (this.increment !== undefined) {
            let prefResult = this.increment.parent.tryActivateOn(document);
            if (prefResult.result === 'succes') {
                if (this.increment.lastAction.tryActivateOn(document)) {
                    return {
                        result : "succes",
                        preformedActions : prefResult.preformedActions + 1
                    }
                }
                else {
                    return {
                        result : 'fail',
                        preformedActions : prefResult.preformedActions
                    }
                }
            }
            else return prefResult;
        }
        else{
            return {
                result : 'succes',
                preformedActions : 0
            }
        }
    }
}