import { 
	NodeConnectionTypes,
	type INodeType,
	type INodeTypeDescription,
	type IExecuteFunctions,  // additional for programmatic execution
	INodeExecutionData,
} from 'n8n-workflow';
import { eventNotificationsDescription } from './resources/eventnotifications';
import { searchDescription } from './resources/search';
import { BdGraylogApi } from './services/bd-graylog-api.service';

export class BdGraylog implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'BD Graylog',
		name: 'bdGraylog',
		icon: 'file:../../icons/bitdefender.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Interact with the BD Graylog API',
		defaults: {
			name: 'BD Graylog',
		},
		usableAsTool: true,
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		properties: [
			{
				displayName: 'Region',
				name: 'region',
				type: 'string',
				default: 'EU',
				description: 'The region for the Graylog instance',
			},
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Event Notification',
						value: 'eventnotifications',
					},
					{
						name: 'Search',
						value: 'search',
						
					}
				],
				default: 'search',
			},
			...eventNotificationsDescription,
			...searchDescription,
		],
	};

	async execute(this: IExecuteFunctions) {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		const resource = this.getNodeParameter('resource', 0) as string;
		const operation = this.getNodeParameter('operation', 0) as string;
		const glRegion = this.getNodeParameter('region', 0) as string;

		const api = new BdGraylogApi(this)
		await api.init(glRegion);
		
		for (let index = 0; index < items.length; index++) {
			try {
				/**
				 * SEARCH → VIEWS SEARCH
				 */
				if (resource === 'search') {
					if (operation === 'viewsSearchDescription') {
						const data = await api.executeViewsSearch(index)
						returnData.push(data);
					}
					if (operation === 'searchAggregateDescription') {
						const data = await api.executeSearchAggregate(index)
						returnData.push(data);
					}
				}
				/**
				 * EVENT NOTIFICATIONS
				 */
				if (resource === 'eventnotifications') {
					if (operation === 'getEventNotifications') {
						const data = await api.executeGetEventNotifications(index);
						returnData.push(data);
					}
				}
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({ json: { error: error instanceof Error ? error.message : error } });
					continue;
				} else {
					throw error;
				}
			}
		}
		return [returnData];
	}
}
