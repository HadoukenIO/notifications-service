import { NotificationContext } from "./Notification";

/**
 * @description interface for notification event
 */
export interface NotificationEvent {
    name: string;
    uuid: string;
    id: string;
    context: NotificationContext;
}