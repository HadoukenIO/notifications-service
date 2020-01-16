import * as React from 'react';
import {MemoryHistory} from 'history';

import {ToggleCenterVisibility, ToggleCenterVisibilitySource, ToggleCenterLocked, ToggleCenterMuted} from '../../../store/Actions';
import {ROUTES} from '../../routes';
import {ClassNameBuilder} from '../../utils/ClassNameBuilder';
import {usePreduxStore} from '../../utils/usePreduxStore';
import {Actionable} from '../../types';
import {DevelopmentOnly} from '../Wrappers/DevelopmentOnly';
import {Icon} from '../Icon/Icon';
import ArrowIcon from '../../../../../res/provider/ui/image/shapes/arrow-circ.svg';

import * as Styles from './Header.module.scss';

interface Props {
    history: MemoryHistory;
}

export const Header: React.FC<Props> = (props) => {
    const {history, children} = props;
    const storeApi = usePreduxStore();
    const navigateIsHide = history.location.pathname === ROUTES.NOTIFICATIONS;
    const navigateButtonClassName = new ClassNameBuilder(Styles, 'buttons', ['right', navigateIsHide]);
    const tooltip = navigateIsHide ? 'Hide center' : 'Go back';

    const handleNavigateClick = () => {
        if (navigateIsHide) {
            new ToggleCenterVisibility(ToggleCenterVisibilitySource.BUTTON, false).dispatch(storeApi);
        } else {
            history.goBack();
        }
    };

    return (
        <div className={ClassNameBuilder.join(Styles, 'header')}>
            <div className={ClassNameBuilder.join(Styles, 'actions')}>
                <div className={navigateButtonClassName.toString()}>
                    <Icon id={navigateIsHide ? 'hide-center' : ''} src={ArrowIcon} onClick={handleNavigateClick} title={tooltip} size={25} />

                </div>
                <div style={{position: 'absolute', left: '50%'}}>
                    <DevelopmentOnly>
                        <Lock centerLocked={storeApi.state.centerLocked} storeApi={storeApi} />
                        <Mute centerMuted={storeApi.state.centerMuted} storeApi={storeApi} />
                    </DevelopmentOnly>
                </div>
            </div>
            <div className={ClassNameBuilder.join(Styles, 'strip')}>
                {children}
            </div>
        </div>
    );
};

interface LockProps extends Actionable {
    centerLocked: boolean;
}

interface MuteProps extends Actionable {
    centerMuted: boolean;
}

function Lock(props: LockProps): React.ReactElement {
    const {storeApi, centerLocked} = props;

    const handleLockCenter = () => {
        new ToggleCenterLocked().dispatch(storeApi);
    };

    return <a id="lock-link" onClick={handleLockCenter}>{centerLocked ? '🔒' : '🔓'}</a>;
}

function Mute(props: MuteProps): React.ReactElement {
    const {storeApi, centerMuted} = props;

    const handleMuteCenter = () => {
        new ToggleCenterMuted().dispatch(storeApi);
    };

    return <a id="mute-link" onClick={handleMuteCenter}>{centerMuted ? '🔈' : '🔊'}</a>;
}
