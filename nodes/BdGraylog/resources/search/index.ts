import type { INodeProperties } from 'n8n-workflow';
import { viewsSearchDescription, searchAggregateDescription } from './search';

export const searchDescription: INodeProperties[] = [
    {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: {
            show: {
                resource: ['search'],
            },
        },
        options: [
            {
                name: 'Post Views Search',
                value: 'viewsSearchDescription',
                description: 'Execute a search query',
                action: 'Post views search',
            },
            {
                name: 'Search Aggregate',
                value: 'searchAggregateDescription',
                description: 'Execute an aggregation query',
                action: 'Search aggregate',
            }
        ],
        default: 'searchAggregateDescription',
     },
    ...viewsSearchDescription,
    ...searchAggregateDescription,
]
