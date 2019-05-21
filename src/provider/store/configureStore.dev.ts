import {createStore, applyMiddleware, Store} from 'redux';
import {composeWithDevTools} from 'remote-redux-devtools';
import thunk from 'redux-thunk';
import {persistStore, persistReducer, PersistConfig, Persistor} from 'redux-persist';

import Storage from '../model/Storage';

import {RootState} from './typings';
import {providerMiddleware} from './middleware/providerMiddleware';
import rootReducer from './root-reducer';


const persistConfig: PersistConfig = {
    key: 'root',
    debug: true,
    storage: Storage
};

const middleware = (injectables: {}) => applyMiddleware(
    thunk.withExtraArgument<{}>(injectables),
    providerMiddleware
);

const persistedReducer = persistReducer(persistConfig, rootReducer);

const composeEnhancers = composeWithDevTools({realtime: true, port: 9950});

export default function configureStore(initialState: RootState, injectables: {}): {store: Store, persistor: Persistor} {
    const store = createStore(
        persistedReducer,
        initialState,
        composeEnhancers(middleware(injectables))
    );
    const persistor = persistStore(store);

    // For testing int he console
    Object.defineProperty(window, 'persistor', {
        value: persistor,
        writable: false
    });

    return {store, persistor};
}
