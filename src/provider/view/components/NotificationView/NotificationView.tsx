import * as React from 'react';

import moment from 'moment';

import {ToastManager} from '../../../controller/ToastManager';
import {NotificationGroup} from '../NotificationGroup/NotificationGroup';
import {NotificationCenterAPI} from '../../../model/NotificationCenterAPI';
import {SenderInfo, INotification} from '../../../../client/Notification';
import {GroupingType as GroupingType} from '../../NotificationCenterApp';

declare var window: Window & {openfin: {notifications: NotificationCenterAPI}};

interface NotificationViewProps {
    groupBy?: GroupingType;
}

interface NotificationViewState {
    notifications: INotification[];
}

/**
 * A notification group - a set of notifications that should be grouped together
 * within the UI.
 *
 * Grouping method can vary, but all grouping methods will produce a set of
 * these groups.
 */
interface NotificationGroup {
    /**
     * Unique identifier for this group.
     */
    key: string;

    /**
     * User-visibile title that will be displayed above these notifications
     */
    title: string;

    /**
     * The notifications to display within this group.
     *
     * This array should always contain at least one notification. If there are no
     * notifications that fit within this category then the group should be deleted.
     */
    notifications: INotification[];
}

/**
 * Component for displaying a list of notifications.
 *
 * Notifications will be grouped according to the 'groupBy' property in the
 * component's props. The grouping is managed entirely within the component -
 * the only input is a flat list of all notifications.
 */
export class NotificationView extends React.Component<NotificationViewProps, NotificationViewState> {
    private constructor(props: NotificationViewProps) {
        super(props);
        this.state = {notifications: []};
    }

    public componentDidMount(): void {
        fin.desktop.main(async () => {
            const allNotifications = await window.openfin.notifications.fetchAllNotifications();
            this.setState({notifications: allNotifications});

            window.openfin.notifications.addEventListener(
                'notificationCreated',
                (payload: INotification & SenderInfo): string => {
                    const notifications: INotification[] = this.state.notifications.slice(),
                        index: number = notifications.findIndex(
                            (notification: INotification) =>
                                notification.id === payload.id &&
                                notification.uuid === payload.uuid
                        );

                    if (index === -1) {
                        notifications.push(
                            Object.assign(payload, {
                                date: new Date(payload.date)
                            })
                        );
                        this.setState({notifications});
                    } else {
                        // TODO: Harden messaging within provider so that this can't
                        // happen. To reproduce issue, hit 'create' button twice in
                        // succession.
                        console.warn(
                            'A notification was added, but notification already exists - ignoring new notification'
                        );
                    }

                    ToastManager.instance.create(payload);
                    return '';
                }
            );

            window.openfin.notifications.addEventListener(
                'notificationCleared',
                (payload: {id: string} & SenderInfo): string => {
                    const notifications: INotification[] = this.state.notifications.slice();
                    const index: number = notifications.findIndex(
                        (notification: INotification) =>
                            notification.id === payload.id &&
                            notification.uuid === payload.uuid
                    );

                    if (index >= 0) {
                        notifications.splice(index, 1);
                        this.setState({notifications});
                    } else {
                        console.warn(
                            "A notification was cleared, but couldn't find it within the list of active notifications"
                        );
                    }
                    return '';
                }
            );

            window.openfin.notifications.addEventListener(
                'appNotificationsCleared',
                (payload: {uuid: string}): string => {
                    const newNotifications: INotification[] = this.state.notifications.filter(
                        notification => notification.uuid !== payload.uuid
                    );
                    this.setState({notifications: newNotifications});
                    return '';
                }
            );

            // Set an interval to update the time every minute
            setInterval(() => {
                this.forceUpdate();
            }, 60000);
        });
    }

    public render(): React.ReactNode {
        const groups: NotificationGroup[] = this.formatNotificationsAppSorted(
            this.state.notifications
        );
        const components: JSX.Element[] = this.createComponents(groups);

        return <div className="notification-container">{components}</div>;
    }

    /**
     * @method formatNotificationsAppSorted Formats Notification state object for
     * app sorted option
     * @private
     * @returns Array<NotificationGroup>
     */
    private formatNotificationsAppSorted(notifications: INotification[]): NotificationGroup[] {
        const groupLookup: {[groupKey: string]: NotificationGroup} = {};
        const groups: NotificationGroup[] = [];
        const groupMethod: GroupingType = this.props.groupBy || GroupingType.APPLICATION;

        function getOrCreateGroup(
            groupName: string,
            notification: INotification
        ): NotificationGroup {
            let group: NotificationGroup = groupLookup[groupName];

            if (!group) {
                // Create new group
                group = {
                    key: groupName,
                    title: getGroupTitle(notification),
                    notifications: []
                };

                // Add group
                groups.push(group);
                groupLookup[groupName] = group;
            }

            return group;
        }
        function getGroupTitle(notification: INotification): string {
            // When creating a new notification group, this function determines the
            // user-visible title for the group
            if (groupMethod === GroupingType.APPLICATION) {
                return notification.name;
            } else if (groupMethod === GroupingType.DATE) {
                return moment(notification.date).calendar(undefined, {
                    sameDay: '[Today]',
                    nextDay: '[Tomorrow]',
                    nextWeek: 'dddd',
                    lastDay: '[Yesterday]',
                    lastWeek: '[Last] dddd',
                    sameElse: 'DD/MM/YYYY'
                });
            }
            throw new Error(`invalid groupMethod : $ { groupMethod }`);
        }

        // Pre-sort notifications by date (groups will then also be sorted by date)
        notifications.sort(
            (a: INotification, b: INotification) => b.date.getUTCMilliseconds() - a.date.getUTCMilliseconds()
        );

        if (groupMethod === GroupingType.APPLICATION) {
            notifications.forEach((notification: INotification) => {
                getOrCreateGroup(
                    notification.uuid,
                    notification
                ).notifications.push(notification);
            });
        } else if (groupMethod === GroupingType.DATE) {
            notifications.forEach(notification => {
                const date: Date = new Date(notification.date);
                const dateStr: string = [
                    date.getFullYear(),
                    date.getMonth(),
                    date.getDate()
                ].join('-');

                getOrCreateGroup(dateStr, notification).notifications.push(
                    notification
                );
            });
        }

        return groups;
    }

    /**
     * @method createComponents Converts model objects into react components
     * @returns JSX.Element[] Array of NotificationGroup components, one per each
     * INotificationGroup in input
     */
    private createComponents(groups: NotificationGroup[]): JSX.Element[] {
        return groups.map(
            (group: NotificationGroup): JSX.Element => (
                <NotificationGroup
                    key={group.key}
                    name={group.title}
                    notifications={group.notifications}
                    groupBy={this.props.groupBy}
                />
            )
        );
    }
}
