import {Store, AnyAction} from 'redux';
import {Persistor} from 'redux-persist';

import {RootState} from './typings';

let configureStore: (initialState: RootState, injectables: {}) => {store: Store, persistor: Persistor};

if (process.env.NODE_ENV === 'production') {
    configureStore = require('./configureStore.prod').default;
} else {
    configureStore = require('./configureStore.dev').default;
}

export default configureStore;

