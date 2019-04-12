export interface NotificationClickedEvent {
    type: 'notification-clicked';
    id: string;
}
export interface NotificationClosedEvent {
    type: 'notification-closed';
    id: string;
}
export interface NotificationButtonClickedEvent {
    type: 'notification-button-clicked';
    id: string;
    button: number;
}

export type NotificationEvent = NotificationClickedEvent | NotificationClosedEvent | NotificationButtonClickedEvent;
