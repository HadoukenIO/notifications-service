type SortFunction<T> = (element1: T, element2: T) => number;

/**
 * Maintains an ordered list for quick pop of 'smallest' element
 *
 */
export class OrderedList<T> {
    private readonly _elements: T[];
    private readonly _compareFunction: SortFunction<T>;

    /**
     * Creates our Ordered list
     *
     * @param elements The unsorted elements. This array will not be modified
     * @param compareFunction The compare function, this should take two elements, and return a value < 0 if the first
     * is smaller, > 0 if the first is greater, and 0 if and only iff the elements are equal
     */
    constructor(elements: T[], compareFunction: SortFunction<T>) {
        this._compareFunction = compareFunction;

        this._elements = elements.slice().sort(this._compareFunction);
    }

    // Returns whether the list is empty
    public empty(): boolean {
        return this._elements.length === 0;
    }

    // Removes and returns the smallest element
    public pop(): T {
        return this._elements.pop()!;
    }

    // Inserts an element into the correct place in our sorted list
    public insert(element: T): void {
        this.insertIntoRange(element, 0, this._elements.length);
    }

    // Removes an element
    public remove(element: T): void {
        this.removeInRange(element, 0, this._elements.length);
    }

    // Recursively insert an element into the correct place in a given range. Think of 'start' and 'end' as points *between* indicies in our array
    private insertIntoRange(element: T, start: number, end: number): void {
        if (start === end) {
            this._elements.splice(start, 0, element);
        } else {
            const range = end - start;
            const mid = start + Math.floor(range / 2);

            const comparison = this._compareFunction(element, this._elements[mid]);

            if (comparison < 0) {
                this.insertIntoRange(element, start, mid);
            } else if (comparison > 0) {
                this.insertIntoRange(element, mid, end);
            }
        }
    }

    // Recursively remove an element from a given range. Think of 'start' and 'end' as points *between* indicies in our array
    private removeInRange(element: T, start: number, end: number): void {
        if (start === end + 1) {
            if (this._compareFunction(this._elements[start], element) === 0) {
                this._elements.splice(start, 1);
            }
        } else if (start !== end) {
            const range = end - start;
            const mid = start + Math.floor(range / 2);

            const comparison = this._compareFunction(element, this._elements[mid]);

            if (comparison < 0) {
                this.removeInRange(element, start, mid);
            } else if (comparison > 0) {
                this.removeInRange(element, mid, end);
            }
        }
    }
}
