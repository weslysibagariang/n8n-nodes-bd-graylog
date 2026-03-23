import {
    IExecuteFunctions,
    NodeOperationError,
    IHttpRequestMethods,
    IHttpRequestOptions,
    IDataObject,
    INodeExecutionData,
} from "n8n-workflow";
import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm';
import { 
    viewsSearchRequestBodySchema,
    searchAggregateRequestBodySchema
} from '../resources/search/search.Schema';  // Schema for validating the search request body
import { getEventNotificationsRequestQuerySchema } from '../resources/eventnotifications/eventNotifications.Schema';


export class BdGraylogApi {
	private context: IExecuteFunctions;
	private baseUrl!: string;
	private token!: string;
	private headers?: Record<string, string>;

	private static ssmCache: { data: Record<string, any>, fetchedAt: number } | null = null; // Cache for SSM data
    private static cacheTTL = 5 * 60 * 1000; // Cache Time-To-Live (5 minutes)

	constructor(context: IExecuteFunctions, headers?: Record<string, string>) {
		this.context = context;
		this.headers = {
			'Accept': 'application/json',
			'Content-Type': 'application/json',
			'X-Requested-By': 'n8n',
			...(headers ?? {}),
		 };
	}

	async init(glRegion: string) {
		const data = await this.getSsmData();
		const regionData = data[glRegion];

		if (!regionData) {
			throw new Error(`No data found for region ${glRegion}`);
		}

		const credentials = regionData.find((cred: { instance_type: string }) => cred.instance_type === 'incidents');
		if (!credentials) {
			throw new Error(`No credentials found for region ${glRegion}`);
		}

		this.baseUrl = (credentials?.url as string).replace(/\/+$/, ''); // Remove trailing slashes from base URL
		this.token = credentials?.token as string;

		if (!this.baseUrl || !this.token) {
			throw new Error(`Base URL or token missing for region "${glRegion}"`);
		}
	}

	private async makeRuquest(
		method: IHttpRequestMethods,
		url: string,
		body?: IDataObject,
		params?: IDataObject
	): Promise<IDataObject> {
		const auth = Buffer.from(`${this.token}:token`).toString('base64');

		const reqBody: IHttpRequestOptions = {
			method,
			url,
			headers: {
				...this.headers,
				'Authorization': `Basic ${auth}`,
			},
			json: true,
		};

		if (body) reqBody.body = body;
		if (params) reqBody.qs = params;
		
		return await this.context.helpers.httpRequest.call(
			this.context,
			reqBody,
		);
	}
	
	private async getSsmData(): Promise<Record<string, any>> {
        const now = Date.now();
        if (BdGraylogApi.ssmCache && (now - BdGraylogApi.ssmCache.fetchedAt < BdGraylogApi.cacheTTL)) {

            return BdGraylogApi.ssmCache.data;
        }
		const stage = process.env.AWS_PROFILE || 'dev';
		const region = process.env.AWS_REGION || 'us-east-1';

		const client = new SSMClient({ region: region });

		const command = new GetParameterCommand({ 
			Name: `/bitdefender/mdr/di/swimlane/keystore/${stage}/graylog`,
			WithDecryption: true 
		});

		const response = await client.send(command);

		if (!response.Parameter?.Value) {
			throw new Error('SSM parameter not found or has no value');
		}

		const data: Record<string, any> = JSON.parse(response.Parameter.Value);

        BdGraylogApi.ssmCache = { data, fetchedAt: now, };

		return data
	};

	async executeGetEventNotifications(
		index: number,
	): Promise<INodeExecutionData> {
		const page = this.context.getNodeParameter('page', index) as number;
		const perPage = this.context.getNodeParameter('per_page', index) as number;
		const query = this.context.getNodeParameter('query', index) as string;

		const params: Record<string, any> = getEventNotificationsRequestQuerySchema.parse({
			page: page,
			per_page: perPage,
			query: query,
		});

		const url = `${this.baseUrl}/events/notifications`;
		const response = await this.makeRuquest('GET', url, undefined, params);
		return { json: response.notifications as IDataObject };
	}

	async executeViewsSearch(index: number): Promise<INodeExecutionData> {
		const rawBody = this.context.getNodeParameter('body', index) as string;

		let body;

		try {
			body = JSON.parse(rawBody);
		} catch {
			throw new NodeOperationError(this.context.getNode(), `Payload must be valid JSON`, { itemIndex: index });
		}

		const result = viewsSearchRequestBodySchema.safeParse(body);

		if (!result.success) {
			throw new NodeOperationError(
				this.context.getNode(), 
				`Invalid request body: ${result.error.message}`, 
				{ itemIndex: index }
			);
		}

		const response = await this.makeRuquest('POST', `${this.baseUrl}/views/search`, result.data);
		return { json: response };
	}

	async executeSearchAggregate(
		index: number,
	): Promise<INodeExecutionData> {
		const rawQuery = this.context.getNodeParameter('query', index) as string;

		let query;

		try {
			query = JSON.parse(rawQuery);
		} catch {
			throw new NodeOperationError(this.context.getNode(), `Query must be valid JSON`, { itemIndex: index });
		}

		const result = searchAggregateRequestBodySchema.safeParse(query);

		if (!result.success) {
			throw new NodeOperationError(
				this.context.getNode(), 
				`Invalid request body: ${result.error.message}`, 
				{ itemIndex: index }
			);
		}

		const response = await this.makeRuquest('POST', `${this.baseUrl}/search/aggregate`, result.data);
        const schema: Array<IDataObject> = response.schema as Array<IDataObject>;
        const datarows: Array<Array<any>> = response.datarows as Array<Array<any>>;
        const keys: string[] = schema.map((item) => String(item.field ?? item.function ?? "unknown"));
        
        if (!Array.isArray(datarows) || datarows.some(row => !Array.isArray(row))) {
            return { json: {} as IDataObject };
        }

        const mappedData: IDataObject[] = datarows.map(row => {
            const obj: IDataObject = {};
            row.forEach((value, index) => {
                const key = keys[index] || `field_${index}`;
                obj[key] = value;
            });
            return obj;
        });
        return { json: JSON.parse(JSON.stringify(mappedData)) as IDataObject };
	}
}
