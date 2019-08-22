import React from 'react';

interface Props {
    text?: string;
    icon?: string;
    onClick?: () => void;
}

export function Button(props: Props) {
    const {text, icon, onClick} = props;
    const handleClick = (event: React.MouseEvent) => {
        event.preventDefault();
        event.stopPropagation();
        if (onClick)
            onClick();
    };

    return (
        <div className="button single-line" onClick={handleClick}>
            <div className="value">
                {icon && <img src={icon} alt="" />}
                <span className="single-line">{text}</span>
            </div>
        </div>
    );
}
