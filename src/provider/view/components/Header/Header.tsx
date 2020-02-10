import * as React from 'react';
import {MemoryHistory} from 'history';

import {CircleButton, IconType, Size} from '../CircleButton/CircleButton';
import {ToggleCenterVisibility, ToggleCenterVisibilitySource} from '../../../store/Actions';
import {ROUTES} from '../../routes';
import {ClassNameBuilder} from '../../utils/ClassNameBuilder';
import {usePreduxStore} from '../../utils/usePreduxStore';

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
                    <CircleButton id="hide-center" type={IconType.HIDE} size={Size.NORMAL} onClick={handleNavigateClick} alt={tooltip} />

                </div>
            </div>
            <div className={ClassNameBuilder.join(Styles, 'strip')}>
                {children}
            </div>
        </div>
    );
};
