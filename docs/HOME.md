<!-- This file is used as the main landing page in the generated API documentation. See README.md for a more general overview of the project and repo. -->

OpenFin Notifications provide developers with a uniform way to create, display and organize desktop notifications as well as responding to notification events.

Notifications will be displayed as toasts as well as being listed and organized in a Notification Center. The Notification Center can be accessed by clicking on the system tray notification icon.

## Getting Started

See the [Desktop Services]() documentation for details on including a desktop service within your application. Once configured via your application manifest, the API documented here will function
as expected.

Basic example:
```ts
// Non-Interactive "fire and forget" notification
// Clicking the notification will pass an `notification-activated` event back to the application.
// There will still be a `notification-closed` event when the service closes the notification (this occurs in all cases).
await create({
    title: 'Build Complete',
    body: 'Job "develop#123" finished with state "SUCCESS"',
    category: 'Build Statuses'
});
```


## API
See the [Notifications](module/notifications.html) [n](Notifications) [[Notifications]] page