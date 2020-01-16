import * as React from 'react';
import {connect} from 'react-redux';

import {ClassNameBuilder} from '../../utils/ClassNameBuilder';
import {Icon} from '../Icon/Icon';
import minus from '../../../../../res/provider/ui/image/shapes/minus-circ.svg';
import plus from '../../../../../res/provider/ui/image/shapes/plus-circ.svg';
import {NotificationFeed} from '../../../model/NotificationFeed';
import {RootState} from '../../../store/State';

import * as Styles from './FeedsView.module.scss';

interface CardProps {
    logo: string;
    name: string;
    description: string;
    subscribed: boolean;
}

// className={ClassNameBuilder.join(Styles, 'settings-view')}

const Card: React.FC<CardProps> = (props) => {
    const {logo, name, description, subscribed} = props;

    return (
        <div className={ClassNameBuilder.join(Styles, 'card')}>
            <div className={ClassNameBuilder.join(Styles, 'left')}>
                <div className={ClassNameBuilder.join(Styles, 'feed-icon')} style={{backgroundImage: `url(${logo})`}}></div>
            </div>
            <div className={ClassNameBuilder.join(Styles, 'middle')}>
                <div className={ClassNameBuilder.join(Styles, 'feed-name')}>
                    {name}
                </div>
                <div className={ClassNameBuilder.join(Styles, 'feed-description')}>
                    {description}
                </div>
            </div>
            <div className={ClassNameBuilder.join(Styles, 'right')}>
                {<Icon src={subscribed ? minus : plus} size={16} />}
            </div>
        </div>
    );
};

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
                ? feeds.map((feed) => <Card {...feed} key={feed.id} />)
                : <div className={ClassNameBuilder.join(Styles, 'placeholder-text')}>No feeds available</div>}
        </div>
    );
};

export const FeedsView = connect(mapStateToProps)(FeedsViewComponent);
