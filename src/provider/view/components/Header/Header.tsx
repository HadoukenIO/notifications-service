import * as React from 'react';

import {DevelopmentOnly} from '../DevelopmentOnly';
import {GroupingType} from '../../containers/NotificationCenterApp';
import {ToggleCenterVisibility, ToggleCenterVisibilitySource, ToggleLockCenter, Actionable} from '../../../store/Actions';

interface HeaderProps extends Actionable {
    groupBy: GroupingType;
    handleGroupBy: (groupBy: GroupingType) => void;
    centerLocked: boolean;
}

interface LockProps extends Actionable {
    centerLocked: boolean;
}

export function Header(props: HeaderProps): React.ReactElement {
    const {groupBy, handleGroupBy, centerLocked, storeApi} = props;

    const handleHideWindow = () => {
        new ToggleCenterVisibility(ToggleCenterVisibilitySource.BUTTON, false).dispatch(storeApi);
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
                <Lock centerLocked={centerLocked} storeApi={storeApi} />
            </DevelopmentOnly>
        </div>
    );
}

function Lock(props: LockProps): React.ReactElement {
    const {storeApi, centerLocked} = props;

    const handleLockWindow = () => {
        new ToggleLockCenter().dispatch(storeApi);
    };

    return <a id="lock-link" onClick={handleLockWindow}>{centerLocked ? '🔒' : '🔓'}</a>;
}
