import * as React from 'react';

export interface NotificationButtonProps {
    /** Button text */
    text: string;
    /** Icon URL */
    icon?: string;
    buttonIndex: number;
    onClick: (index: number) => void;
}

export function Button(props: NotificationButtonProps) {
    const {onClick, text, icon, buttonIndex} = props;

    function handleButtonClick(event: React.MouseEvent<HTMLElement>) {
        event.stopPropagation();
        event.preventDefault();
        onClick(buttonIndex);
    }

    return (
        <div className="button" onClick={handleButtonClick}>
            {icon && <img className="" src={icon} />}
            <span className={text}>{text}</span>
        </div>
    );
}

