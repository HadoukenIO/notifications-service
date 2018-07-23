import * as React from 'react';
import { ChangeEvent } from 'react';
import { eGroupMethod } from './App';

interface IHeaderProps {
    groupBy?: eGroupMethod;
    handleGroupBy?: (groupBy: eGroupMethod) => void;
}

export class Header extends React.Component<IHeaderProps> {
    constructor(props: IHeaderProps) {
        super(props);

        this.handleGroupBy = this.handleGroupBy.bind(this);
    }

    public render(): JSX.Element {
        return (
            <div id="header">
                <div className="sort-buttons">
                    <div className="sort-title">Sort By : </div>
                    <div
                        className="sort-button"
                        onClick={() =>
                            this.props.handleGroupBy(eGroupMethod.APPLICATION)
                        }
                    >
                        APPLICATION
                    </div>
                    <div
                        className="sort-button"
                        onClick={() =>
                            this.props.handleGroupBy(eGroupMethod.DATE)
                        }
                    >
                        DATE
                    </div>
                </div>

                <img id="exitLink" src="image/shapes/arrowsv2.svg" alt="" />
            </div>
        );
    }

    private handleGroupBy(event: ChangeEvent<HTMLSelectElement>): void {
        this.props.handleGroupBy(this.convertToEnum(event.target.value));
    }

    private convertToEnum(method: string): eGroupMethod {
        return parseFloat(method) as eGroupMethod; // tslint:disable-line:ban
    }
}
