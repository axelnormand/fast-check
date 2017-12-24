import MutableRandomGenerator from '../../../random/generator/MutableRandomGenerator'
import Shrinkable from './Shrinkable'
import Stream from '../../../stream/Stream'

export default abstract class Arbitrary<T> {
    abstract generate(mrng: MutableRandomGenerator): Shrinkable<T>;
    filter(predicate: (t: T) => boolean): Arbitrary<T> {
        class FilteredArbitrary<T> extends Arbitrary<T> {
            constructor(readonly arb: Arbitrary<T>, readonly predicate: (t: T) => boolean) {
                super();
            }
            generate(mrng: MutableRandomGenerator): Shrinkable<T> {
                let g = this.arb.generate(mrng);
                while (! this.predicate(g.value)) {
                    g = this.arb.generate(mrng);
                }
                return g.filter(this.predicate);
            }
        }
        return new FilteredArbitrary(this, predicate);
    }
    map<U>(mapper: (t: T) => U): Arbitrary<U> {
        class MappedArbitrary<T, U> extends Arbitrary<U> {
            constructor(readonly arb: Arbitrary<T>, readonly mapper: (t: T) => U) {
                super();
            }
            generate(mrng: MutableRandomGenerator): Shrinkable<U> {
                return this.arb.generate(mrng).map(this.mapper);
            }
        }
        return new MappedArbitrary(this, mapper);
    }
}

abstract class ArbitraryWithShrink<T> extends Arbitrary<T> {
    abstract generate(mrng: MutableRandomGenerator): Shrinkable<T>;
    abstract shrink(value: T): Stream<T>;
    shrinkableFor(value: T): Shrinkable<T> {
        return new Shrinkable(value, () => this.shrink(value).map(v => this.shrinkableFor(v)));
    }
}

export { Arbitrary, ArbitraryWithShrink };
