import * as React from 'react';

import {DevelopmentOnly} from '../DevelopmentOnly';
import {GroupingType, Actionable} from '../../containers/NotificationCenterApp';
import {ToggleCenterVisibility, ToggleCenterVisibilitySource, ToggleLockCenter} from '../../../store/Actions';

interface HeaderProps extends Actionable {
    groupBy: GroupingType;
    handleGroupBy: (groupBy: GroupingType) => void;
    centerLocked: boolean;
}

interface LockProps extends Actionable {
    centerLocked: boolean;
}

export function Header(props: HeaderProps): React.ReactElement {
    const {groupBy, handleGroupBy, centerLocked, storeDispatch} = props;

    const handleHideWindow = () => {
        storeDispatch(new ToggleCenterVisibility(ToggleCenterVisibilitySource.BUTTON, false));
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
                <Lock centerLocked={centerLocked} storeDispatch={storeDispatch} />
            </DevelopmentOnly>
        </div>
    );
}

function Lock(props: LockProps): React.ReactElement {
    const {storeDispatch, centerLocked} = props;

    const handleLockWindow = () => {
        storeDispatch(new ToggleLockCenter());
    };

    return <a id="lock-link" onClick={handleLockWindow}>{centerLocked ? '🔒' : '🔓'}</a>;
}
