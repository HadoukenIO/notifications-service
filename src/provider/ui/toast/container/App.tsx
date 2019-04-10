import * as React from 'react';
import {Toast} from '../components/Toast/Toast';

import {INotification} from '../../models/INotification';
import {SenderInfo} from '../../../../client/models/Notification';

declare var window: Window & {
    onNotificationMessage: (message: INotification & SenderInfo) => void;
};

interface IToastAppState {
    meta: (INotification & SenderInfo) | null;
}

export class App extends React.Component<{}, IToastAppState> {
    constructor(props: {}) {
        super(props);
        this.state = {meta: null};

        window.onNotificationMessage = this.onNotificationMessage.bind(this);
        fin.desktop.Window.getCurrent().animate(
            {opacity: {opacity: 1, duration: 200}},
            {interrupt: false}
        );
    }

    public render() {
        if (this.state.meta) {
            return <Toast meta={this.state.meta} />;
        }

        return null;
    }

    private onNotificationMessage(message: INotification & SenderInfo): void {
        console.log(message);
        this.setState({meta: message});
    }
}
