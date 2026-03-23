import type { INodeProperties } from 'n8n-workflow';

const showOnlyForEventNotifications = {
	operation: ['getEventNotifications'],
	resource: ['eventnotifications'],
};

export const getEventNotifications: INodeProperties[] = [
    {
        displayName: 'Page',
        name: 'page',
        type: 'number',
        displayOptions: {
            show: showOnlyForEventNotifications,
        },
        default: 1,
        description: 'Page number to retrieve',
    },

    {
        displayName: 'Limit',
        name: 'per_page',
        type: 'number',
        displayOptions: {
            show: showOnlyForEventNotifications,
        },
        typeOptions: {
            minValue: 1,
            maxValue: 100,
        },
        default: 50,
        description: 'Number of results to return per page',
    },

    {
        displayName: 'Query',
        name: 'query',
        type: 'string',
        displayOptions: {
            show: showOnlyForEventNotifications,
        },
        default: '',
        description: 'Search query to filter event notifications',
    }
]
