import {combineReducers} from 'redux';

import notifications from './notifications/reducer';
import ui from './ui/reducer';

const reducers = combineReducers({
    notifications,
    ui
});

export default reducers;
