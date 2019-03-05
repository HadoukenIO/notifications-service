import * as React from 'react';
import { Toast } from '../components/Toast/Toast';
import { ISenderInfo } from '../../../Models/ISenderInfo';
import {INotification} from '../../models/INotification';

declare var window: Window & {
    onNotificationMessage: (message: INotification & ISenderInfo) => void;
};

interface IToastAppState {
    meta: INotification & ISenderInfo;
}

export class App extends React.Component<{}, IToastAppState> {
    constructor(props: {}) {
        super(props);
        this.state = { meta: null };

        window.onNotificationMessage = this.onNotificationMessage.bind(this);
        fin.desktop.Window.getCurrent().animate(
            { opacity: { opacity: 1, duration: 200 } },
            { interrupt: false }
        );
    }

    public render() {
        if (this.state.meta) {
            return <Toast meta={this.state.meta} />;
        }

        return null;
    }

    private onNotificationMessage(message: INotification & ISenderInfo): void {
        console.log(message);
        this.setState({ meta: message });
    }
}
