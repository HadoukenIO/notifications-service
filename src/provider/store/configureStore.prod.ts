import {createStore, applyMiddleware, Store} from 'redux';
import thunk from 'redux-thunk';
import {persistStore, persistReducer, PersistConfig, Persistor} from 'redux-persist';

import Storage from '../model/Storage';

import {RootState} from './typings';
import {ProviderMiddleware} from './middleware/ProviderMiddleware';
import rootReducer from './root-reducer';


const persistConfig: PersistConfig = {
    key: 'root',
    debug: true,
    storage: Storage
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

const middleware = (injectables: {}) => applyMiddleware(
    thunk.withExtraArgument<{}>(injectables),
    ProviderMiddleware
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
