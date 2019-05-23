import * as React from 'react';

import {GroupingType} from '../../containers/NotificationCenterApp';

interface HeaderProps {
    groupBy: GroupingType;
    handleGroupBy: (groupBy: GroupingType) => void;
    onHideWindow: (visible?: boolean) => void;
}

export function Header(props: HeaderProps): React.ReactElement {
    const {groupBy, handleGroupBy, onHideWindow} = props;

    const handleHideWindow = () => {
        onHideWindow(false);
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

            <img id="exit-link" onClick={handleHideWindow} src="image/shapes/arrowsv2.svg" alt="" />
        </div>
    );
}
