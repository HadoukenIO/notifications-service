import * as React from 'react';

import {NotificationTime} from '../NotificationTime/NotificationTime';
import {Button} from '../NotificationButton/NotificationButton';
import {CircleButton, IconType} from '../CircleButton/CircleButton';
import {RemoveNotifications, ClickButton, ClickNotification, MinimizeToast} from '../../../store/Actions';
import {useOnClickOnly} from '../../hooks/Clicks';
import {TitledNotification, Actionable} from '../../types';
import {LaunchApplicationError} from '../../../model/Errors';
import {ErrorHandler} from '../../../model/ErrorHandler';
import {ClassNameBuilder} from '../../utils/ClassNameBuilder';

import {Body} from './Body';
import {Loading} from './Loading';

import './NotificationCard.scss';

interface Props extends Actionable {
    notification: TitledNotification;
    isToast?: boolean;
}

export function NotificationCard(props: Props) {
    const {notification, storeApi, isToast = false} = props;
    const data = notification.notification;
    // TODO: [SERVICE-605] use this state to toggle loading/error component.
    const [loading] = React.useState(false);
    const [uninteractable, setUninteractable] = React.useState(false);
    const cardRef = React.createRef<HTMLDivElement>();
    const [validClick, finishedClick] = useOnClickOnly(cardRef);

    const handleError = (error: Error) => {
        ErrorHandler.for(error)
            .processError(LaunchApplicationError, function (e: LaunchApplicationError) {
                console.warn('Unable to launch application');
                this.log();
            })
            .throwRemaining();
    };

    const handleNotificationClose = async () => {
        setUninteractable(true);
        await new RemoveNotifications([notification]).dispatch(storeApi);
    };

    const handleNotificationMinimize = async () => {
        if (isToast) {
            setUninteractable(true);
            await new MinimizeToast(notification).dispatch(storeApi);
        }
    };

    const handleButtonClick = async (buttonIndex: number) => {
        setUninteractable(true);
        try {
            // TODO: [SERVICE-605] set loading state
            await new ClickButton(notification, buttonIndex).dispatch(storeApi);
        } catch (error) {
            handleError(error);
        }
    };

    const handleNotificationClick = async (event: React.MouseEvent) => {
        event.stopPropagation();
        event.preventDefault();
        // Check if the click did not originate from a button
        // This is to prevent a user clicking a button and holding their mouse down
        // Dragging onto the body and letting go
        if (!validClick) {
            return;
        }
        setUninteractable(true);
        try {
            // TODO: [SERVICE-605] set loading state
            await new ClickNotification(notification).dispatch(storeApi);
        } catch (error) {
            handleError(error);
        }
        finishedClick();
    };

    const classNames = new ClassNameBuilder(undefined, 'notification-card', 'no-select', ['uninteractable', (loading || uninteractable)], ['toast', isToast]);

    return (
        <div
            className={classNames.toString()}
            onClick={handleNotificationClick}
            data-id={notification.id}
            ref={cardRef}
        >
            <div className="header">
                <div className="app-icon" style={{backgroundImage: `url(${data.icon})`}}></div>
                <div className="app-name single-line">{notification.title}</div>
                <div className="time-close">
                    <NotificationTime date={data.date} />
                    <div className="actions">
                        {isToast
                            ? <CircleButton type={IconType.MINIMIZE} onClick={handleNotificationMinimize} alt="Minimize Toast" />
                            : <CircleButton type={IconType.CLOSE} onClick={handleNotificationClose} alt="Clear notification" />
                        }
                    </div>
                </div>
            </div>
            <div className="content">
                <div className="title single-line">{data.title}</div>
                <div className="body no-select">
                    <Body text={data.body} />
                </div>
            </div>
            {data.buttons.length > 0 &&
                <div className="buttons">
                    {data.buttons.map((btn, i) => {
                        return (
                            <Button
                                key={i}
                                text={btn.title}
                                onClick={() => {
                                    handleButtonClick(i);
                                }}
                                icon={btn.iconUrl}
                            />
                        );
                    })}
                </div>
            }
            {loading && <Loading />}
        </div>
    );
}
