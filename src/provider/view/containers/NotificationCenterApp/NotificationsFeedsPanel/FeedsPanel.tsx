import * as React from 'react';
import {connect} from 'react-redux';
import {RouteComponentProps} from 'react-router';
import {MemoryHistory} from 'history';

import {RootState} from '../../../../store/State';
import {Header} from '../../../components/Header/Header';
import {ClassNameBuilder} from '../../../utils/ClassNameBuilder';
import {FeedsView} from '../../../components/FeedsView/FeedsView';

import * as Styles from './FeedsPanel.module.scss';

interface Props extends RouteComponentProps {

}

const FeedsPanelComponent: React.FC<Props> = (props) => {
    const {history} = props;

    return (
        <div className="notification-center">
            <Header history={history as MemoryHistory}>
                <div className={ClassNameBuilder.join(Styles, 'strip-content')}>
                    <span>Notification Feeds</span>
                </div>
            </Header>
            <FeedsView />
        </div>
    );
};

const mapStateToProps = (state: RootState) => ({
});

export const FeedsPanel = connect(mapStateToProps)(FeedsPanelComponent);
