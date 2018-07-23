# OpenFin Notifications


## Overview

OpenFin Notifications provide developers with a uniform way to create, display and organize desktop notifications as well as responding to notification events (notification clicked, closed etc.)

Notifications will be displayed as toasts as well as being listed and organized in a notification center. The Notification Center can be accessed by clicking on the system tray notification icon.

OpenFin Notifications uses the new Services framework to expose its API to consuming applications.  You can see the documentation for these APIs here:  http://cdn.openfin.co/jsdocs/alpha/fin.desktop.Service.html.

This project consist of 2 parts:
1. The Notification Service, displaying and managing notifications and owning the Notification Center UI
2. The Notification Client, exposing API's for applications to create and manage notifications

### Dependencies
- OpenFin version >= 8.56.30.42 
- RVM >= 4.2.0.33 

### Features
* Create notifications
* Clear/dismiss notifications
* Attach handlers for click/close events
* Persist notifications in the Notification Center

### Demo Installer

This [windows installer](https://install.openfin.co/download/?config=https%3A%2F%2Fcdn.openfin.co%2Fservices%2Fopenfin%2Fnotifications%2Fdemo%2FappClient.json&fileName=notifications-demo)
Will launch a demo for OpenFin Notifications

### Run Locally
- To run the project locally the npm scripts require git bash.
- Windows support only.
- Node 8.11 LTS.
```bash
npm install
npm run build:demo
npm run start
```

## Getting Started

Using the notifications service is done in two steps, add the service to application manifest and import the API:

### Manifest declaration

To ensure the service is running, you must declare it in your application config.

```
"services": [
    {
        "name": "notifications"
    }
]

```

### Import the API

To use the API, you must first include it in your application. 

```bash
npm install openfin-notifications
```

### API Documentation


- `create(id: String, options: NotificationOptions)`
Creates a notification and sends it to the Notifications manager
Promise resolves to ID of notification created.
- `getAll()`
Promise resolves to all notifications sent by the App to Notification manager that are still active (not cleared)
- `clear(id: String)`
Clears the notification from the Notification Center UI  
- `clearAll()`
Clears all notifications sent from the application
-  `addEventListener(eventName: String, handler: Function)`
Application global event listener invoked when the use clicks the event, or button on the event

#### Notification Config Options

```javascript
NotificationOptions {
    body: string; 
    title: string;
    subtitle: string;
    icon: string;
    context: NotificationContext;
    date: Date;
    buttons: OptionButton[];
    inputs: OptionInput[];
}
```


## Roadmap
This is a WIP. Items on our immediate roadmap include:
- Support for buttons/links
- Inline reply
- Configuration
- Support for Types/templates
- Remote notifications

## Known Issues

If notifications are persisted and the source application is restarted, all events will still be sent to the source application for handling along with the original context.  It is up to these applications to handle these events as they see fit.


## Project Structure

All code lives under the src directory which can be broken down into 5 areas: client, demo, provider, test and ui.

* src
 * client - the service client
 * demo - the demo config/html (for testing the service itself)
 * provider - the service provider
 * test - all the tests
 * ui - the notification center ui

## Project Helpers

We use a handful of NPM scripts to handle most of the typical tasks in a project like compile, stage, run, etc.

* build - run webpack and stage (see below)
* clean - runs gts clean (deletes the ./build directory)
* lint - runs a linter
* stage - moves the rest of the assets (non-TS and non-packed)
* start:dev - runs build and serve:dev
* start:prod - runs build and serve:prod
* serve:dev - runs a local server serving all files locally
* serve:prod - runs local server pointing at deployed files on the CDN
* test - runs all project tests
* webpack - runs webpack and compiles all TS -> JS


## Build

The project is built and staged to the ./build directory.  This directory is exactly what would be deployed to the production CDN.

* build
 * client.js - the compiled service client
 * demo/ - the demo files
 * provider.js - the compiled service provider
 * ui - the compiled notification center UI
   * pack - bundled files for the UI

## License
This project uses the [Apache2 license](https://www.apache.org/licenses/LICENSE-2.0)

## Support
This is an open source project and all are encouraged to contribute.
Please enter an issue in the repo for any questions or problems. For further inqueries, please contact us at support@openfin.co
