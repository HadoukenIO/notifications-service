import * as React from 'react';
import {connect} from 'react-redux';
import {MemoryHistory} from 'history';

import {Header} from '../../../components/Header/Header';
import {NotificationView} from '../../../components/NotificationView/NotificationView';
import {RootState} from '../../../../store/State';
import {usePreduxStore} from '../../../utils/usePreduxStore';
import {WindowContext} from '../../../components/Wrappers/WindowContext';
import {GroupingType} from '../../../utils/Grouping';
import {ClassNameBuilder} from '../../../utils/ClassNameBuilder';
import {ROUTES} from '../../../routes';
import {Icon} from '../../../components/Icon/Icon';
import SettingsIcon from '../../../../../../res/provider/ui/image/shapes/Settings.svg';
import {StoredNotification} from '../../../../model/StoredNotification';
import {StoredApplication} from '../../../../model/Environment';

import * as Styles from './NotificationsPanel.module.scss';

interface Props {
    history: MemoryHistory;
    notifications: StoredNotification[];
    applications: ReadonlyMap<string, StoredApplication>;
    centerLocked: boolean;
}

const NotificationsPanelComponent: React.FC<Props> = (props) => {
    const {notifications, applications, history} = props;
    const storeApi = usePreduxStore();
    const [groupBy, setGroupBy] = React.useState(GroupingType.DATE);
    const window = React.useContext(WindowContext);

    React.useEffect(() => {
        window.document.title = 'Center';
    });

    return (
        <div className="notification-center">
            <Header history={history as MemoryHistory}>
                <div className={Styles['strip-content']}>
                    <ul className={ClassNameBuilder.join(Styles, 'options')}>
                        <li className={ClassNameBuilder.join(Styles, 'detail')}>
                            <span>Group By:</span>
                        </li>
                        {
                            Object.values(GroupingType).map((name, i) => {
                                const classNames = new ClassNameBuilder(Styles, 'sort-button', ['active', name === groupBy]);
                                return (
                                    <li
                                        key={i}
                                        className={classNames.toString()}
                                        onClick={() => setGroupBy(name)}
                                    >
                                        <span>{name}</span>
                                    </li>
                                );
                            })
                        }
                        <li className={ClassNameBuilder.join(Styles, 'detail', 'settings')} onClick={() => history.push(ROUTES.SETTINGS)}>
                            <span>Settings</span>
                            <Icon className={ClassNameBuilder.join(Styles, 'icon')} src={SettingsIcon} />
                        </li>
                    </ul>
                </div>
            </Header>
            <NotificationView
                notifications={notifications}
                applications={applications}
                groupBy={groupBy}
                storeApi={storeApi}
            />
        </div>
    );
};

const mapStateToProps = (state: RootState) => ({
    notifications: state.notifications,
    applications: state.applications,
    centerLocked: state.centerLocked
});

export const NotificationsPanel = connect(mapStateToProps)(NotificationsPanelComponent);
