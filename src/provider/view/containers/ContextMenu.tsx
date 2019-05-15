import * as React from 'react';
import * as ReactDOM from 'react-dom';
import {WindowOption} from 'openfin/_v2/api/window/windowOption';

import {createWebWindow, WebWindow} from '../../model/WebWindow';
import {MenuItem} from '../../common/ContextMenu';

interface ContextMenuProps {
    menuItems?: MenuItem[];
    afterClick: () => void;
}

function ContextMenu(props: ContextMenuProps) {
    const {menuItems = [], afterClick} = props;
    const handleItemClick = () => {
        afterClick();
    };

    return (
        <div className="context-menu">
            <ul>
                {
                    menuItems.map((item, i) => {
                        return (
                            <ContextMenuItem key={i} onClick={handleItemClick} item={item} />
                        );
                    })
                }
            </ul>
        </div>
    );
}

interface ContextMenuItemProps {
    onClick: () => void;
    item: MenuItem;
}

function ContextMenuItem(props: ContextMenuItemProps) {
    const {item, onClick} = props;
    const handleClick = (event: React.MouseEvent) => {
        event.stopPropagation();
        if (item.onClick) {
            item.onClick();
        }
        onClick();
    };

    return (
        <li className="item" onClick={handleClick}>
            <span>
                {item.text}
            </span>
        </li>
    );
}


export async function renderApp(document: Document, menuItems: MenuItem[], afterClick: () => void): Promise<void> {
    ReactDOM.render(
        <ContextMenu menuItems={menuItems} afterClick={afterClick} />,
        document.getElementById('react-app')
    );
}
