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

## Getting Started

Integrating the Notifications Service within an application is done in two steps. Add the service to the application manifest, and import the API:

### Manifest declaration

To ensure the service is running, you must declare it in your application config.

```
"services":
[
   {"name": "notifications"}
]
```
Optionally you can add a URL for specifying a custom location or a specific version:

```
"services":
[
   {
       "name": "notifications",
       "manifestUrl": "https://custom-location/<version>/app.json"
   }
]
```

### Import the Client API

```bash
npm install openfin-notifications
```

The client library is also available as a resource which can be included via `<script>` tag:
```
   <script src="https://cdn.openfin/services/openfin/notifications/<VERSION>/openfin-notifications.js"></script>
```
This will expose the global variable `OpenFinNotifications` with the API methods documented in the link below.  Example:
```
   const notifications = await OpenFinNotifications.getAll();
```

The client module exports a set of functions - [API docs available here](https://cdn.openfin.co/docs/services/notifications/stable/api/).


### Usage

An in-depth usage guide and additional documentation will be published in due course.

## Run Locally

To preview the functionality of the service without integrating it into an existing application - or to start contributing to the service - the service can be ran locally. By checking out this repo and then running the project.

### Setup

After checkout, install project dependencies using `npm install`.

### Startup
Once dependencies are installed, start the "built-in" sample application with `npm start`. This uses `webpack-dev-middleware` to both build and host the application; a custom `server.js` script will start the OpenFin application once the server is up and running.

The startup script has optional arguments which can be used to tweak the behavior of the build and the test server. See the constants at the top of `server.js` for details on the available parameters and their effects.

### Build Process
The service consists of several different components unified into a single project. The `package.json` defines the combined dependencies of all components; anything required for the pre-built client to work within an application is included in the `"dependencies"` section, and the remaining dependencies - used to build the client, and to both build & run the provider and demo application - are included under `"devDependencies"`.

Similarly, there is a single `webpack.config.js` script that will build the above components.

### Testing
To run the full test-suite for notifications-service, run:
```bash
npm install
npm test
```

This will run unit tests followed by the integration tests. These steps can also be ran individually via `npm run test:unit` and `npm run test:int`. When running the tests separately in this way, both test runners support some optional arguments. Append `--help` to either of the above `npm run` commands to see the available options.

### Deployment
Staging and production builds are managed via the Jenkinsfile build script. This will build the project as usual (except with the `--production` argument) and then deploy the client and provider to their respective locations. The demo application exists only within this repo and is not deployed.

The service client is deployed as an NPM module, so that it can be included as a dependency in any application that wishes to integrate with the service.

The service provider is a standard OpenFin application, only its lifecycle is controlled by the RVM (based upon the requirements of user-launched applications) rather than being launched by users. The provider is deployed to the OpenFin CDN; a zip file is also provided to assist with re-deploying the provider to an alternate location. Direct links to each build are listed in the release notes, available on the [services versions page](https://developer.openfin.co/versions/?product=Services).

## Known Issues
A list of known issues can be found on our [Versions page.]https://developer.openfin.co/versions/?product=Services

## License
This project uses the [Apache2 license](https://www.apache.org/licenses/LICENSE-2.0)

However, if you run this code, it may call on the OpenFin RVM or OpenFin Runtime, which are covered by OpenFin's Developer, Community, and Enterprise licenses. You can learn more about OpenFin licensing at the links listed below or just email us at support@openfin.co with questions.

https://openfin.co/developer-agreement/
https://openfin.co/licensing/

## Support
This is an open source project and all are encouraged to contribute.
Please enter an issue in the repo for any questions or problems. Alternatively, please contact us at support@openfin.co
