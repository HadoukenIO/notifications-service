import * as React from 'react';
import {GroupByType} from '../../NotificationCenterApp';

interface HeaderProps {
    groupBy: GroupByType;
    handleGroupBy: (groupBy: GroupByType) => void;
}

export function Header(props: HeaderProps) {
    return (
        <div id="header">
            <div className="sort-buttons">
                <div className="sort-title">Sort By : </div>
                <div
                    className="sort-button"
                    onClick={() =>
                        props.handleGroupBy(GroupByType.APPLICATION)
                    }
                >
                    APPLICATION
                </div>
                <div
                    className="sort-button"
                    onClick={() =>
                        props.handleGroupBy(GroupByType.DATE)
                    }
                >
                    DATE
                </div>
            </div>

            <img id="exitLink" src="image/shapes/arrowsv2.svg" alt="" />
        </div>
    );
}
