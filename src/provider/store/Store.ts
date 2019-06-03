import {injectable, inject} from 'inversify';
import {composeWithDevTools} from 'remote-redux-devtools';
import {Store as ReduxStore, applyMiddleware, createStore, StoreEnhancer, Dispatch, Unsubscribe} from 'redux';

import {Signal1} from '../common/Signal';
import {Inject} from '../common/Injectables';
import {notificationStorage, settingsStorage} from '../model/Storage';
import {StoredNotification} from '../model/StoredNotification';

import {ActionMap, ActionHandler, RootAction, Action, ActionOf} from './Actions';
import {RootState, Immutable} from './State';

export type StoreChangeObserver<T> = (oldValue: T, newValue: T) => void;

@injectable()
export class Store {
    private static INITIAL_STATE: RootState = {
        notifications: [],
        windowVisible: false
    };

    public readonly onAction: Signal1<RootAction> = new Signal1();

    private _actionMap: ActionMap;
    private _store: ReduxStore<RootState, RootAction>;

    constructor(@inject(Inject.ACTION_MAP) actionMap: ActionMap) {
        this._actionMap = actionMap;
        this._store = createStore<RootState, RootAction, {}, {}>(this.reduce.bind(this), this.getInitialState(), this.createEnhancer());
    }

    public get state(): Immutable<RootState> {
        return this._store.getState() as Immutable<RootState>;
    }

    public dispatch(action: RootAction): void {
        this._store.dispatch(action);
    }

    public watchForChange<T>(getObject: (state: RootState) => T, observer: StoreChangeObserver<T>): Unsubscribe {
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

    private getInitialState(): RootState {
        const initialState = this.cloneState(Store.INITIAL_STATE);

        const notifications: StoredNotification[] = [];
        notificationStorage.iterate((value: string, key: string) => {
            notifications.push(JSON.parse(value));
        });
        Object.assign(initialState, {notifications});

        settingsStorage.iterate((value: string, key: string) => {

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
