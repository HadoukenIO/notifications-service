import * as React from 'react';
import { eGroupMethod } from '../../container/App';

interface IHeaderProps {
    groupBy?: eGroupMethod;
    handleGroupBy?: (groupBy: eGroupMethod) => void;
}

export function Header(props: IHeaderProps) {
    return (
        <div id="header">
            <div className="sort-buttons">
                <div className="sort-title">Sort By : </div>
                <div
                    className="sort-button"
                    onClick={() =>
                        props.handleGroupBy(eGroupMethod.APPLICATION)
                    }
                >
                    APPLICATION
                </div>
                <div
                    className="sort-button"
                    onClick={() =>
                        props.handleGroupBy(eGroupMethod.DATE)
                    }
                >
                    DATE
                </div>
            </div>

            <img id="exitLink" src="image/shapes/arrowsv2.svg" alt="" />
        </div>
    );
}
