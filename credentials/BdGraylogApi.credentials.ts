import type {
	IAuthenticateGeneric,
	Icon,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class BdGraylogApi implements ICredentialType {
	name = 'bdGraylogApi';

	displayName = 'BD Graylog API';

	icon?: Icon | undefined = 'file:../icons/bitdefender.svg';

	// Link to your community node's README
	documentationUrl = 'https://github.com/org/-bd-graylog?tab=readme-ov-file#credentials';

	properties: INodeProperties[] = [
		{
			displayName: 'Base URL',
			name: 'baseUrl',
			type: 'string',
			default: '',
			description: 'The base URL of the BD Graylog API',
			placeholder: 'https://your-graylog-instance.com/api',
			required: true,
		},
		{
			displayName: 'Username',
			name: 'username',
			type: 'string',
			default: '',
			required: true,
			description: 'The username to authenticate with',
			placeholder: 'admin',
		},
		{
			displayName: 'Token',
			name: 'password',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			required: true,
			description: 'The token to authenticate with',
			placeholder: 'your-api-token',
			// hint: 'Generate a token in your BD Graylog account settings and use it here.',
			hint: 'Generate a token in your BD Graylog account settings and use it here.',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			auth: {
				username: '={{$credentials.username}}',
				password: '={{$credentials.password}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{$credentials.baseUrl.trim().replace(/\\/$/, "")}}',
			url: '/v1/user',
		},
	};
}
