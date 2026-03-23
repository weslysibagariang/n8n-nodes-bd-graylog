import type { INodeProperties } from 'n8n-workflow';

export const viewsSearchDescription: INodeProperties[] = [
    {
        displayName: 'Search Body',
        name: 'body',
        type: 'json',
        required: true,
        displayOptions: {
            show: {
                operation: ['viewsSearchDescription'],
                resource: ['search'],
            },
        },
        default: '{}',
        description: 'Search query to execute',
    },
];

export const searchAggregateDescription: INodeProperties[] = [
    {
        displayName: 'Query',
        name: 'query',
        type: 'json',
        required: true,
        displayOptions: {
            show: {
                operation: ['searchAggregateDescription'],
                resource: ['search'],
            },
        },
        default: '{}',
        description: 'The aggregation query to execute',
    }
]
