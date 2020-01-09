import * as React from 'react';
import {RouteComponentProps} from 'react-router-dom';
import {connect} from 'react-redux';
import {MemoryHistory} from 'history';

import {RootState} from '../../../../store/State';
import {Header} from '../../../components/Header/Header';
import {SettingsView} from '../../../components/SettingsView/SettingsView';
import {ClassNameBuilder} from '../../../utils/ClassNameBuilder';
import {Icon} from '../../../components/Icon/Icon';
import SettingsIcon from '../../../../../../res/provider/ui/image/shapes/Settings.svg';

import * as Styles from './SettingsPanel.module.scss';

interface Props extends RouteComponentProps {

}

const SettingsPanelComponent: React.FC<Props> = (props) => {
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

const mapStateToProps = (state: RootState) => ({
});

export const SettingsPanel = connect(mapStateToProps)(SettingsPanelComponent);
