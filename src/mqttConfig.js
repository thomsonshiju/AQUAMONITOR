// MQTT Configuration for AquaMonitor
// These details are stored here for easy access in the frontend/backend

export const MQTT_CONFIG = {
    hostname: "broker.hivemq.com",
    port: 8884, // 8884 for WSS (more secure and works on HTTPS sites)
    path: "/mqtt",
    username: "",
    password: "",
};

export default MQTT_CONFIG;
