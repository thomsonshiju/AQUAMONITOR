// MQTT Configuration for AquaMonitor
// These details are stored here for easy access in the frontend/backend

export const MQTT_CONFIG = {
    hostname: "broker.emqx.io",
    port: 8084, // 8084 for WSS
    portTLS: 8883,
    username: "", // Public broker, no auth needed
    password: "",

    // CloudAMQP / RabbitMQ specific notes:
    // Username and Password are the same in this instance.
};

export default MQTT_CONFIG;
