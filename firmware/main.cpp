/*
 * AQUA Project - ESP32 Water Level Monitoring System
 * Sensor: JSN-SR04T (Ultrasonic) - Integrated with Pins 14/27
 * Connectivity: MQTT (HiveMQ)
 */

#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>

// ==========================================
// 1. CONFIGURATION SECTION
// ==========================================

// --- WiFi Configuration ---
const char* WIFI_SSID     = "thomson";
const char* WIFI_PASSWORD = "Thomson@12345";

// --- MQTT Configuration ---
const char* MQTT_BROKER   = "broker.hivemq.com";
const uint16_t MQTT_PORT  = 1883;
const char* MQTT_CLIENT_ID = "ESP32_AquaMonitor_01"; 

// --- MQTT Topics ---
const char* TOPIC_DATA   = "thomson_h2o/data";      // Publish sensor data here
const char* TOPIC_CMD    = "thomson_h2o/led/cmd";   // Subscribe to LED commands
const char* TOPIC_MOTOR_CMD = "aquamonitor/motor/command"; // Subscribe to motor commands

// --- Hardware Pins ---
const int TRIG_PIN = 14;  // GPIO14 (D14) - JSN-SR04T TRIG
const int ECHO_PIN = 27;  // GPIO27 (D27) - JSN-SR04T ECHO (through voltage divider)
const int LED_BUILTIN_PIN = 2;
const int LED_EXTERNAL_PIN = 22;

// --- Project Parameters ---
const int TANK_HEIGHT = 100;      // Total tank depth/distance from sensor to bottom (cm)
const int TRIG_PULSE_WIDTH = 10;  // 10 microseconds trigger pulse
const long TIMEOUT_US = 30000;    // 30ms timeout for pulseIn (max range ~5m)
const unsigned long SENSOR_DELAY = 5000; // Reporting interval (ms)

// ==========================================
// 2. OBJECT INITIALIZATION
// ==========================================

WiFiClient espClient;
PubSubClient mqttClient(espClient);
unsigned long lastReportingTime = 0;
unsigned long lastBlinkTime = 0;
unsigned long lastWiFiAttempt = 0;
bool motorState = false;

// ==========================================
// 3. FUNCTION MODULES
// ==========================================

/**
 * Function to read distance from JSN-SR04T
 */
float readDistance() {
    // Send 10µs trigger pulse
    digitalWrite(TRIG_PIN, LOW);
    delayMicroseconds(2);
    digitalWrite(TRIG_PIN, HIGH);
    delayMicroseconds(TRIG_PULSE_WIDTH);
    digitalWrite(TRIG_PIN, LOW);
    
    // Measure ECHO pulse duration
    long pulse_duration = pulseIn(ECHO_PIN, HIGH, TIMEOUT_US);
    
    if (pulse_duration == 0) {
        Serial.println("[Sensor] Warning: No echo received");
        return -1;
    }
    
    // Formula: distance (cm) = pulse_duration (µs) / 58
    float distance_cm = pulse_duration / 58.0;
    return distance_cm;
}

/**
 * Handles incoming MQTT messages
 */
void mqttCallback(char* topic, byte* payload, unsigned int length) {
    String message = "";
    for (int i = 0; i < length; i++) {
        message += (char)payload[i];
    }

    Serial.println("[MQTT] Message received [" + String(topic) + "]: " + message);

    // Handle LED Commands
    if (String(topic) == TOPIC_CMD) {
        if (message == "ON") {
            digitalWrite(LED_BUILTIN_PIN, HIGH);
            digitalWrite(LED_EXTERNAL_PIN, HIGH);
        } else if (message == "OFF") {
            digitalWrite(LED_BUILTIN_PIN, LOW);
            digitalWrite(LED_EXTERNAL_PIN, LOW);
        }
    } 
    // Handle Motor Commands
    else if (String(topic) == TOPIC_MOTOR_CMD) {
        if (message == "ON") {
            motorState = true;
            Serial.println("[Motor] Power ON");
        } else if (message == "OFF") {
            motorState = false;
            Serial.println("[Motor] Power OFF");
        }
    }
}

/**
 * Connects to WiFi with detailed Serial output
 */
void setupWiFi() {
    Serial.println("\n--- WiFi Setup ---");
    Serial.println("SSID: " + String(WIFI_SSID));
    
    WiFi.mode(WIFI_STA);
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

    int attempt = 0;
    while (WiFi.status() != WL_CONNECTED) {
        delay(500);
        Serial.print(".");
        // Blink LED while connecting
        digitalWrite(LED_BUILTIN_PIN, !digitalRead(LED_BUILTIN_PIN));
        
        attempt++;
        if (attempt > 40) { // ~20 seconds
            Serial.println("\n[WiFi] Connection timed out. Check SSID/Password or 2.4GHz settings.");
            attempt = 0;
            WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
        }
    }

    digitalWrite(LED_BUILTIN_PIN, LOW);
    Serial.println("\n[WiFi] Connected Successfully!");
    Serial.println("[WiFi] IP Address: " + WiFi.localIP().toString());
    Serial.println("------------------\n");
}

/**
 * Reconnects to MQTT broker
 */
void reconnectMQTT() {
    while (!mqttClient.connected()) {
        Serial.print("[MQTT] Connecting to broker " + String(MQTT_BROKER) + "...");
        String dynClientId = "AQUA-" + String(random(0xffff), HEX);
        
        if (mqttClient.connect(dynClientId.c_str())) {
            Serial.println("CONNECTED!");
            mqttClient.subscribe(TOPIC_CMD);
            mqttClient.subscribe(TOPIC_MOTOR_CMD);
        } else {
            Serial.print("FAILED (rc=");
            Serial.print(mqttClient.state());
            Serial.println(") Retrying in 5 seconds...");
            // Error states based on PubSubClient:
            // -2 : CONNECT_FAILED
            // -4 : CONNECTION_TIMEOUT
            delay(5000);
        }
    }
}

/**
 * Reads sensor and publishes JSON data
 */
void reportSensorData() {
    float distance = readDistance();
    
    if (distance < 0 || distance > 500) {
        return; // Skip invalid readings
    }

    // Convert distance to water level percentage
    // Water Level = Tank Height - Distance from sensor
    float waterLevelCm = TANK_HEIGHT - distance;
    if (waterLevelCm < 0) waterLevelCm = 0;
    if (waterLevelCm > TANK_HEIGHT) waterLevelCm = TANK_HEIGHT;
    
    int percentage = (int)((waterLevelCm / TANK_HEIGHT) * 100);

    // Create JSON Payload matching Dashboard expectations
    JsonDocument doc;
    doc["level"] = percentage;
    doc["distance_cm"] = distance;
    doc["motor"] = motorState ? "ON" : "OFF";
    doc["status"] = "online";

    char jsonBuffer[128];
    serializeJson(doc, jsonBuffer);

    if (mqttClient.publish(TOPIC_DATA, jsonBuffer)) {
        Serial.println("[MQTT] Published: " + String(jsonBuffer));
    } else {
        Serial.println("[MQTT] Publish failed");
    }
}

// ==========================================
// 4. MAIN SETUP & LOOP
// ==========================================

void setup() {
    Serial.begin(115200);
    delay(100);

    // Pin configurations
    pinMode(TRIG_PIN, OUTPUT);
    pinMode(ECHO_PIN, INPUT);
    pinMode(LED_BUILTIN_PIN, OUTPUT);
    pinMode(LED_EXTERNAL_PIN, OUTPUT);
    
    digitalWrite(TRIG_PIN, LOW);
    digitalWrite(LED_BUILTIN_PIN, LOW);
    digitalWrite(LED_EXTERNAL_PIN, LOW);

    setupWiFi();
    mqttClient.setServer(MQTT_BROKER, MQTT_PORT);
    mqttClient.setCallback(mqttCallback);
    
    Serial.println("\nAQUA Monitor Initialized");
}

void loop() {
    if (!mqttClient.connected()) {
        reconnectMQTT();
    }
    mqttClient.loop();

    // Check WiFi connection and attempt reconnection if disconnected for 5+ seconds
    static unsigned long lastWiFiCheck = 0;
    if (millis() - lastWiFiCheck >= 1000) {
        lastWiFiCheck = millis();
        if (WiFi.status() != WL_CONNECTED) {
            if (millis() - lastWiFiAttempt >= 5000) {
                lastWiFiAttempt = millis();
                Serial.println("[WiFi] Disconnected, attempting reconnection...");
                WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
            }
        } else {
            lastWiFiAttempt = millis();
        }
    }

    // Blink LED when connected to WiFi (hotspot), stop when disconnected
    if (WiFi.status() == WL_CONNECTED) {
        if (millis() - lastBlinkTime >= 500) {
            lastBlinkTime = millis();
            digitalWrite(LED_BUILTIN_PIN, !digitalRead(LED_BUILTIN_PIN));
        }
    } else {
        digitalWrite(LED_BUILTIN_PIN, LOW);
    }

    unsigned long currentMillis = millis();
    if (currentMillis - lastReportingTime >= SENSOR_DELAY) {
        lastReportingTime = currentMillis;
        reportSensorData();
    }
}


