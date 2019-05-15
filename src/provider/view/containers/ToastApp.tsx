import * as React from 'react';
import * as ReactDOM from 'react-dom';
import {Store, Dispatch, bindActionCreators} from 'redux';
import {connect, Provider} from 'react-redux';

import {StoredNotification} from '../../model/StoredNotification';
import {NotificationCard} from '../components/NotificationCard/NotificationCard';
import {WindowDimensions} from '../../controller/ToastManager';
import {UIHandlers} from '../../model/UIHandlers';
import {clickNotification, clickNotificationButton, removeNotifications} from '../../store/notifications/actions';
import {toggleCenterWindowVisibility} from '../../store/ui/actions';
import {RootState} from '../../store/typings';

interface ToastAppProps {
    meta: StoredNotification;
    setWindowSize: (dimensions: WindowDimensions) => void;
}

type Props = ToastAppProps & ReturnType<typeof mapDispatchToProps> & ReturnType<typeof mapStateToProps> & UIHandlers;

export function ToastApp(props: Props) {
    const {meta, setWindowSize, ...rest} = props;
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
            <NotificationCard meta={meta} {...rest} />
        </div>
    );
}

const mapDispatchToProps = (dispatch: Dispatch) => bindActionCreators(
    {
        onClickNotification: clickNotification,
        onClickButton: clickNotificationButton,
        onRemoveNotifications: removeNotifications,
        onToggleWindow: toggleCenterWindowVisibility
    },
    dispatch
);

const mapStateToProps = (state: RootState, ownProps: ToastAppProps) => ({
    ...ownProps
});

const Container = connect(mapStateToProps, mapDispatchToProps)(ToastApp);

export function renderApp(notification: StoredNotification, document: Document, store: Store, setWindowSize: (dim: WindowDimensions) => void) {
    ReactDOM.render(
        <Provider store={store}>
            <Container meta={notification} setWindowSize={setWindowSize} />
        </Provider>,
        document.getElementById('react-app')
    );
}
