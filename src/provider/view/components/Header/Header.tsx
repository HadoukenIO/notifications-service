import * as React from 'react';

import {GroupingType} from '../../utils/Grouping';
import {Actionable} from '../../../store/Actions';
import {CircleButton} from '../CircleButton/CircleButton';
import {DevelopmentOnly} from '../Wrappers/DevelopmentOnly';
import {ToggleCenterVisibility, ToggleCenterVisibilitySource, ToggleLockCenter} from '../../../store/Actions';

import {ClearAllPrompt} from './ClearAllPrompt';

import './Header.scss';

interface Props extends Actionable {
    centerVisible: boolean;
    groupBy: GroupingType;
    handleGroupBy: (groupBy: GroupingType) => void;
    centerLocked: boolean;
    onClearAll: () => void;
}

export function Header(props: Props): React.ReactElement {
    const {groupBy, centerVisible, handleGroupBy, centerLocked, onClearAll, storeDispatch} = props;
    const handleHideWindow = () => {
        storeDispatch(new ToggleCenterVisibility(ToggleCenterVisibilitySource.BUTTON, false));
    };

    return (
        <div className="header">
            <div className="title">
                <div>
                    {/* Layoutspace and in the future place filter/settings here */}
                    <DevelopmentOnly>
                        <Lock centerLocked={centerLocked} storeDispatch={storeDispatch} />
                    </DevelopmentOnly>
                </div>
                <CircleButton id="hide-center" type="hide" size="large" onClick={handleHideWindow} alt="Hide center" />
            </div>
            <div className="strip">
                <ul className="options">
                    <li className="detail">
                        <span>Group By:</span>
                    </li>
                    {
                        Object.values(GroupingType).map((name, i) => {
                            const selected = name === groupBy ? 'active' : null;
                            return (
                                <li
                                    key={i}
                                    className={`sort-button ${selected}`}
                                    onClick={() => handleGroupBy(name)}
                                >
                                    <span>{name}</span>
                                </li>
                            );
                        })
                    }
                </ul>
                <ClearAllPrompt centerVisible={centerVisible} onAccept={onClearAll} />
            </div>
        </div>
    );
}

interface LockProps extends Actionable {
    centerLocked: boolean;
}

function Lock(props: LockProps): React.ReactElement {
    const {storeDispatch, centerLocked} = props;

    const handleLockWindow = () => {
        storeDispatch(new ToggleLockCenter());
    };

    return <a id="lock-link" onClick={handleLockWindow}>{centerLocked ? '🔒' : '🔓'}</a>;
}
