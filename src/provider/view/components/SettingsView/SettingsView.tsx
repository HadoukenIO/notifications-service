import * as React from 'react';
import {MemoryHistory} from 'history';
import {connect} from 'react-redux';

import {ToggleCenterLocked, ToggleCenterMuted} from '../../../store/Actions';
import {usePreduxStore} from '../../utils/usePreduxStore';
import {ClassNameBuilder} from '../../utils/ClassNameBuilder';
import {Toggle} from '../Controls/Toggle/Toggle';
import {FeedSettings} from '../FeedSettings/FeedSettings';
import {Button} from '../Controls/Button/Button';
import {ROUTES} from '../../routes';
import {RootState} from '../../../store/State';
import {NotificationFeed} from '../../../model/NotificationFeed';

import * as Styles from './SettingsView.module.scss';

interface Props {
    history: MemoryHistory;
    feeds: NotificationFeed[];
    centerLocked: boolean;
    centerMuted: boolean;
}

const SettingsViewComponent: React.FC<Props> = (props) => {
    const {history, feeds, centerLocked, centerMuted} = props;
    const storeApi = usePreduxStore();

    const subscibedFeeds = feeds.filter((feed) => feed.subscribed);

    function onAddFeedButtonClick(): void {
        history.push(ROUTES.FEEDS);
    }

    return (
        <div className={ClassNameBuilder.join(Styles, 'settings-view')}>
            <div className={ClassNameBuilder.join(Styles, 'notifications', 'section')}>
                <ul>
                    <li>
                        <span>Auto-hide center</span>
                        <Toggle id="lock-link" state={!centerLocked} onChange={() => {
                            new ToggleCenterLocked().dispatch(storeApi);
                        }} />
                    </li>
                    <li>
                        <span>Do not disturb</span>
                        <Toggle id="mute-link" state={centerMuted} onChange={() => {
                            new ToggleCenterMuted().dispatch(storeApi);
                        }} />
                    </li>
                </ul>
            </div>
            <div className={ClassNameBuilder.join(Styles, 'feed', 'section')}>
                <h1>Notifications</h1>
                <ul>
                    {subscibedFeeds.length > 0
                        ? subscibedFeeds.map((f, i) => <li key={i}><FeedSettings {...f} /></li>)
                        : <div className={ClassNameBuilder.join(Styles, 'no-feeds-text')}>You are not subscribed to any feeds</div>}
                </ul>
                <Button onClick={onAddFeedButtonClick}>Add a Feed</Button>
            </div>
        </div>
    );
};

const mapStateToProps = (state: RootState) => ({
    centerLocked: state.centerLocked,
    centerMuted: state.centerMuted,
    feeds: state.feeds
});

export const SettingsView = connect(mapStateToProps)(SettingsViewComponent);
