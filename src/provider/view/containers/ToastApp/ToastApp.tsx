import * as React from 'react';
import * as ReactDOM from 'react-dom';
import {connect, Provider} from 'react-redux';
import {Store} from 'redux';

import {StoredNotification} from '../../../model/StoredNotification';
import {NotificationCard} from '../../components/NotificationCard/NotificationCard';
import {ResizeWrapper} from '../../components/Wrappers/ResizeWrapper';
import {RootState} from '../../../store/State';
import {Point} from '../../../model/Toast';
import {WebWindow} from '../../../model/WebWindow';
import {ServiceStore} from '../../../store/ServiceStore';
import {TitledNotification, Actionable} from '../../types';

import '../../styles/base.scss';
import './ToastApp.scss';

interface ToastAppProps extends Actionable {
    notification: TitledNotification;
    setWindowSize: (dimensions: Point) => void;
}

type Props = ToastAppProps & ReturnType<typeof mapStateToProps>;

export function ToastApp(props: Props) {
    const {notification, setWindowSize, storeApi} = props;

    return (
        <ResizeWrapper onSize={setWindowSize}>
            <NotificationCard notification={notification} storeApi={storeApi} isToast={true} />
        </ResizeWrapper>
    );
}

const mapStateToProps = (state: RootState, ownProps: ToastAppProps) => ({
    ...ownProps
});

const Container = connect(mapStateToProps)(ToastApp);

export function renderApp(
    notification: StoredNotification,
    webWindow: WebWindow,
    store: ServiceStore,
    setWindowSize: (dim: Point) => void
) {
    const titledNotification: TitledNotification = {
        ...notification,
        title: (store.state.applications.get(notification.source.uuid) || {title: notification.source.name || ''}).title
    };
    ReactDOM.render(
        // Replace redux store with service store implementation.
        // This will resolve the interface incompatibility issues.
        <Provider store={store as unknown as Store<RootState>}>
            <Container storeApi={store} notification={titledNotification} setWindowSize={setWindowSize} />
        </Provider>,
        webWindow.document.getElementById('react-app')
    );
}
