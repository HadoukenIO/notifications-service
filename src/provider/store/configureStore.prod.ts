import {createStore, applyMiddleware, Store} from 'redux';
import thunk from 'redux-thunk';
import {persistStore, persistReducer, PersistConfig, Persistor} from 'redux-persist';

import {storage} from '../model/Storage';

import {RootState} from './typings';
import {providerMiddleware} from './middleware/providerMiddleware';
import rootReducer from './root-reducer';

const persistConfig: PersistConfig = {
    key: 'root',
    debug: process.env.NODE_ENV !== 'production',
    storage
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

const middleware = (injectables: {}) => applyMiddleware(
    thunk.withExtraArgument<{}>(injectables),
    providerMiddleware
);

export default function configureStore(initialState: RootState, injectables: {}): {store: Store, persistor: Persistor} {
    const store = createStore(
        persistedReducer,
        initialState,
        middleware(injectables)
    );
    const persistor = persistStore(store);

    return {store, persistor};
}
