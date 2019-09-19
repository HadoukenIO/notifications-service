/**
 * @module Notifications
 */

/**
 * Need a comment block here so that the comment block above is interpreted as a file comment, and not a comment on the
 * import below.
 *
 * @hidden
 */
import {ActionDeclaration, NotificationActionResult, ActionTrigger} from './actions';
import {tryServiceDispatch, eventEmitter, getEventRouter} from './connection';
import {ButtonOptions, ControlOptions} from './controls';
import {APITopic, Events, NotificationInternal, Omit} from './internal';
import {EventRouter, Transport} from './EventRouter';

const eventHandler: EventRouter<Events> = getEventRouter();

function parseEventWithNotification<T extends {notification: NotificationInternal}>(event: T): T & {notification: Notification} {
    const {notification} = event;

    return {
        ...event,
        notification: {
            ...notification,
            date: new Date(notification.date),
            expires: notification.expires !== null ? new Date(notification.expires) : null
        }
    };
}

eventHandler.registerDeserializer<NotificationCreatedEvent>('notification-created', (event: Transport<NotificationCreatedEvent>) => {
    return parseEventWithNotification(event);
});
eventHandler.registerDeserializer<NotificationClosedEvent>('notification-closed', (event: Transport<NotificationClosedEvent>) => {
    return parseEventWithNotification(event);
});
eventHandler.registerDeserializer<NotificationActionEvent>('notification-action', (event: Transport<NotificationActionEvent>) => {
    const {controlSource, controlIndex, ...rest} = parseEventWithNotification(event);

    if (event.trigger === ActionTrigger.CONTROL) {
        const control = event.notification[controlSource!][controlIndex!];
        return {...rest, control};
    } else {
        return rest;
    }
});

/**
 * Configuration options for constructing a Notifications object.
 */
export interface NotificationOptions {
    /**
     * A unique identifier for the notification.
     *
     * If not provided at time of creation, one will be generated for you and returned as part of the {@link create} method.
     */
    id?: string;

    /**
     * Title of the notification.
     *
     * Displayed as the first line of the notification, in a heading style.
     */
    title: string;

    /**
     * Notification body text.
     *
     * This is the main notification content, displayed below the notification title. The notification will expand to fit the length of this text.
     */
    body: string;

    /**
     * Describes the context of this notification. Allows users to control different notification types that are raised
     * by an application.
     *
     * This string is not displayed on the notification itself, but should be user-readable. It will be displayed in
     * the Notification Center preferences section, and any string passed as a `category` should make sense when
     * displayed in that context.
     *
     * Event categories should list all the different types of notifications raised by your app. As a general guide, if
     * a user may want to have different preferences for some subset of notifications created by your app, then
     * applications should ensure that those notifications have a distinct category.
     *
     * For example - given a calendar app, notification categories could be:
     * - `'Upcoming Events'`: Notification that an event is about to start
     * - `'Event Start'`: Notification raised when event starts, expiring at the event end time
     * - `'Event Modified'`: When an event is modified
     * - `'Event Cancelled'`: When an event is cancelled
     * - `'Event Response'`: An attendee has responded to an event invitation that you created
     * - `'Daily Agenda'`: A notification sent each morning with event reminders
     *
     * **NOTE:** The user-facing UI that a user would use to manage their preferences is still in progress. This
     * property has been added in advance of this UI being released, to ensure future compatibility.
     */
    category: string;

    /**
     * URL of the icon to be displayed in the notification.
     */
    icon?: string;

    /**
     * Any custom context data associated with the notification.
     */
    customData?: CustomData;

    /**
     * The timestamp shown on the notification. If omitted, the current date/time will be used.
     *
     * This is presentational only - a future date will not incur a scheduling action.
     */
    date?: Date;

    /**
     * The expiry date and time of the notification. If specified, the notification will be removed at this time, or as
     * soon as possible after. If not specified, the notification will never expire, and will persist until it
     * is closed.
     */
    expires?: Date|null;

    /**
     * A list of buttons to display below the notification text.
     *
     * Notifications support up to four buttons. Attempting to add more than four will result in the notification
     * being rejected by the service.
     */
    buttons?: ButtonOptions[];

    /**
     * An {@link NotificationActionResult|action result} to be passed back to the application inside the
     * {@link NotificationActionEvent|`notification-action`} event fired when the notification is clicked.
     *
     * This action will only be raised on clicks to the notification body. Interactions with buttons (both
     * application-defined buttons, and the default 'X' close button) will not trigger a
     * {@link ActionTrigger.SELECT|select} action.
     *
     * See {@link Actions} for more details on notification actions, and receiving action events from notifications.
     */
    onSelect?: ActionDeclaration<never, never>|null;

    /**
     * An {@link NotificationActionResult|action result} to be passed back to the application inside the
     * {@link NotificationActionEvent|`notification-action`} event fired when the notification the expires.
     *
     * If `expires` is specified for the notification, this action will be raised when the notification expires. If
     * `expires` is not specified for the notification, this action will never be raised. Note that if an `onClose`
     * action result is also specified, both actions will be raised if and when the notification expires.
     *
     * See {@link Actions} for more details on notification actions, and receiving action events from notifications.
     */
    onExpire?: ActionDeclaration<never, never>|null;

    /**
     * An {@link NotificationActionResult|action result} to be passed back to the application inside the
     * {@link NotificationActionEvent|`notification-action`} event fired when the notification is closed.
     *
     * This action will be raised regardless of how the notification is closed. This can be from user interaction
     * (until future revisions allow default click behaviour to be overriden, this will be any click anywhere within
     * the notification), the notification expiring, or from the notification being programmaticially removed, such as
     * a call to `clear`.
     *
     * See {@link Actions} for more details on notification actions, and receiving action events from notifications.
     */
    onClose?: ActionDeclaration<never, never>|null;
}

/**
 * Application-defined context data that can be attached to notifications.
 */
export type CustomData = {[key: string]: any};

/**
 * A fully-hydrated form of {@link NotificationOptions}.
 *
 * After {@link create|creating} a notification, the service will return an object of this type. This will be the given
 * options object, with any unspecified fields filled-in with default values.
 *
 * This object should be treated as immutable. Modifying its state will not have any effect on the notification or the
 * state of the service.
 */
export type Notification = Readonly<Required<Omit<NotificationOptions, 'buttons'>> & {readonly buttons: ReadonlyArray<Readonly<Required<ButtonOptions>>>}>;

/**
 * Event fired when an action is raised for a notification UI elements. It is important to note that applications will
 * only receive these events if they indicate to the service that they want to receive these events. See {@link Actions}
 * for a full example of how actions are defined, and how an application can listen to and handle them.
 *
 * This can be fired due to interaction with notification buttons or the notification itself, the notification being
 * closed (either by user interaction or by API call), or by the notification expiring. Later versions of the service
 * will add additional control types that may raise actions from user interaction. All actions, for all control types,
 * will be returned to the application via the same `notification-action` event type.
 *
 * The event object will contain the application-defined {@link NotificationActionResult|metadata} that allowed this
 * action to be raised, and details on what triggered this action and which control the user interacted with.
 *
 * Unlike other event types, `notification-action` events will be buffered by the service until the application has
 * added a listener for this event type, at which point it will receive all buffered `notification-action` events. The
 * service will also attempt to restart the application if it is not running when the event is fired.
 *
 * This type includes a generic type argument, should applications wish to define their own interface for action
 * results. See {@link NotificationActionResult} for details.
 *
 * @event
 */
export interface NotificationActionEvent<T = CustomData> {
    type: 'notification-action';

    /**
     * The notification that created this action
     */
    notification: Readonly<Notification>;

    /**
     * Indicates what triggered this action.
     *
     * Note that the `programmatic` trigger is not yet implemented.
     */
    trigger: ActionTrigger;

    /**
     * The control whose interaction resulted in this action being raised. Will only be present when {@link trigger} is
     * {@link ActionTrigger.CONTROL}.
     *
     * Future versions of the service will add additional controls beyond buttons, and interactions with these new
     * control types will also come through this one event type. For best forward-compatibility, applications should
     * always check the `type` property of this control, and not assume that the type will always be `'button'`.
     *
     * This field is marked optional as future versions of the service will also include alternate methods of raising
     * `notification-action` events that do not originate from a button or other control.
     *
     * When present, the object here will always be strictly equal to one of the control definitions within
     * `notification`. This means `indexOf` checks and other equality checks can be performed on this field if
     * required, such as:
     *
     * ```ts
     * function onNotificationAction(event: NotificationActionEvent): void {
     *     if (event.control && event.control.type === 'button') {
     *         const butttonIndex = event.notification.buttons.indexOf(event.control);
     *
     *         // Handle button click
     *         // . . .
     *     }
     * }
     * ```
     */
    control?: Readonly<Required<ControlOptions>>;

    /**
     * Application-defined metadata that this event is passing back to the application.
     *
     * A `notification-action` event is only fired for a given trigger if the
     * {@link NotificationOptions|notification options} included an action result for that trigger.
     *
     * See the comment on the {@link NotificationActionEvent} type for an example of buttons that do and don't raise
     * actions.
     */
    result: NotificationActionResult<T>;
}

/**
 * Event fired whenever the notification has been closed.
 *
 * This event is fired regardless of how the notification was closed - i.e.: via a call to `clear`/`clearAll`, the
 * notification expiring, or by a user clicking either the notification itself, the notification's close button, or
 * a button on the notification.
 *
 * @event
 */
export interface NotificationClosedEvent {
    type: 'notification-closed';

    /**
     * The notification that has just been closed.
     *
     * This object will match what is returned from the `create` call when the notification was first created.
     */
    notification: Notification;
}

/**
 * Event fired whenever a new notification has been created.
 *
 * @event
 */
export interface NotificationCreatedEvent {
    type: 'notification-created';

    /**
     * The notification that has just been created.
     *
     * This object will match what is returned from the `create` call.
     */
    notification: Notification;
}

export function addEventListener(eventType: 'notification-action', listener: (event: NotificationActionEvent) => void): void;
export function addEventListener(eventType: 'notification-created', listener: (event: NotificationCreatedEvent) => void): void;
export function addEventListener(eventType: 'notification-closed', listener: (event: NotificationClosedEvent) => void): void;

/**
 * Adds a listener, see definitions of individual event interfaces for details on each event.
 *
 * @param eventType The event being subscribed to
 * @param listener The callback function to add
 */
export function addEventListener<E extends Events>(eventType: E['type'], listener: (event: E) => void): void {
    if (typeof fin === 'undefined') {
        throw new Error('fin is not defined. The openfin-notifications module is only intended for use in an OpenFin application.');
    }

    const count = eventEmitter.listenerCount(eventType);
    eventEmitter.addListener(eventType, listener);
    if (count === 0 && eventEmitter.listenerCount(eventType) === 1) {
        tryServiceDispatch(APITopic.ADD_EVENT_LISTENER, eventType);
    }
}

export function removeEventListener(eventType: 'notification-action', listener: (event: NotificationActionEvent) => void): void;
export function removeEventListener(eventType: 'notification-created', listener: (event: NotificationCreatedEvent) => void): void;
export function removeEventListener(eventType: 'notification-closed', listener: (event: NotificationClosedEvent) => void): void;

/**
 * Removes a listener previously added with {@link addEventListener}.
 *
 * Has no effect if `eventType` isn't a valid event, or `listener` isn't a callback registered against `eventType`.
 *
 * @param eventType The event being unsubscribed from
 * @param listener The callback function to remove, must be strictly-equal (`===` equivilance) to a listener previously passed to {@link addEventListener} to have an effect
 */
export function removeEventListener<E extends Events>(eventType: E['type'], listener: (event: E) => void): void {
    if (typeof fin === 'undefined') {
        throw new Error('fin is not defined. The openfin-notifications module is only intended for use in an OpenFin application.');
    }

    const count = eventEmitter.listenerCount(eventType);
    eventEmitter.removeListener(eventType, listener);
    if (count === 1 && eventEmitter.listenerCount(eventType) === 0) {
        tryServiceDispatch(APITopic.REMOVE_EVENT_LISTENER, eventType);
    }
}

/**
 * Creates a new notification.
 *
 * The notification will appear in the Notification Center and as a toast if the Center is not visible.
 *
 * If a notification is created with an `id` of an already existing notification, the existing notification will be recreated with the new content.
 *
 * ```ts
 * import {create} from 'openfin-notifications';
 *
 * create({
 *      id: 'uniqueNotificationId',
 *      title: 'Notification Title',
 *      body: 'Text to display within the notification body',
 *      category: 'Sample Notifications',
 *      icon: 'https://openfin.co/favicon.ico'
 * });
 * ```
 *
 * @param options Notification configuration options.
 */
export async function create(options: NotificationOptions): Promise<Notification> {
    // Most validation logic is handled on the provider, but need an early check here
    // as we call date.valueOf when converting into a CreatePayload
    if (options.date !== undefined && !(options.date instanceof Date)) {
        throw new Error('Invalid arguments passed to create: "date" must be a valid Date object');
    }

    if (options.expires !== undefined && options.expires !== null && !(options.expires instanceof Date)) {
        throw new Error('Invalid arguments passed to create: "expires" must be null or a valid Date object');
    }

    const response = await tryServiceDispatch(APITopic.CREATE_NOTIFICATION, {
        ...options,
        date: options.date && options.date.valueOf(),
        expires: options.expires && options.expires.valueOf()
    });
    return {...response, date: new Date(response.date), expires: response.expires !== null ? new Date(response.expires) : null};
}

/**
 * Clears a specific notification from the Notification Center.
 *
 * Returns true if the notification was successfully cleared.  Returns false if the notification was not cleared, without errors.
 *
 * ```ts
 * import {clear} from 'openfin-notifications';
 *
 * clear('uniqueNotificationId');
 * ```
 *
 * @param id ID of the notification to clear.
 */
export async function clear(id: string): Promise<boolean> {
    // Should have some sort of input validation here...
    return tryServiceDispatch(APITopic.CLEAR_NOTIFICATION, {id});
}

/**
 * Retrieves all Notifications which were created by the calling application, including child windows.
 *
 * ```ts
 * import {getAll} from 'openfin-notifications'
 *
 * getAll().then((notifications: Notification[]) => {
 *     console.log(`Service has ${notifications.length} notifications for this app:`, notifications);
 * });
 * ```
 *
 * There is deliberately no mechanism provided for fetching notifications that were created by a different application.
 */
export async function getAll(): Promise<Notification[]> {
    // Should have some sort of input validation here...
    const response = await tryServiceDispatch(APITopic.GET_APP_NOTIFICATIONS, undefined);
    return response.map(note => ({...note, date: new Date(note.date), expires: note.expires !== null ? new Date(note.expires) : null}));
}

/**
 * Clears all Notifications which were created by the calling application, including child windows.
 *
 * Returns the number of successfully cleared Notifications.
 *
 * ```ts
 * import {clearAll} from 'openfin-notifications';
 *
 * clearAll();
 * ```
 */
export async function clearAll(): Promise<number> {
    // Should have some sort of input validation here...
    return tryServiceDispatch(APITopic.CLEAR_APP_NOTIFICATIONS, undefined);
}

/**
 * Toggles the visibility of the Notification Center.
 *
 * ```ts
 * import {toggleNotificationCenter} from 'openfin-notifications';
 *
 * toggleNotificationCenter();
 * ```
 */
export async function toggleNotificationCenter(): Promise<void> {
    return tryServiceDispatch(APITopic.TOGGLE_NOTIFICATION_CENTER, undefined);
}
