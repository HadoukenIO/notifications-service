import * as React from 'react';

import {DevelopmentOnly} from '../DevelopmentOnly';
import {GroupingType, Actionable} from '../../containers/NotificationCenterApp';
import {ToggleVisibility, ToggleVisibilitySource, ToggleLockCenter} from '../../../store/Actions';

interface HeaderProps extends Actionable {
    groupBy: GroupingType;
    handleGroupBy: (groupBy: GroupingType) => void;
    windowLocked: boolean;
}

interface LockProps extends Actionable {
    windowLocked: boolean;
}

export function Header(props: HeaderProps): React.ReactElement {
    const {groupBy, handleGroupBy, windowLocked, storeDispatch} = props;

    const handleHideWindow = () => {
        storeDispatch(new ToggleVisibility(ToggleVisibilitySource.BUTTON, false));
    };

    return (
        <div className='header'>
            <div className="sort-buttons">
                <div className="sort-title">Sort By : </div>
                {
                    Object.values(GroupingType).map((name, i) => {
                        const selected = name === groupBy ? 'selected' : null;
                        return (
                            <div
                                key={i}
                                className={`sort-button ${selected}`}
                                onClick={() => handleGroupBy(name)}
                            >
                                {name}
                            </div>
                        );
                    })
                }
            </div>
            <img id="exit-link" onClick={handleHideWindow} src="image/shapes/arrow.png" alt="" />
            <DevelopmentOnly>
                <Lock windowLocked={windowLocked} storeDispatch={storeDispatch} />
            </DevelopmentOnly>
        </div>
    );
}

function Lock(props: LockProps): React.ReactElement {
    const {storeDispatch, windowLocked} = props;

    const handleLockWindow = () => {
        storeDispatch(new ToggleLockCenter());
    };

    return <a id="lock-link" onClick={handleLockWindow}>{windowLocked ? '🔒' : '🔓'}</a>;
}
