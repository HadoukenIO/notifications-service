import * as React from 'react';

import {ClassNameBuilder} from '../../utils/ClassNameBuilder';
import {Icon} from '../Icon/Icon';
import minus from '../../../../../res/provider/ui/image/shapes/minus-circ.svg';
import plus from '../../../../../res/provider/ui/image/shapes/plus-circ.svg';
import {NotificationFeed} from '../../../model/NotificationFeed';
import {usePreduxStore} from '../../utils/usePreduxStore';
import {UnsubscribeFeed, SubscribeFeed} from '../../../store/Actions';

import * as Styles from './FeedCard.module.scss';

export const FeedCard: React.FC<NotificationFeed> = (props) => {
    const {logo, name, description, subscribed, id} = props;

    const store = usePreduxStore();

    function onSubscribeButtonClick() {
        if (subscribed) {
            new UnsubscribeFeed(id).dispatch(store);
        } else {
            new SubscribeFeed(id).dispatch(store);
        }
    }

    const buttonClassNameBuilder = new ClassNameBuilder(Styles, ['minus', subscribed], ['plus', !subscribed]);

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
                {<Icon className={buttonClassNameBuilder.toString()} src={subscribed ? minus : plus} size={16} onClick={onSubscribeButtonClick} />}
            </div>
        </div>
    );
};
