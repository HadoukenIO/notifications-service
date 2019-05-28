
import {composeWithDevTools} from 'remote-redux-devtools';
import {Store as ReduxStore, combineReducers, applyMiddleware, createStore, StoreEnhancer, Dispatch, Reducer} from 'redux';
import {injectable} from 'inversify';
import 'reflect-metadata';

import {notificationStorage, uiStorage} from '../model/Storage';
import {AsyncInit} from '../controller/AsyncInit';

import {UIState, UIAction, reducer as uiReducer} from './ui/reducer';
import {NotificationsState, NotificationsAction, reducer as notificationsReducer, NotificationMap} from './notifications/reducer';
import {StoreMiddleware} from './middleware';

export type Store = ReduxStore<RootState, RootAction>;

export interface RootState {
    notifications: NotificationsState;
    ui: UIState;
}

export type RootAction = UIAction | NotificationsAction;

@injectable()
export class StoreContainer extends AsyncInit implements Store {
    private _store!: Store;
    public getState = (): RootState => this.store.getState();
    public dispatch = (args: any): any => this.store.dispatch(args);
    public subscribe = (listener: () => void) => this.store.subscribe(listener);
    public replaceReducer = (nextReducer: Reducer<RootState, RootAction>) => this.store.replaceReducer(nextReducer);

    public get store() {
        return this._store;
    }

    public async init(): Promise<void> {
        this._store = await this.createStore();
        return new Promise((resolve) => {
            // this.getState = this.store.getState;
            // this.dispatch = this.store.dispatch;
            // this.subscribe = this.store.subscribe;
            // this.replaceReducer = this.store.replaceReducer;
            console.log('STORE CREATED');
            return resolve();
        });
    }


    private async createStore(): Promise<Store> {
        const initialState = await this.loadState();
        const reducers = combineReducers({
            notifications: notificationsReducer,
            ui: uiReducer
        });


        const middleware = [new StoreMiddleware().middleware];

        let enhancer: StoreEnhancer = applyMiddleware(...middleware);
        if (process.env.NODE_ENV !== 'production') {
            const devTools = composeWithDevTools({
                // @ts-ignore
                realtime: true, port: 9950, suppressConnectErrors: false
            });
            enhancer = devTools(enhancer);
        }

        const store = await createStore<RootState, RootAction, {}, {}>(
            reducers,
            initialState,
            enhancer
        );

        this.getState = store.getState;
        this.dispatch = store.dispatch;
        this.subscribe = store.subscribe;
        this.replaceReducer = store.replaceReducer;

        return store;
    }

    private async loadState(): Promise<RootState> {
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
        await notificationStorage.iterate((value: string, key: string) => {
            Object.assign(cachedNotifications, {[key]: JSON.parse(value)});
        });

        const cachedUI: UIState = {...initialState.ui};
        await uiStorage.iterate((value: string, key: string) => {
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
