// src/utils/awsConfig.ts
export const awsConfig = {
	clientId: `mqtt_${Math.random().toString(16).slice(3)}`, // Generate a unique client ID
  mqttEndpoint: import.meta.env.VITE_MQTT_ENDPOINT,
  region: import.meta.env.VITE_AWS_REGION,
  accessKeyId: import.meta.env.VITE_AWS_ACCESS_KEY_ID,
  secretAccessKey: import.meta.env.VITE_AWS_SECRET_ACCESS_KEY,
	sessionToken: import.meta.env.VITE_AWS_SESSION_TOKEN,
  timestreamDatabase: 'everest',
  timestreamTables: {
    machineStatus: 'machineStatus',
    vendEvents: 'vendEvents',
  },

};