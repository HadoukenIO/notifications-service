import {Container} from 'inversify';
import {interfaces as inversify} from 'inversify/dts/interfaces/interfaces';

import {APITopic, Events} from '../../client/internal';
import {AsyncInit} from '../controller/AsyncInit';
import {NotificationCenter} from '../controller/NotificationCenter';
import {ToastManager} from '../controller/ToastManager';
import {Layouter} from '../controller/Layouter';
import {APIHandler} from '../model/APIHandler';
import {ActionHandlerMap, ActionHandlers} from '../store/Actions';
import {Store} from '../store/Store';
import {Database} from '../model/database/Database';
import {FinMonitorModel} from '../model/FinMonitorModel';
import {MonitorModel} from '../model/MonitorModel';

import {Inject} from './Injectables';

/**
 * For each entry in `Inject`, defines the type that will be injected for that key.
 */
type Types = {
    [Inject.ACTION_HANDLER_MAP]: ActionHandlerMap;
    [Inject.API_HANDLER]: APIHandler<APITopic, Events>;
    [Inject.DATABASE]: Database;
    [Inject.LAYOUTER]: Layouter;
    [Inject.MONITOR_MODEL]: MonitorModel;
    [Inject.NOTIFICATION_CENTER]: NotificationCenter;
    [Inject.STORE]: Store;
    [Inject.TOAST_MANAGER]: ToastManager;
};

/**
 * Default injector mappings. Used at startup to initialise injectify.
 *
 * Using a type here will configure injectify to instantiate a class and inject it as a singleton.
 * Using a value here will inject that instance.
 */
const Bindings = {
    [Inject.ACTION_HANDLER_MAP]: ActionHandlers,
    [Inject.API_HANDLER]: APIHandler,
    [Inject.DATABASE]: Database,
    [Inject.LAYOUTER]: Layouter,
    [Inject.MONITOR_MODEL]: FinMonitorModel,
    [Inject.NOTIFICATION_CENTER]: NotificationCenter,
    [Inject.STORE]: Store,
    [Inject.TOAST_MANAGER]: ToastManager
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

        Object.keys(Bindings).forEach(k => {
            const key: Keys = k as any;

            if (typeof Bindings[key] === 'function') {
                container.bind(Inject[key]).to(Bindings[key] as any).inSingletonScope();
            } else {
                container.bind(Inject[key]).toConstantValue(Bindings[key]);
            }
        });
        Object.keys(Bindings).forEach(k => {
            const key: Keys = k as any;
            const proto = (Bindings[key] as Function).prototype;

            if (proto && proto.hasOwnProperty('init')) {
                const instance = (container.get(Inject[key]) as AsyncInit);
                promises.push(instance.delayedInit());
            }
        });

        Injector._initialized = Promise.all(promises).then(() => {});
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
