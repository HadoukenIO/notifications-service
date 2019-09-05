import * as React from 'react';
import * as ReactDOM from 'react-dom';
import {connect, Provider} from 'react-redux';

import {StoredNotification} from '../../../model/StoredNotification';
import {NotificationCard} from '../../components/NotificationCard/NotificationCard';
import {TearOut} from '../../components/Wrappers/TearOut';
import {WindowDimensions} from '../../../controller/Layouter';
import {RootState} from '../../../store/State';
import {Store} from '../../../store/Store';
import {Actionable} from '../../../store/Actions';
import {WebWindow} from '../../../model/WebWindow';

import '../../styles/base.scss';
import './ToastApp.scss';

interface ToastAppProps extends Actionable {
    notification: StoredNotification;
    setWindowSize: (dimensions: WindowDimensions) => void;
}

type Props = ToastAppProps & ReturnType<typeof mapStateToProps>;

export function ToastApp(props: Props) {
    const {notification, setWindowSize, storeDispatch} = props;

    return (
        <TearOut onSize={setWindowSize}>
            <NotificationCard notification={notification} storeDispatch={storeDispatch} isToast={true} />
        </TearOut>
    );
}

const mapStateToProps = (state: RootState, ownProps: ToastAppProps) => ({
    ...ownProps
});

const Container = connect(mapStateToProps)(ToastApp);

export function renderApp(notification: StoredNotification, webWindow: WebWindow, store: Store, setWindowSize: (dim: WindowDimensions) => void) {
    ReactDOM.render(
        <Provider store={store['_store']}>
            <Container storeDispatch={store.dispatch.bind(store)} notification={notification} setWindowSize={setWindowSize} />
        </Provider>,
        webWindow.document.getElementById('react-app')
    );
}
