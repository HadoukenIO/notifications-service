import {injectable, inject} from 'inversify';
import {composeWithDevTools} from 'remote-redux-devtools';
import {Store as ReduxStore, applyMiddleware, createStore, StoreEnhancer, Dispatch, Unsubscribe} from 'redux';
import {Signal} from 'openfin-service-signal';

import {Inject} from '../common/Injectables';
import {StoredNotification} from '../model/StoredNotification';
import {Storage, StorageMap} from '../model/Storage';
import {AsyncInit} from '../controller/AsyncInit';

import {ActionMap, ActionHandler, RootAction, Action, ActionOf} from './Actions';
import {RootState, Immutable} from './State';

export type StoreChangeObserver<T> = (oldValue: T, newValue: T) => void;

@injectable()
export class Store extends AsyncInit {
    private static INITIAL_STATE: RootState = {
        notifications: [],
        windowVisible: false
    };

    public readonly onAction: Signal<[RootAction]> = new Signal();

    private _actionMap: ActionMap;
    private _store!: ReduxStore<RootState, RootAction>;
    private _storage: Storage;

    constructor(@inject(Inject.ACTION_MAP) actionMap: ActionMap, @inject(Inject.STORAGE) storage: Storage) {
        super();
        this._actionMap = actionMap;
        this._storage = storage;
    }

    protected async init(): Promise<void> {
        this._store = createStore<RootState, RootAction, {}, {}>(this.reduce.bind(this), await this.getInitialState(), this.createEnhancer());
    }

    public get state(): Immutable<RootState> {
        return this._store.getState() as Immutable<RootState>;
    }

    public dispatch(action: RootAction): void {
        this._store.dispatch(action);
    }

    public async watchForChange<T>(getObject: (state: RootState) => T, observer: StoreChangeObserver<T>): Promise<Unsubscribe> {
        await this.initialized;
        const watcher = this.watch<T>(() => this.state, getObject);
        return this._store.subscribe(watcher(observer));
    }

    private watch<T>(getState: () => any, getObject: (state: RootState) => T): (observer: StoreChangeObserver<T>) => () => void {
        let currentValue = getObject(getState());
        return function w(observer: StoreChangeObserver<T>) {
            return function () {
                const newValue: T = getObject(getState());
                if (currentValue !== newValue) {
                    const oldValue = currentValue;
                    currentValue = newValue;
                    observer(oldValue, newValue);
                }
            };
        };
    }

    private reduce<T extends Action>(state: RootState | undefined, action: ActionOf<T>): RootState {
        const handler: ActionHandler<T> | undefined = this._actionMap[action.type] as ActionHandler<T>;

        if (handler) {
            return handler(state!, action);
        } else {
            console.info(`No handler registered for ${action && action.type}`);
            return state!;
        }
    }

    private createEnhancer(): StoreEnhancer {
        let enhancer: StoreEnhancer = applyMiddleware(this.createMiddleware.bind(this));

        if (process.env.NODE_ENV !== 'production') {
            const devTools = composeWithDevTools({
                // @ts-ignore: Property 'suppressConnectErrors' missing from type definitions
                realtime: true, port: 9950, suppressConnectErrors: true, sendOnError: 2
            });
            enhancer = devTools(enhancer);
        }

        return enhancer;
    }

    private createMiddleware(): (next: Dispatch<RootAction>) => (action: any) => any {
        return (next: Dispatch<RootAction>) => (action: RootAction) => {
            this.onAction.emit(action);

            return next(action);
        };
    }

    private async getInitialState(): Promise<RootState> {
        await this._storage.initialized;
        const initialState = this.cloneState(Store.INITIAL_STATE);

        const notifications: StoredNotification[] = [];
        this._storage.get(StorageMap.NOTIFICATIONS).iterate((value: string, key: string) => {
            notifications.push(JSON.parse(value));
        });
        Object.assign(initialState, {notifications});

        this._storage.get(StorageMap.SETTINGS).iterate((value: string, key: string) => {

        });

        return initialState;
    }

    private cloneState<T extends {}>(state: T | Immutable<T>): T {
        const ret: T = {} as T;
        const keys: (keyof T)[] = Object.keys(state) as (keyof T)[];

        keys.forEach(key => {
            const value = state[key];
            if (Array.isArray(value)) {
                ret[key] = value.map(item => {
                    if (typeof item === 'object' && item !== null) {
                        return this.cloneState(item);
                    } else {
                        return item;
                    }
                }) as any;
            } else if (typeof value !== 'object' || !value) {
                ret[key] = value as any;
            } else {
                ret[key] = this.cloneState(value as any);
            }
        });

        return ret;
    }
}
