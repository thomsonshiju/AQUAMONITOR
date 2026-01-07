// MQTT Configuration for AquaMonitor
// These details are stored here for easy access in the frontend/backend

export const MQTT_CONFIG = {
    hostname: import.meta.env.VITE_MQTT_HOST,
    port: parseInt(import.meta.env.VITE_MQTT_PORT),
    portTLS: parseInt(import.meta.env.VITE_MQTT_PORT_TLS),
    username: import.meta.env.VITE_MQTT_USER,
    password: import.meta.env.VITE_MQTT_PASS,

    // CloudAMQP / RabbitMQ specific notes:
    // Username and Password are the same in this instance.
};

export default MQTT_CONFIG;
