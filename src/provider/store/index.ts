
import {composeWithDevTools} from 'remote-redux-devtools';
import {Store as ReduxStore, combineReducers, applyMiddleware, createStore, StoreEnhancer} from 'redux';
import {Persistor, PersistConfig, persistReducer, persistStore} from 'redux-persist';

import {storage} from '../model/Storage';

import {UIState, UIAction, reducer as uiReducer} from './ui/reducer';
import {NotificationsState, NotificationsAction, reducer as notificationsReducer} from './notifications/reducer';
import {providerMiddleware} from './middleware/providerMiddleware';
import {Constants as uiConstants} from './ui/constants';
import {Constants as notificationsConstants} from './notifications/constants';

export type Store = ReduxStore<RootState, RootAction>;

export interface RootState {
    notifications: NotificationsState;
    ui: UIState;
}

export type RootAction = UIAction | NotificationsAction;

export const RootConstants = {
    ui: uiConstants,
    notifications: notificationsConstants
};

const reducers = combineReducers({
    notifications: notificationsReducer,
    ui: uiReducer
});

const middleware = [providerMiddleware];

let enhancer: StoreEnhancer = applyMiddleware(...middleware);
if (process.env.NODE_ENV !== 'production') {
    const devTools = composeWithDevTools({realtime: true, port: 9950});
    enhancer = devTools(enhancer);
}

const persistConfig: PersistConfig = {
    key: 'root',
    debug: process.env.NODE_ENV !== 'production',
    storage
};

const persistedReducer = persistReducer<RootState, RootAction>(persistConfig, reducers);

export function configureStore(initialState: RootState): {store: Store, persistor: Persistor} {
    const store = createStore(
        persistedReducer,
        initialState,
        enhancer
    );
    const persistor = persistStore(store);

    if (process.env.NODE_ENV !== 'production') {
        // For testing in the console
        Object.defineProperty(window, 'persistor', {
            value: persistor,
            writable: false
        });
    }

    return {store, persistor};
}
