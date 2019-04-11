import * as React from 'react';
import {GroupByType} from '../../NotificationCenterApp';

interface HeaderProps {
    groupBy: GroupByType;
    handleGroupBy: (groupBy: GroupByType) => void;
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
                        handleGroupBy(GroupByType.APPLICATION)
                    }
                >
                    APPLICATION
                </div>
                <div
                    className="sort-button"
                    onClick={() =>
                        handleGroupBy(GroupByType.DATE)
                    }
                >
                    DATE
                </div>
            </div>

            <img id="exitLink" onClick={() => handleHideWindow} src="image/shapes/arrowsv2.svg" alt="" />
        </div>
    );
}
