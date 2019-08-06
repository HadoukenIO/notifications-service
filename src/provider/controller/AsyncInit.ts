import {injectable} from 'inversify';

import {deferredPromise} from '../common/deferredPromise';

/**
 * Base class for any objects that initialise asynchronously.
 *
 * Since constructors cannot be awaited, this class acts to create a common pattern for these types of objects.
 *
 * To ensure the object is fully initilased before usage, place an `await myObject.initialised;` immediately after
 * construction.
 */
@injectable()
export abstract class AsyncInit {
    private readonly _initialized!: readonly [Promise<this>, (value?: this) => void, (reason?: any) => void];

    constructor() {
        this._initialized = deferredPromise<this>();
    }

    public get initialized(): Promise<this> {
        return this._initialized[0];
    }

    /**
     * Triggers the async initialisation of this class. Should only ever be called once, immediately after construction.
     *
     * This is automatically invoked from within the Injector.
     */
    public delayedInit(): Promise<this> {
        this.init().then(() => {
            this._initialized[1](this);
        });

        return this._initialized[0];
    }

    protected abstract async init(): Promise<void>;
}
