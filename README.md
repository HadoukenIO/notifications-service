# OpenFin Notifications


## Overview
The OpenFin Notifications Service provides developers with a uniform way to create, display and organize desktop notifications as well as responding to notification events.

Notifications will be displayed as toasts as well as being listed and organized in a Notification Center. The Notification Center can be accessed by clicking on the Notifications icon in the system tray.

This project consist of 3 parts:
1. The Notifications Provider, displaying and managing notifications, and owning the Notification Center
2. The Notifications Client, exposing APIs for applications to create and manage notifications
3. The Notifications Demo App, demonstrating the different features of OpenFin Notifications

### Dependencies
- OpenFin version for applications using the Notifications Service >= 9.61.38.41
- OpenFin version used by the Notifications Provider = 10.66.39.43
- RVM >= 4.7

### Features
* Create notifications
* Clear and dismiss notifications
* Attach handlers for when notifications are created, closed, and interacted with
* Persist notifications in the Notification Center

## Getting Started

Integrating the Notifications Service within an application is done by declaring the service in the application manifest, and importing the Client API.

### Manifest Declaration
To ensure the service is running, you must declare it in your application config.

```json
"services":
[
   {"name": "notifications"}
]
```
During development, you can add a URL for specifying a custom location or a specific version:

```json
"services":
[
   {
       "name": "notifications",
       "manifestUrl": "https://custom-location/<version>/app.json"
   }
]
```
Refer to the [Desktop Services documentation](https://developers.openfin.co/docs/desktop-services) for details on managing service location/version within production environments.

### Import the Client API
```bash
npm install openfin-notifications
```

The client library is also available as a resource which can be included via `<script>` tag:
```html
<script src="https://cdn.openfin.co/services/openfin/notifications/<VERSION>/openfin-notifications.js"></script>
```
This will expose the global variable `notifications` with the API methods documented in the link below.  Example:
```js
const notifications = await notifications.getAll();
```

The client module exports a set of functions, documented in the [API docs](https://cdn.openfin.co/docs/services/notifications/stable/api/).

### Usage
An in-depth usage guide and additional documentation will be published in due course.

## Running Locally

To preview the functionality of the service without integrating it into an existing application - or to start contributing to the service - the service can be run locally.

### Setup
After checkout, install project dependencies using `npm install`.

### Startup
Once dependencies are installed, start the "built-in" sample application with `npm start`. This uses `webpack-dev-middleware` to both build and host the application; a custom server script will start the OpenFin application once the server is up and running.

The startup script has optional arguments which can be used to tweak the behavior of the build and the test server. Use `npm start -- -h` for details on the available parameters and their effects.

### Build Process
The service consists of several different components unified into a single project. The `package.json` defines the combined dependencies of all components. Any modules required for the pre-built client to work within an application are included in the `"dependencies"` section, and the remaining dependencies - used to build the client, and to both build & run the provider and demo application - are included under `"devDependencies"`.

Similarly, there is a single `webpack.config.js` script that will build the above components.

### Testing
To run the full test-suite for notifications-service, run:
```bash
npm install
npm test
```

This will run unit tests followed by the integration tests. These steps can also be run individually via `npm run test:unit` and `npm run test:int`. When running the tests separately in this way, both test runners support some optional arguments. Append `--help` to either of the above `npm run` commands to see the available options.

### Deployment
Staging and production builds are managed via the Jenkinsfile build script. This will build the project as usual (except with the `--mode production` argument) and then deploy the client and provider to their respective locations. The demo application exists only within this repository and is not deployed.

The service client is deployed as an NPM module, so that it can be included as a dependency in any application that wishes to integrate the service.

The service provider is a standard OpenFin application, only its lifecycle is controlled by the RVM (based upon the requirements of user-launched applications) rather than being launched by users. The provider is deployed to the OpenFin CDN; a zip file is also provided to assist with re-deploying the provider to an alternate location. Direct links to each build are listed in the release notes, available on the [services versions page](https://developer.openfin.co/versions/?product=Services).

## Known Issues

A list of known issues can be found on our [versions page](https://developer.openfin.co/versions/?product=Services).

## License

This project uses the [Apache2 license](https://www.apache.org/licenses/LICENSE-2.0).

However, if you run this code, it may call on the OpenFin RVM or OpenFin Runtime, which are covered by OpenFin's Developer, Community, and Enterprise licenses. You can learn more about OpenFin licensing at the links listed below or just email us at support@openfin.co with questions.

https://openfin.co/developer-agreement/  
https://openfin.co/licensing/

## Support

This is an open source project and all are encouraged to contribute.
Please enter an issue in the repository for any questions or problems. Alternatively, please contact us at support@openfin.co.
