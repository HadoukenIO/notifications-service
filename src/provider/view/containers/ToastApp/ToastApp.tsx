import * as React from 'react';
import * as ReactDOM from 'react-dom';
import {connect, Provider} from 'react-redux';

import {StoredNotification} from '../../../model/StoredNotification';
import {NotificationCard} from '../../components/NotificationCard/NotificationCard';
import {TearOut} from '../../components/Wrappers/TearOut';
import {WindowDimensions} from '../../../controller/Layouter';
import {RootState} from '../../../store/State';
import {Store} from '../../../store/Store';
import {Actionable, RemoveNotifications} from '../../../store/Actions';
import {WebWindow} from '../../../model/WebWindow';

import '../../styles/base.scss';
import './ToastApp.scss';

interface ToastAppProps extends Actionable {
    notification: StoredNotification;
    setWindowSize: (dimensions: WindowDimensions) => void;
    onDismiss: () => Promise<void>;
}

type Props = ToastAppProps & ReturnType<typeof mapStateToProps>;

export function ToastApp(props: Props) {
    const {notification, setWindowSize, storeDispatch, onDismiss} = props;

    return (
        <TearOut onSize={setWindowSize}>
            <NotificationCard notification={notification} storeDispatch={storeDispatch} isToast={true} onDismiss={onDismiss} />
        </TearOut>
    );
}

const mapStateToProps = (state: RootState, ownProps: ToastAppProps) => ({
    ...ownProps
});

const Container = connect(mapStateToProps)(ToastApp);

export interface RenderOptions {
    notification: StoredNotification;
    webWindow: WebWindow;
    store: Store;
    setWindowSize: (dim: WindowDimensions) => void;
    onDismiss: () => Promise<void>;
}

export function renderApp(options: RenderOptions) {
    const {notification, webWindow, store, setWindowSize, onDismiss} = options;

    ReactDOM.render(
        <Provider store={store['_store']}>
            <Container storeDispatch={store.dispatch.bind(store)} notification={notification} setWindowSize={setWindowSize} onDismiss={onDismiss} />
        </Provider>,
        webWindow.document.getElementById('react-app')
    );
}
