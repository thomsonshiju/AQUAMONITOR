/*
 * AQUA Project - ESP32 Water Level Monitoring System
 * Sensor: JSN-SR04T (Ultrasonic) - Integrated with Pins 14/27
 * Connectivity: MQTT (HiveMQ)
 */

#include <ArduinoJson.h>
#include <PubSubClient.h>
#include <WiFi.h>

// ==========================================
// 1. CONFIGURATION SECTION
// ==========================================

// --- WiFi Configuration ---
const char *WIFI_SSID = "thomson";
const char *WIFI_PASSWORD = "Thomson@12345";

// --- MQTT Configuration ---
const char *MQTT_BROKER = "broker.hivemq.com";
const uint16_t MQTT_PORT = 1883;
const char *MQTT_CLIENT_ID = "ESP32_AquaMonitor_01";

// --- MQTT Topics ---
const char *TOPIC_DATA = "thomson_h2o/data";   // Publish sensor data here
const char *TOPIC_CMD = "thomson_h2o/led/cmd"; // Subscribe to LED commands
const char *TOPIC_MOTOR_CMD =
    "aquamonitor/motor/command"; // Subscribe to motor commands

// --- Hardware Pins ---
const int TRIG_PIN = 14; // GPIO14 (D14) - JSN-SR04T TRIG
const int ECHO_PIN =
    27; // GPIO27 (D27) - JSN-SR04T ECHO (through voltage divider)
const int LED_BUILTIN_PIN = 2;
const int LED_EXTERNAL_PIN = 22;
const int RELAY_PIN = 23; // GPIO23 for Motor / Water Pump Relay

// --- Project Parameters ---
const int TANK_HEIGHT =
    100; // Total tank depth/distance from sensor to bottom (cm)
const int TRIG_PULSE_WIDTH = 10; // 10 microseconds trigger pulse
const long TIMEOUT_US = 30000;   // 30ms timeout for pulseIn (max range ~5m)
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
float lastValidDistance = 0.0;
float simTemp = 24.5;
float simTurbidity = 500.0;

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
 * Forward declarations
 */
void reportSensorData();

/**
 * Handles incoming MQTT messages
 */
void mqttCallback(char *topic, byte *payload, unsigned int length) {
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
      digitalWrite(RELAY_PIN, HIGH); // Assuming HIGH = Relay ON
      Serial.println("[Motor] Power ON");
    } else if (message == "OFF") {
      motorState = false;
      digitalWrite(RELAY_PIN, LOW); // Assuming LOW = Relay OFF
      Serial.println("[Motor] Power OFF");
    }
    // Instantly publish updated state to reflect on the website immediately
    reportSensorData();
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
      Serial.println("\n[WiFi] Connection timed out. Check SSID/Password or "
                     "2.4GHz settings.");
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

  // Smooth/Fall-back distance reading to avoid UI glitches
  if (distance >= 0 && distance <= 500) {
    lastValidDistance = distance;
  } else {
    distance = lastValidDistance;
  }

  // Convert distance to water level percentage
  float waterLevelCm = TANK_HEIGHT - distance;
  if (waterLevelCm < 0)
    waterLevelCm = 0;
  if (waterLevelCm > TANK_HEIGHT)
    waterLevelCm = TANK_HEIGHT;

  int percentage = (int)((waterLevelCm / TANK_HEIGHT) * 100);

  // Simulate small fluctuations for secondary sensors to make Dashboard alive
  simTemp += ((random(0, 100) / 100.0) - 0.5) *
             0.2; // fluctuates slightly around current
  if (simTemp < 20.0)
    simTemp = 20.0;
  if (simTemp > 35.0)
    simTemp = 35.0;

  simTurbidity += ((random(0, 100) / 100.0) - 0.5) * 10.0;
  if (simTurbidity < 50.0)
    simTurbidity = 50.0;
  if (simTurbidity > 800.0)
    simTurbidity = 800.0;

  // Create JSON Payload matching Dashboard expectations
  JsonDocument doc;
  doc["level"] = percentage;
  doc["distance_cm"] = distance;
  doc["motor"] = motorState ? "ON" : "OFF";
  doc["status"] = "online";
  doc["temp"] = simTemp;
  doc["turbidity"] = simTurbidity;

  char jsonBuffer[200];
  serializeJson(doc, jsonBuffer);

  if (mqttClient.publish(TOPIC_DATA, jsonBuffer)) {
    Serial.println("[MQTT] Published: " + String(jsonBuffer));
  } else {
    Serial.println(
        "[MQTT] Publish failed (ensure payload fits in max buffer!)");
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
  pinMode(RELAY_PIN, OUTPUT); // Motor Relay setup

  digitalWrite(TRIG_PIN, LOW);
  digitalWrite(LED_BUILTIN_PIN, LOW);
  digitalWrite(LED_EXTERNAL_PIN, LOW);
  digitalWrite(RELAY_PIN, LOW); // Start with motor off

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

  // Check WiFi connection and attempt reconnection if disconnected for 5+
  // seconds
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
