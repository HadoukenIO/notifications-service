import * as React from 'react';
import {MemoryHistory} from 'history';
import {connect} from 'react-redux';

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
}

const SettingsViewComponent: React.FC<Props> = (props) => {
    const {history, feeds} = props;

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
                        <Toggle state={false} />
                    </li>
                    <li>
                        <span>Do not disturb</span>
                        <Toggle state={false} />
                    </li>
                </ul>
            </div>
            <div className={ClassNameBuilder.join(Styles, 'feed', 'section')}>
                <h1>Notifications</h1>
                <ul>
                    {subscibedFeeds.map((f, i) => <li key={i}><FeedSettings {...f} /></li>)}
                </ul>
                <Button onClick={onAddFeedButtonClick}>Add a Feed</Button>
            </div>
        </div>
    );
};

function mapStateToProps(state: RootState) {
    return {
        feeds: state.feeds
    };
}

export const SettingsView = connect(mapStateToProps)(SettingsViewComponent);
