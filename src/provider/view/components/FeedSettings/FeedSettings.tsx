import * as React from 'react';

import {ClassNameBuilder} from '../../utils/ClassNameBuilder';
import {Icon} from '../Icon/Icon';
import MinusIcon from '../../../../../res/provider/ui/image/shapes/minus.svg';
import {NotificationFeed} from '../../../model/NotificationFeed';
import {UnsubscribeFeed} from '../../../store/Actions';
import {usePreduxStore} from '../../utils/usePreduxStore';

import * as Styles from './FeedSettings.module.scss';

export const FeedSettings: React.FC<NotificationFeed> = (props) => {
    const {name, logo, id} = props;
    const classNames = new ClassNameBuilder(Styles, 'feed');

    const store = usePreduxStore();

    function onUnsubscribeButtonClick() {
        new UnsubscribeFeed(id).dispatch(store);
    }

    return (
        <div className={classNames.toString()}>
            <div className={Styles['header']}>
                <div className={Styles['icon']} style={{backgroundImage: `url(${logo})`}}></div>
                <div className={Styles['name']}>{name}</div>
                <div className={Styles['remove']}>
                    <Icon src={MinusIcon} onClick={onUnsubscribeButtonClick} />
                </div>
            </div>
        </div>
    );
};
