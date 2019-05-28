
import {composeWithDevTools} from 'remote-redux-devtools';
import {Store as ReduxStore, combineReducers, applyMiddleware, createStore, StoreEnhancer} from 'redux';
import {injectable} from 'inversify';

import {notificationStorage, uiStorage} from '../model/Storage';

import {UIState, UIAction, reducer as uiReducer} from './ui/reducer';
import {NotificationsState, NotificationsAction, reducer as notificationsReducer, NotificationMap} from './notifications/reducer';
import {providerMiddleware} from './middleware';

export type Store = ReduxStore<RootState, RootAction>;

export interface RootState {
    notifications: NotificationsState;
    ui: UIState;
}

export type RootAction = UIAction | NotificationsAction;

@injectable()
export class StoreContainer {
    private _store!: Store;

    public get store() {
        return this._store;
    }

    public constructor() {
        this._store = this.createStore();
    }

    public getState = this.store.getState;
    public dispatch = this.store.dispatch;
    public subscribe = this.store.subscribe;

    private createStore(): Store {
        const initialState = this.loadState();
        const reducers = combineReducers({
            notifications: notificationsReducer,
            ui: uiReducer
        });
        const middleware = [providerMiddleware];

        let enhancer: StoreEnhancer = applyMiddleware(...middleware);
        if (process.env.NODE_ENV !== 'production') {
            const devTools = composeWithDevTools({
                // @ts-ignore
                realtime: true, port: 9950, suppressConnectErrors: false
            });
            enhancer = devTools(enhancer);
        }

        const store: Store = createStore<RootState, RootAction, {}, {}>(
            reducers,
            initialState,
            enhancer
        );

        return store;
    }

    private loadState(): RootState {
        const initialState: RootState = {
            notifications: {
                notifications: {}
            },
            ui: {
                windowVisible: false,
                toastDirection: [-1, 1]
            }
        };
        const cachedNotifications: NotificationMap = {};
        notificationStorage.iterate((value: string, key: string) => {
            Object.assign(cachedNotifications, {[key]: JSON.parse(value)});
        });

        const cachedUI: UIState = {...initialState.ui};
        uiStorage.iterate((value: string, key: string) => {
            Object.assign(cachedUI, {[key]: JSON.parse(value)});
        });

        const state = {
            ...initialState,
            ui: cachedUI,
            notifications: {
                notifications: cachedNotifications
            }
        };

        return state;
    }
}
