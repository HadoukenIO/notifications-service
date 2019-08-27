import * as React from 'react';

import {GroupingType} from '../../utils/Grouping';
import {Actionable} from '../../../store/Actions';
import {CircleButton} from '../CircleButton/CircleButton';
import {ToggleVisibility} from '../../../store/Actions';

import {ClearAllPrompt} from './ClearAllPrompt';

import './Header.scss';

interface Props extends Actionable {
    visible: boolean;
    groupBy: GroupingType;
    handleGroupBy: (groupBy: GroupingType) => void;
    onClearAll: () => void;
}

export function Header(props: Props): React.ReactElement {
    const {groupBy, visible, handleGroupBy, onClearAll, storeDispatch} = props;
    const handleHideWindow = () => {
        storeDispatch(new ToggleVisibility(false));
    };

    return (<div className="header">
        <div className="title">
            <div>
                {/* Layoutspace and in the future place filter/settings here */}
            </div>
            <CircleButton type="hide" size="large" onClick={handleHideWindow} alt="Hide center" />
        </div>
        <div className="strip">
            <ul className="options">
                <li className="detail">
                    <span>Sort By:</span>
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
            <ClearAllPrompt centerVisible={visible} onAccept={onClearAll} />
        </div>
    </div>);
}
