import {Container} from 'inversify';
import {interfaces as inversify} from 'inversify/dts/interfaces/interfaces';

import {APIHandler} from '../model/APIHandler';
import {AsyncInit} from '../controller/AsyncInit';
import {NotificationCenter} from '../controller/NotificationCenter';
import {ToastManager} from '../controller/ToastManager';
import {APITopic} from '../../client/internal';
import {StoreContainer} from '../store';

import {Inject} from './Injectables';

/**
 * For each entry in `Inject`, defines the type that will be injected for that key.
 */
type Types = {
    [Inject.STORE]: StoreContainer,
    [Inject.API_HANDLER]: APIHandler<APITopic>,
    [Inject.TOAST_MANAGER]: ToastManager,
    [Inject.NOTIFICATION_CENTER]: NotificationCenter
};

/**
 * Default injector mappings. Used at startup to initialise injectify.
 *
 * Using a type here will configure injectify to instantiate a class and inject it as a singleton.
 * Using a value here will inject that instance.
 */
const Bindings = {
    [Inject.API_HANDLER]: APIHandler,
    [Inject.STORE]: StoreContainer,
    [Inject.NOTIFICATION_CENTER]: NotificationCenter,
    [Inject.TOAST_MANAGER]: ToastManager,
};

type Keys = (keyof typeof Inject & keyof typeof Bindings & keyof Types);

/**
 * Wrapper around inversify that allows more concise injection
 */
export class Injector {
    private static _initialized: Promise<void>;

    private static _container: Container = (() => {
        const container = new Container();
        const promises: Promise<unknown>[] = [];

        console.log('E');
        Object.keys(Bindings).forEach(k => {
            const key: Keys = k as any;
            console.log('F', key);

            if (typeof Bindings[key] === 'function') {
                console.log('G', key);
                container.bind(Inject[key]).to(Bindings[key] as any).inSingletonScope();
            } else {
                console.log('H', key);
                container.bind(Inject[key]).toConstantValue(Bindings[key]);
            }
        });
        Object.keys(Bindings).forEach(k => {
            const key: Keys = k as any;

            if ((Bindings[key] as Function).prototype.hasOwnProperty('init')) {
                const instance = (container.get(Inject[key]) as AsyncInit);
                // instance['doInit']();
                promises.push(instance.initialized);
            }
        });
        console.log('I');

        Injector._initialized = Promise.all(promises).then(() => {});
        console.log('J');
        return container;
    })();

    public static get initialized(): Promise<void> {
        return this._initialized;
    }

    public static rebind<K extends Keys>(type: typeof Inject[K]): inversify.BindingToSyntax<Types[K]> {
        return Injector._container.rebind<Types[K]>(Bindings[type] as inversify.Newable<Types[K]>);
    }

    /**
     * Fetches an instance of a pre-defined injectable type/value.
     *
     * The type returned for each token is determined by the `Instances` map.
     *
     * @param type Identifier of the type/value to extract from the injector
     */
    public static get<K extends Keys>(type: typeof Inject[K]): Types[K] {
        return Injector._container.get<Types[K]>(type);
    }

    /**
     * Creates a new instance of an injectable type.
     *
     * This class does not need to exist within the `Instances` map, but any values being injected into it must.
     *
     * @param type Any class that is tagged with `@injectable`
     */
    public static getClass<T extends {}>(type: (new (...args: any[]) => T)): T {
        const value = Injector._container.resolve<T>(type);

        return value;
    }
}
