import * as React from 'react';
import {connect} from 'react-redux';

import {NotificationCard} from '../../components/NotificationCard/NotificationCard';
import {ResizeWrapper} from '../../components/Wrappers/ResizeWrapper';
import {RootState} from '../../../store/State';
import {Point} from '../../../model/Toast';
import {TitledNotification, Actionable} from '../../types';
import {WindowContext} from '../../components/Wrappers/WindowContext';
import '../../styles/main.scss';
import './ToastApp.scss';
import {StoredNotification} from '../../../model/StoredNotification';

interface ToastAppProps extends Actionable{
    notification: StoredNotification;
    setWindowSize: (dimensions: Point) => void;
}

const ToastAppComponent: React.FC<ToastAppProps> = (props) => {
    const {notification, setWindowSize, storeApi} = props;
    const window = React.useContext(WindowContext);
    const titledNotification: TitledNotification = {
        ...notification,
        title: (storeApi.state.applications.get(notification.source.uuid) || {title: notification.source.name || ''}).title
    };

    React.useEffect(() => {
        window.document.title = notification.id;
    });

    return (
        <ResizeWrapper onSize={setWindowSize}>
            <NotificationCard notification={titledNotification} storeApi={storeApi} isToast={true} />
        </ResizeWrapper>
    );
};

const mapStateToProps = (state: RootState, ownProps: ToastAppProps) => ({
    ...ownProps
});

export const ToastApp = connect(mapStateToProps)(ToastAppComponent);
