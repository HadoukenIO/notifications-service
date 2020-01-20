import * as React from 'react';
import {connect} from 'react-redux';

import {ClassNameBuilder} from '../../utils/ClassNameBuilder';
import {NotificationFeed} from '../../../model/NotificationFeed';
import {FeedCard} from '../FeedCard/FeedCard';
import {RootState} from '../../../store/State';

import * as Styles from './FeedsView.module.scss';

interface Props {
    feeds: NotificationFeed[];
}

function mapStateToProps(state: RootState): Props {
    return {
        feeds: state.feeds
    };
}

const FeedsViewComponent: React.FC<Props> = (props) => {
    const {feeds} = props;

    return (
        <div className={ClassNameBuilder.join(Styles, 'feeds-view')}>
            {feeds.length > 0
                ? feeds.map((feed) => <FeedCard {...feed} key={feed.id} />)
                : <div className={ClassNameBuilder.join(Styles, 'no-feeds-text')}>No feeds available</div>}
        </div>
    );
};

export const FeedsView = connect(mapStateToProps)(FeedsViewComponent);
