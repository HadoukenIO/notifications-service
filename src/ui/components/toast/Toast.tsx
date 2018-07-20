import * as React from 'react';
import { ISenderInfo } from '../../../provider/Models/ISenderInfo';
import { Fin } from '../../../fin';

declare var fin: Fin;

interface IToastProps {
    meta: Notification & ISenderInfo;
}

const enum ClickEvents {
    BodyClick,
    Closed
}

/**
 * @class Toast Holds Indivual Toast functionality
 */
export class Toast extends React.Component<IToastProps, {}> {
    constructor(props: IToastProps) {
        super(props);
    }

    /**
     * @method clickHandler Handles click events from the notification DOM
     * @param {ClickEvents} clickEventName Type of the click event
     */
    private clickHandler(clickEventName: ClickEvents): void {
        event.stopPropagation();

        switch (clickEventName) {
            case ClickEvents.BodyClick: {
                fin.notifications.clickHandler(this.props.meta);
                break;
            }
            case ClickEvents.Closed: {
                fin.notifications.closeHandler(this.props.meta);
                fin.desktop.Notification.getCurrent().close();
                break;
            }
            default: {
                console.warn('Invalid Event Requested');
                break;
            }
        }
    }

    /**
     * @method render Renders the Toast React Node
     */
    public render(): React.ReactNode {
        return (
            <div className="notification-container">
                <div className="notification-inbox" id="notification-inbox">
                    <ul id="notification-inbox-list">
                        <li className="notification-item">
                            <img
                                className="notification-close-x"
                                src="image/shapes/notifications-x.png"
                                alt=""
                                onClick={() => {
                                    this.clickHandler(ClickEvents.Closed);
                                }}
                            />
                            <div
                                className="notification-body"
                                onClick={() => {
                                    this.clickHandler(ClickEvents.BodyClick);
                                }}
                            >
                                <div className="notification-source">
                                    <img
                                        src={this.props.meta.icon}
                                        className="notification-small-img"
                                    />
                                    <span className="notification-source-text">
                                        {this.props.meta.name}
                                    </span>
                                </div>
                                <div className="notification-body-title">
                                    {this.props.meta.title}
                                </div>
                                <div className="notification-body-text">
                                    {this.props.meta.body}
                                </div>
                            </div>
                        </li>
                    </ul>
                </div>
            </div>
        );
    }
}
