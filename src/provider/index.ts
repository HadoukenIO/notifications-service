import configureStore from './store';
import {NotificationCenter} from './controller/NotificationCenter';
import {registerService} from './controller/IABService';
import {RootState} from './store/typings';
import {ToastManager} from './controller/ToastManager';
import {ContextMenu} from './common/ContextMenu';

// Initial state is overwritten by the persisted data
const initialState: RootState = {
    notifications: {
        notifications: {}
    },
    ui: {
        windowVisible: false,
        bannerDirection: [-1, -1],
        actionDirection: [1, 1]
    }
};

// Redux store
const {store, persistor} = configureStore(initialState, {});

// Change to singleton?
const notificationCenter = new NotificationCenter(store, {hideOnBlur: true});
ContextMenu.instance.initialize();

ToastManager.instance.initialize(store);
// IAB
registerService(store);
