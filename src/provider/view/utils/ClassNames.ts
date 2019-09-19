/**
 * Helper class for generating class name attributes based on state.
 */
export class ClassNames {
    private _names: string[] = [];

    constructor(...names: (string | [string, boolean])[]) {
        this._names = names
            .filter(x => typeof x === 'string' || x[1])
            .map(x => typeof x === 'string' ? x : x[0]);
    }

    public add(name: string): string[] {
        return this._names = [...this.remove(name), name];
    }

    public remove(name: string): string[] {
        return this._names = this._names.filter(x => x !== name);
    }

    public toString(): string {
        return this._names.join(' ');
    }
}
