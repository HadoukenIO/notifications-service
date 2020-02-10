import * as React from 'react';

import {ClassNameBuilder} from '../../utils/ClassNameBuilder';
import {Icon} from '../Icon/Icon';
import MinusIcon from '../../../../../res/provider/ui/image/shapes/minus.svg';

import * as Styles from './FeedSettings.module.scss';

export interface Feed {
    name: string;
    icon?: string;
}

export const FeedSettings: React.FC<Feed> = (props) => {
    const {name, icon} = props;
    const classNames = new ClassNameBuilder(Styles, 'feed');

    return (
        <div className={classNames.toString()}>
            <div className={Styles['header']}>
                <div className={Styles['icon']} style={{backgroundImage: `url(${icon})`}}></div>
                <div className={Styles['name']}>{name}</div>
                <div className={Styles['remove']}>
                    <Icon src={MinusIcon} />
                </div>
            </div>
        </div>
    );
};
