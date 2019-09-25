import * as React from 'react';

import {getDate} from '../../utils/Time';
import {WindowContext} from '../Wrappers/WindowContext';

interface Props {
    date: number;
}

export function NotificationTime(props: Props) {
    const {date} = props;
    const window = React.useContext(WindowContext);
    const [formattedDate, setFormattedDate] = React.useState<string>(getDate(date));

    React.useEffect(() => {
        const timer = window.setInterval(() => {
            setFormattedDate(getDate(date));
        }, 60 * 1000);

        return () => {
            window.clearInterval(timer);
        };
    }, []);

    return (
        <div className="time single-line">
            {formattedDate}
        </div>
    );
}
