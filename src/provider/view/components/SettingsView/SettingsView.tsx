import * as React from 'react';

import {usePreduxStore} from '../../utils/usePreduxStore';
import {ToggleCenterLocked, ToggleCenterMuted} from '../../../store/Actions';
import {ClassNameBuilder} from '../../utils/ClassNameBuilder';
import {Toggle} from '../Controls/Toggle/Toggle';
import {FeedSettings, Feed} from '../FeedSettings/FeedSettings';
import {Button} from '../Controls/Button/Button';

import * as Styles from './SettingsView.module.scss';

const mockFeed: Feed = {
    name: 'FTSE',
    icon: 'https://cdn.pixabay.com/photo/2016/01/26/17/15/gmail-1162901_960_720.png'
};

const mockFeeds = new Array(5).fill(mockFeed);

export const SettingsView: React.FC = (props) => {
    const storeApi = usePreduxStore();

    return (
        <div className={ClassNameBuilder.join(Styles, 'settings-view')}>
            <div className={ClassNameBuilder.join(Styles, 'notifications', 'section')}>
                <ul>
                    <li>
                        <span>Auto-hide center</span>
                        <Toggle state={!storeApi.state.centerLocked} onChange={() => {
                            new ToggleCenterLocked().dispatch(storeApi);
                        }} />
                    </li>
                    <li>
                        <span>Do not disturb</span>
                        <Toggle state={storeApi.state.centerMuted} onChange={() => {
                            new ToggleCenterMuted().dispatch(storeApi);
                        }} />
                    </li>
                </ul>
            </div>
            <div className={ClassNameBuilder.join(Styles, 'feed', 'section')}>
                <h1>Notifications</h1>
                <ul>
                    {mockFeeds.map((f, i) => <li key={i}><FeedSettings {...f} /></li>)}
                </ul>
                <Button>Add a Feed</Button>
            </div>
        </div>
    );
};
