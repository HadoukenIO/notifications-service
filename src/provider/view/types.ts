import {RootState} from '../store/State';
import {StoreAPI} from '../store/Store';
import {StoredNotification} from '../model/StoredNotification';

export interface Actionable {
    storeApi: StoreAPI<RootState>;
}

export type TitledNotification = StoredNotification & {title: string};
