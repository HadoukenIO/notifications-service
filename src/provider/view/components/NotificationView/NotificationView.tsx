import * as React from 'react';
import {TransitionGroup, CSSTransition} from 'react-transition-group';

import {NotificationGroup} from '../NotificationGroup/NotificationGroup';
import {GroupingType, Group, groupNotifications} from '../../utils/Grouping';
import {Actionable} from '../../../store/Actions';
import {StoredNotification} from '../../../model/StoredNotification';

import './NotificationView.scss';

interface Props extends Actionable {
    notifications: StoredNotification[];
    groupBy: GroupingType;
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
    const {notifications, groupBy, ...rest} = props;
    const [groups, setGroups] = React.useState<Map<string, Group>>(new Map());

    React.useEffect(() => {
        // Sort the notification by groups
        setGroups(groupNotifications(notifications, groupBy));
    }, [notifications, groupBy]);

    return (
        <TransitionGroup className="view" component="div">
            {
                [...groups.values()].map((group: Group) => (
                    <CSSTransition
                        key={group.key}
                        timeout={300}
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
            {
                !groups.size && <Placeholder />
            }
        </TransitionGroup>
    );
}

export function Placeholder() {
    return (
        <div className="placeholder">
            <h3>All caught up!</h3>
        </div>
    );
}
