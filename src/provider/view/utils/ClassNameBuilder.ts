interface StyleModule {
    [key: string]: string;
}

/**
 * Helper class for generating CSS class names and module class names.
 */
export class ClassNameBuilder {
    public static join(styleModule: StyleModule, ...names: string[]): string {
        return names.map((x) => styleModule[x]).join(' ');
    }

    private _names: string[] = [];
    private _currentStyleModule?: StyleModule;

    public get names(): string[] {
        return this._names;
    }

    /**
     * The current active style module being used.
     */
    public get currentStyleModule(): StyleModule | undefined {
        return this._currentStyleModule;
    }

    /**
     * Create a class name builder with initial names.
     * @param styleModule Style module to set as the active module in the chain,
     * if undefined no module will be used.
     * @param names Class names to be added.
     */
    constructor(styleModule?: StyleModule, ...names: (string | [string, boolean])[]) {
        this._currentStyleModule = styleModule;
        names.forEach((x) => this.add(x));
    }

    /**
     * Add a new class name.
     * @param name Class name to add.
     * @param styleModule Style module to use,
     * if undefined the active module in the chain will be used.
     * To bind a module see `.use`.
     */
    public add(name: string | [string, boolean], styleModule?: StyleModule): this {
        if (!name) {
            return this;
        }
        const [value, valid] = (typeof name === 'string') ? [name, true] : (name);
        if (valid) {
            const key = (styleModule && (styleModule[value])) || (this._currentStyleModule && (this._currentStyleModule[value])) || value;
            this._names = [...this.remove(key).names, key];
        }
        return this;
    }

    /**
     *
     * @param name Class name to remove.
     * @param styleModule Style module to use,
     * if undefined the active module in the chain will be used.
     * To bind a module see `.use`.
     */
    public remove(name: string, styleModule?: StyleModule): this {
        name = (styleModule && (styleModule[name])) || (this._currentStyleModule && (this._currentStyleModule[name])) || name;

        this._names = this._names.filter((x) => x !== name);
        return this;
    }

    /**
     * Change the style module that will be used by the following calls in the chain.
     * @param styleModule Style module to use, if undefined there will be no module used in the chain.
     */
    public use(styleModule?: StyleModule): this {
        this._currentStyleModule = styleModule;
        return this;
    }

    public toString(): string {
        return this._names.join(' ');
    }
}
