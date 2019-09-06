import * as React from 'react';
import * as ReactDOM from 'react-dom';
import {Store} from 'redux';
import {connect, Provider} from 'react-redux';

import {StoredNotification} from '../../model/StoredNotification';
import {NotificationCard} from '../components/NotificationCard/NotificationCard';
import {WindowDimensions} from '../../controller/Layouter';
import {RootState} from '../../store/State';
import {ServiceStore} from '../../store/ServiceStore';
import {WebWindow} from '../../model/WebWindow';

import {Actionable} from './NotificationCenterApp';

interface ToastAppProps extends Actionable {
    notification: StoredNotification;
    setWindowSize: (dimensions: WindowDimensions) => void;
}

type Props = ToastAppProps & ReturnType<typeof mapStateToProps>;

export function ToastApp(props: Props) {
    const {notification, setWindowSize, storeDispatch} = props;
    const containerRef = React.useRef<HTMLDivElement>(null);

    // Get the size of the container ref
    const updateWindowDimensions = () => {
        if (containerRef && containerRef.current) {
            const {width, height} = containerRef.current.getBoundingClientRect();
            if (width && height) {
                setWindowSize({width, height});
            }
        }
    };

    React.useEffect(() => {
        if (containerRef.current === null) {
            return;
        }
        updateWindowDimensions();
    });

    return (
        <div id='toast-container' ref={containerRef}>
            <NotificationCard notification={notification} storeDispatch={storeDispatch} />
        </div>
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
    setWindowSize: (dim: WindowDimensions) => void
) {
    ReactDOM.render(
        // Replace redux store with service store implementation.
        // This will resolve the interface incompatibility issues.
        <Provider store={store as unknown as Store<RootState>}>
            <Container storeDispatch={store.dispatch.bind(store)} notification={notification} setWindowSize={setWindowSize} />
        </Provider>,
        webWindow.document.getElementById('react-app')
    );
}
