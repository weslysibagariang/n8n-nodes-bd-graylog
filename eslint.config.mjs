import { configWithoutCloudSupport } from '@n8n/node-cli/eslint';

export default [
  ...configWithoutCloudSupport,
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
];
