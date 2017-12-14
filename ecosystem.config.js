//http://pm2.keymetrics.io/docs/usage/application-declaration/#process-file
module.exports = {
	apps: [{
		name: 'worker',
		script: './worker.js',
		watch: true,
		env: {
			NODE_ENV: 'development'
		},
		env_production: {
			NODE_ENV: 'production'
		}
	}, {
		name: 'api-app',
		script: './api.js',
		instances: 4,
		exec_mode: 'cluster'
	}]
};
