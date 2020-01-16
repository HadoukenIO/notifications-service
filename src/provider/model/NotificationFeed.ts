export interface NotificationFeed {
    id: string;
    name: string;
    description: string;
    logo: string;
    subscribed: boolean;
}

const PLACEHOLDER_DESCRIPTION = 'Lorem ipsum dolor sit amet, has cu dico natum. Ius veri patrioque ne. Eu mea suas appetere, quem constituto eam cu.';
const PLACEHOLDER_LOGO = 'https://cdn.pixabay.com/photo/2016/01/26/17/15/gmail-1162901_960_720.png';

export const mockFeeds: NotificationFeed[] = [
    {id: '1', subscribed: false, logo: PLACEHOLDER_LOGO, name: 'Feed 1', description: PLACEHOLDER_DESCRIPTION},
    {id: '2', subscribed: true, logo: PLACEHOLDER_LOGO, name: 'Feed 2', description: PLACEHOLDER_DESCRIPTION},
    {id: '3', subscribed: true, logo: PLACEHOLDER_LOGO, name: 'Feed 3', description: PLACEHOLDER_DESCRIPTION},
    {id: '4', subscribed: false, logo: PLACEHOLDER_LOGO, name: 'Feed 4', description: PLACEHOLDER_DESCRIPTION},
    {id: '5', subscribed: true, logo: PLACEHOLDER_LOGO, name: 'Feed 5', description: PLACEHOLDER_DESCRIPTION}
];
