import * as React from 'react';
import * as ReactDOM from 'react-dom';

import {SenderInfo, INotification} from '../../client/Notification';
import {StoredNotification} from '../model/StoredNotification';

import {Toast} from './components/Toast/Toast';
import {setup} from './setup';


declare const window: Window & {
    onNotificationMessage: (message: StoredNotification) => void;
};

interface ToastAppState {
    meta: StoredNotification | null;
}

export class ToastApp extends React.Component<{}, ToastAppState> {
    constructor(props: {}) {
        super(props);
        this.state = {meta: null};

        window.onNotificationMessage = this.onNotificationMessage.bind(this);
        fin.desktop.Window.getCurrent().animate(
            {opacity: {opacity: 1, duration: 200}},
            {interrupt: false}
        );
    }

    public componentWillMount() {
        setup();
    }

    public render() {
        if (this.state.meta) {
            return <Toast meta={this.state.meta} />;
        }

        return null;
    }

    private onNotificationMessage(message: StoredNotification): void {
        console.log(message);
        this.setState({meta: message});
    }
}


ReactDOM.render(<ToastApp />, document.getElementById('toast-app'));
