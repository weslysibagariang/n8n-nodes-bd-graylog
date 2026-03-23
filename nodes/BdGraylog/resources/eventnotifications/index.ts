import type { INodeProperties } from 'n8n-workflow';
import { getEventNotifications } from './geteventnotifications';

const showOnlyForEventNotifications = {
    resource: ['eventnotifications'],
};

export const eventNotificationsDescription: INodeProperties[] = [
    {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: {
            show: showOnlyForEventNotifications,
        },
        options: [
            {
                name: 'Get Event Notifications',
                value: 'getEventNotifications',
                action: 'Get event notifications',
            },
        ],
        default: 'getEventNotifications',
    },
    ...getEventNotifications,
];
