/**
 * Actions are the mechanism through which notifications send messages back to the application that created them. The
 * service defines a number of ways in which actions can be raised (typically user interactions, such as clicking a
 * button), and it is up to each application to decide if it wishes to be informed of these interactions.
 *
 * For an action to be raised when one of these interactions occurs, the application must specify an
 * {@link NotificationActionResult|action result} for each interaction it is interested in. The application should then
 * listen for when these actions are raised by listening for the {@link NotificationActionEvent|notification-action}
 * event.
 *
 * This event is fired once each time an action is raised, and will contain the
 * {@link NotificationActionResult|action result} the application specified for that interaction. The application may
 * then use the {@link NotificationActionResult|action result} to determine the interaction that occurred and respond
 * appropriately.
 *
 * For an overview of actions, consider the sample notification below:
 * ```ts
 * import {addEventListener, create} from 'openfin-notifications';
 *
 * // Create a notification with two buttons
 * create({
 *     // Basic info
 *     title: 'Reminder',
 *     body: 'Event "Weekly Meeting" is starting soon...',
 *     category: 'Upcoming Events',
 *
 *     // We'll use the 'customData' field to store metadata about the event
 *     customData: {eventId: '12345'},
 *
 *     // We want the user clicking the notification to open the associated event, so register an 'onSelect' action
 *     onSelect: {task: 'view-calendar-event', target: 'popup'},
 *
 *     buttons: [
 *         // A button that will schedule another reminder for 5 minutes from now. Since the application will be
 *         // responsible for snoozing the event, it will need to know about the user clicking this button. By setting
 *         // a NotificationActionResult for 'onClick', the service will raise a "notification-action" event when this
 *         // button is clicked, and will pass the value of 'onClick' as the 'result' field within the event
 *         {
 *             title: 'Snooze for 5 minutes',
 *             iconUrl: 'https://www.example.com/timer.png',
 *             onClick: {
 *                 task: 'schedule-reminder',
 *                 intervalMs: 5 * 60 * 1000
 *             }
 *         },
 *
 *         // A button that closes the notification and doesn't prompt the user about this event again. Since the
 *         // application doesn't need to do anything when the user clicks this button, we leave 'onClick' undefined
 *         // rather than specifying a NotificationActionResult. This means that no action will be raised when the
 *         // button is clicked, and hence no "notification-action" event will be fired
 *         {
 *             title: 'Dismiss',
 *             iconUrl: 'https://www.example.com/cancel.png'
 *         }
 *     ]
 * });
 *
 * // Create a listener that will be called for each action
 * // Note: This handler will be used for ALL actions, from ALL notifications that are created by this application.
 * addEventListener('notification-action', (event: NotificationActionEvent) => {
 *     const {result, notification} = event;
 *
 *     if (result['task'] === 'view-calendar-event') {
 *         // Open a window with full details of the associated event
 *         openEventDetails(notification.customData.eventId, result['target']);
 *     } else if (result['task'] === 'schedule-reminder') {
 *         // Schedule a new notification
 *         scheduleReminder(notification.customData.eventId, Date.now() + result['intervalMs']);
 *     } // Etc...
 * });
 * ```
 *
 * The example above uses `customData` to store details about the notification subject (in this case, a calendar
 * event), and `onClick` actions to inform the application about how it should respond when the user interacts with the
 * notification. This is our intended usage and recommended best-practice, but the service doesn't require applications
 * to follow this convention - application developers are free to decide how to manage notification state.
 *
 * Within the `notification-action` handler, the application must be able to understand which notification is being
 * handled, and how to decide what it should do next. The example above uses an application-defined `action` field to
 * determine the correct action, but the notification's `id`, `category`, `customData` and other fields are also useful
 * selectors.
 *
 * @module Actions
 */

/**
 * (Need to comment this so that above is interpreted as a file-level comment)
 */
import {CustomData} from '.';

/**
 * Denotes a field as being an action. Defining this field (with a non-`undefined` value) will result in actions being
 * raised and sent back to the source application when the corresponding event happens.
 *
 * For example, providing a value for the `onClick` field of {@link ButtonOptions} will result in a
 * {@link NotificationActionEvent|`notification-action`} event being fired when that button is clicked.
 *
 * In the current version of the service, the `NotificationActionResult`s returned back to an application are static
 * and must bedefined at the point where the notification is created. Later versions of the service will allow some
 * limited programmatic creation of these results, for use in situations where static result data isn't sufficient.
 *
 * The generic parameters of this type are for future expansion. Future versions of the service will allow for more
 * control over the handling of actions.
 */
export type ActionDeclaration<T extends never, E extends never> = NotificationActionResult;

/**
 * Data type used to represent the action result returned back to applications when an action is raised. Applications
 * capture these responses by adding a `notification-action` listener. The contents of this type are entirely
 * application-defined, the only requirement is that the item is serializable by `JSON.stringify`.
 *
 * Since this type is entirely application-specific, the type  is used in these definitions. However, there is an
 * optional generic argument here, which can be used if an application were to define its own conventions for the shape
 * of this field (which is recommended). To make use of this, define a `notification-action` handler that includes the
 * application-defined type as a template argument. This type is then propogated up to {@link NotificationActionEvent}.
 * The example below demonstrates this, using the same use-case as at the top of this page.
 *
 * ```ts
 * interface MyAction = SnoozeAction | DetailsAction;
 *
 * interface SnoozeAction {
 *     task: 'schedule-reminder';
 *     intervalMs: number;
 * }
 *
 * interface DetailsAction {
 *     task: 'view-calendar-event';
 *     target: 'self'|'popup';
 * }
 *
 * addEventListener('notification-action', (event: NotificationActionEvent<MyAction>)) => {
 *     if (event.result.task === 'schedule-reminder') {
 *         // 'event.result' will now be strongly-typed as an instance of SnoozeAction
 *         scheduleReminder(notification.customData.eventId, Date.now() + result.intervalMs);
 *     }
 *     // Etc...
 * });
 * ```
 */
export type NotificationActionResult<T = CustomData> = T;

/**
 * Lists the different triggers that can raise an {@link Actions|action}. Each action that is raised will result in a
 * {@link NotificationActionEvent|`notification-action`} event, which can be captured by the application that created
 * the notification.
 */
export enum ActionTrigger {
    /**
     * The user interacted with one of the controls within the notification. This currently means a button click, but
     * other control types will be added in future releases.
     */
    CONTROL = 'control',

    /**
     * The user clicked the body of the notification itself. Any clicks of the notification that don't hit a control
     * or the close button will fire an event with the `'select'` action trigger.
     */
    SELECT = 'select',
    
    /**
     * The notification was closed, either by user interaction, or programmatically by an application.
     */
    CLOSE = 'close',

    /**
     * The action was triggered programmatically by an application.
     *
     * *Not currently supported - will be implemented in a future release*
     */
    PROGRAMMATIC = 'programmatic'
}
