import * as React from 'react';
import { Toast } from './Toast';
import { ISenderInfo } from '../../../provider/Models/ISenderInfo';
import { deregister } from 'openfin-layouts';

declare var window: Window & {
    onNotificationMessage: (message: Notification & ISenderInfo) => void;
};

interface IToastAppState {
    meta: Notification & ISenderInfo;
}

export class App extends React.Component<{}, IToastAppState> {
    constructor(props: {}) {
        super(props);
        this.state = { meta: null };

        window.onNotificationMessage = this.onNotificationMessage.bind(this);

        // deregisters window from openfin-layouts docking
        deregister().then(() => {
            fin.desktop.Window.getCurrent().animate(
                { opacity: { opacity: 1, duration: 200 } },
                { interrupt: false }
            );
        });
    }

    public render() {
        if (this.state.meta) {
            return <Toast meta={this.state.meta} />;
        }

        return null;
    }

    private onNotificationMessage(message: Notification & ISenderInfo): void {
        console.log(message);
        this.setState({ meta: message });
    }
}
