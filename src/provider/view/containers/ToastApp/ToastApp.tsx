import * as React from 'react';
import * as ReactDOM from 'react-dom';
import {connect, Provider} from 'react-redux';
import {Store} from 'redux';

import {StoredNotification} from '../../../model/StoredNotification';
import {NotificationCard, TitledNotification} from '../../components/NotificationCard/NotificationCard';
import {ResizeWrapper} from '../../components/Wrappers/ResizeWrapper';
import {WindowDimensions} from '../../../controller/Layouter';
import {RootState} from '../../../store/State';
import {Actionable} from '../../../store/Actions';
import {WebWindow} from '../../../model/WebWindow';
import {ServiceStore} from '../../../store/ServiceStore';

import '../../styles/base.scss';
import './ToastApp.scss';

interface ToastAppProps extends Actionable {
    notification: TitledNotification;
    setWindowSize: (dimensions: WindowDimensions) => void;
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

export interface RenderOptions {
    notification: StoredNotification;
    webWindow: WebWindow;
    store: ServiceStore;
    setWindowSize: (dim: WindowDimensions) => void;
}

export function renderApp(options: RenderOptions) {
    const {notification, webWindow, store, setWindowSize} = options;
    const titledNotification: TitledNotification = {
        ...notification,
        title: (store.state.applications.get(notification.source.uuid) || {title: notification.source.name || ''}).title
    };

    ReactDOM.render(
        <Provider store={store as unknown as Store<RootState>}>
            <Container storeApi={store} notification={titledNotification} setWindowSize={setWindowSize} />
        </Provider>,
        webWindow.document.getElementById('react-app')
    );
}
