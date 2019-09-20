import * as React from 'react';
import {TransitionGroup, CSSTransition} from 'react-transition-group';

import {NotificationGroup} from '../NotificationGroup/NotificationGroup';
import {GroupingType, Group, groupNotifications} from '../../utils/Grouping';
import {StoredApplicationMap} from '../../../store/State';
import {StoredNotification} from '../../../model/StoredNotification';
import {TitledNotification, Actionable} from '../../types';

import './NotificationView.scss';

interface Props extends Actionable {
    notifications: StoredNotification[];
    groupBy: GroupingType;
    applications: StoredApplicationMap,
}

/**
 * Component for displaying a list of notifications.
 *
 * Notifications will be grouped according to the 'groupBy' property in the
 * component's props. The grouping is managed entirely within the component -
 * the only input is a flat list of all notifications.
 * @param props Props
 */
export function NotificationView(props: Props) {
    const {notifications, applications, groupBy, ...rest} = props;
    const [groups, setGroups] = React.useState<Group[]>([]);

    React.useEffect(() => {
        // Sort the notification by groups
        setGroups(groupNotifications(notifications, applications, groupBy));
    }, [notifications, groupBy]);

    return (
        <TransitionGroup className="view" component="div">
            <NoNotificationsMessage visible={notifications.length === 0} />
            {
                groups.map((group: Group) => (
                    <CSSTransition
                        key={group.key}
                        timeout={200}
                        classNames="group-item"
                        exit={groupBy === group.type}
                    >
                        <NotificationGroup
                            key={group.key}
                            name={group.title}
                            notifications={group.notifications}
                            {...rest}
                        />
                    </CSSTransition>
                ))
            }
        </TransitionGroup>
    );
}

export function NoNotificationsMessage({visible}: {visible: boolean}) {
    return (
        <div className="no-notes-message" style={{display: visible ? 'block' : 'none'}}>
            <h3>No new notifications</h3>
        </div>
    );
}
