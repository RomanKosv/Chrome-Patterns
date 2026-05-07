type FieldName = string

type Split<P, V> = {
    field : FieldName,
    map : Map<P | undefined, V>
}

export class FractalMap<P, V> {
    private node? : (
        {
            type : "split",
            split : Split<P, FractalMap<P, V>>
        } |
        {
            type : "one",
            val : V
        }
    )
    public set(key : Record<FieldName, P|undefined>, val : V, restKeys? : Set<FieldName>) {
        if (restKeys === undefined) {
            restKeys = new Set(Object.keys(key))
        }
        if (this.node === undefined) {
            if (restKeys.size === 0) {
                this.node = {
                    type : "one",
                    val : val
                }
            }
            else {
                const k1 = restKeys.values().next().value !!
                restKeys.delete(k1)
                const child = new FractalMap<P, V>()
                this.node = {
                    type : "split",
                    split : {
                        field : k1,
                        map : new Map()
                    }
                }
                this.node.split.map.set(key[k1], child)
                child.set(key, val, restKeys)
            }
        }
        else if (this.node.type === "one") {
            if (restKeys.size === 0) {
                this.node.val = val
            }
            else {
                const oldVal = this.node.val
                this.node = undefined
                this.set(key, val, restKeys)
                this.set({}, oldVal, new Set())
            }
        }
        else {
            const p1 = key[this.node.split.field]
            restKeys.delete(this.node.split.field)
            if (!this.node.split.map.has(p1)) {
                this.node.split.map.set(p1, new FractalMap())
            }
            this.node.split.map.get(p1)!.set(key, val, restKeys)
        }
    }
    public get(key : Record<FieldName, P>, restKeys? : Set<FieldName>) : V | undefined {
        if (restKeys === undefined) {
            restKeys = new Set(Object.keys(key))
        }
        if (this.node === undefined) {
            return undefined;
        }
        else if (this.node.type === "one") {
            for(let k of restKeys.values()) {
                if (key[k] !== undefined) {
                    return undefined
                }
            }
            return this.node.val
        }
        else {
            restKeys.delete(this.node.split.field)
            return this.node.split.map
                .get(key[this.node.split.field])
                ?.get(key, restKeys)
        }
    }
    public *values() : Generator<V, undefined, void> {
        if (this.node !== undefined) {
            if (this.node.type === "one") 
                yield this.node.val;
            else{
                for (let child of this.node.split.map.values()) {
                    yield* child.values();
                }
            }
        }
    }
}
