import * as React from 'react';

import {ClassNameBuilder} from '../../utils/ClassNameBuilder';
import {Icon} from '../Icon/Icon';
import minus from '../../../../../res/provider/ui/image/shapes/minus-circ.svg';
import plus from '../../../../../res/provider/ui/image/shapes/plus-circ.svg';

import * as Styles from './FeedsView.module.scss';
import Logo from './logo.svg';

const LOREM_IPSUM_TEXT = 'Lorem ipsum dolor sit amet, has cu dico natum. Ius veri patrioque ne. Eu mea suas appetere, quem constituto eam cu.';

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

const feeds: CardProps[] = [
    {subscribed: false, logo: Logo, name: 'Feed 1', description: LOREM_IPSUM_TEXT},
    {subscribed: true, logo: Logo, name: 'Feed 2', description: LOREM_IPSUM_TEXT},
    {subscribed: true, logo: Logo, name: 'Feed 3', description: LOREM_IPSUM_TEXT},
    {subscribed: false, logo: Logo, name: 'Feed 4', description: LOREM_IPSUM_TEXT},
    {subscribed: true, logo: Logo, name: 'Feed 5', description: LOREM_IPSUM_TEXT}
];

export const FeedsView: React.FC = (props) => {
    return (
        <div className={ClassNameBuilder.join(Styles, 'feeds-view')}>
            {feeds.map((feed) => <Card {...feed} key={feed.name} />)}
        </div>
    );
};
