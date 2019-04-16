import * as React from 'react';

import {GroupingType} from '../../NotificationCenterApp';

interface HeaderProps {
    groupBy: GroupingType;
    handleGroupBy: (groupBy: GroupingType) => void;
    handleHideWindow: (value?: boolean) => void;
}

export function Header(props: HeaderProps): React.ReactElement {
    const {groupBy, handleGroupBy, handleHideWindow} = props;
    return (
        <div id="header">
            <div className="sort-buttons">
                <div className="sort-title">Sort By : </div>
                <div
                    className="sort-button"
                    onClick={() =>
                        handleGroupBy(GroupingType.APPLICATION)
                    }
                >
                    APPLICATION
                </div>
                <div
                    className="sort-button"
                    onClick={() =>
                        handleGroupBy(GroupingType.DATE)
                    }
                >
                    DATE
                </div>
            </div>

            <img id="exitLink" onClick={() => handleHideWindow} src="image/shapes/arrowsv2.svg" alt="" />
        </div>
    );
}
