import * as React from 'react';
import {RouteComponentProps} from 'react-router-dom';
import {MemoryHistory} from 'history';

import {Header} from '../../../components/Header/Header';
import {SettingsView} from '../../../components/SettingsView/SettingsView';
import {ClassNameBuilder} from '../../../utils/ClassNameBuilder';
import {Icon} from '../../../components/Icon/Icon';
import SettingsIcon from '../../../../../../res/provider/ui/image/shapes/Settings.svg';

import * as Styles from './SettingsPanel.module.scss';

export const SettingsPanel: React.FC<RouteComponentProps> = (props) => {
    const {history} = props;

    return (
        <div className="notification-center">
            <Header history={history as MemoryHistory}>
                <div className={ClassNameBuilder.join(Styles, 'strip-content')}>
                    <span>Settings</span>
                    <Icon className={ClassNameBuilder.join(Styles, 'icon')} src={SettingsIcon} />
                </div>
            </Header>
            <SettingsView />
        </div>
    );
};
