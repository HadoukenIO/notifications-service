import {injectable, inject} from 'inversify';
import {composeWithDevTools} from 'remote-redux-devtools';
import {Store as ReduxStore, applyMiddleware, createStore, StoreEnhancer, Dispatch, Unsubscribe} from 'redux';
import {Signal, Aggregators} from 'openfin-service-signal';

import {Inject} from '../common/Injectables';
import {notificationStorage} from '../model/Storage';
import {StoredNotification} from '../model/StoredNotification';

import {ActionHandlerMap, ActionHandler, RootAction, Action, ActionOf, CustomAction} from './Actions';
import {RootState} from './State';

export type StoreChangeObserver<T> = (oldValue: T, newValue: T) => void;

/**
 * Subset of properties of `Store` that are safe for use from actions and components.
 */
export interface StoreAPI {
    state: RootState;
    dispatch(action: RootAction): Promise<void>;
}

@injectable()
export class Store implements StoreAPI {
    private static INITIAL_STATE: RootState = {
        notifications: [],
        windowVisible: false
    };

    public readonly onAction: Signal<[RootAction], Promise<void>> = new Signal(Aggregators.AWAIT_VOID);

    private _actionHandlerMap: ActionHandlerMap;
    private _store: ReduxStore<RootState, RootAction>;

    constructor(@inject(Inject.ACTION_HANDLER_MAP) actionHandlerMap: ActionHandlerMap) {
        this._actionHandlerMap = actionHandlerMap;
        this._store = createStore<RootState, RootAction, {}, {}>(this.reduce.bind(this), this.getInitialState(), this.createEnhancer());
    }

    public get state(): RootState {
        return this._store.getState() as RootState;
    }

    public async dispatch(action: RootAction): Promise<void> {
        if (action instanceof CustomAction) {
            // Action has custom dispatch logic
            await action.dispatch(this);
        } else {
            // Pass straight through to redux store
            await this._store.dispatch({...action});
        }
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
        const handler: ActionHandler<T> | undefined = this._actionHandlerMap[action.type] as ActionHandler<T>;

        if (handler) {
            return handler(state!, action);
        } else {
            // No handler registered for this action - action does not modify the store's state
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

    private createMiddleware(): (next: Dispatch<RootAction>) => (action: RootAction) => Promise<RootAction> {
        return (next: Dispatch<RootAction>) => async (action: RootAction): Promise<RootAction> => {
            await this.onAction.emit(action);

            return next(action);
        };
    }

    private getInitialState(): RootState {
        const notifications: StoredNotification[] = [];
        notificationStorage.iterate((value: string, key: string) => {
            notifications.push(JSON.parse(value));
        });

        return Object.assign({}, Store.INITIAL_STATE, {notifications});
    }
}
