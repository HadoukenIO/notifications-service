import {combineReducers} from 'redux';

import {reducer as notifications} from './notifications/reducer';
import {reducer as ui} from './ui/reducer';

const reducers = combineReducers({
    notifications,
    ui
});

export default reducers;
