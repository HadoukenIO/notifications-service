import * as React from 'react';

import {GroupingType, Actionable} from '../../containers/NotificationCenterApp';
import {ToggleVisibility} from '../../../store/Actions';

interface HeaderProps extends Actionable {
    groupBy: GroupingType;
    handleGroupBy: (groupBy: GroupingType) => void;
}

export function Header(props: HeaderProps): React.ReactElement {
    const {groupBy, handleGroupBy, storeDispatch} = props;

    const handleHideWindow = () => {
        storeDispatch(new ToggleVisibility('button', false));
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
        </div>
    );
}
