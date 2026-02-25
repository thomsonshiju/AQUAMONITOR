/*
 * AQUA Project - ESP32 Water Level Monitoring System
 * Sensor: 10-Contact Discrete Level Probes (D15, D2, D4, D5, D18, D19, D22,
 * D23, D12, D14) Connectivity: MQTT (HiveMQ)
 */

#include <ArduinoJson.h>
#include <Preferences.h>
#include <PubSubClient.h>
#include <WiFi.h>
#include <WiFiClientSecure.h>
// ==========================================
// 1. CONFIGURATION SECTION
// ==========================================

// --- WiFi Configuration ---
const char *WIFI_SSID = "nthing";
const char *WIFI_PASSWORD = "killratgang";

// --- MQTT Configuration ---
const char *MQTT_BROKER = "177dbd1b53e648648166636cd93913a1.s1.eu.hivemq.cloud";
const uint16_t MQTT_PORT = 8883;
const char *MQTT_CLIENT_ID = "ESP32_AquaMonitor_01";
const char *MQTT_USER = "thomsonmqtt";
const char *MQTT_PASS = "Thomson123";

// --- MQTT Topics ---
const char *TOPIC_DATA = "thomson_h2o/data";   // Publish sensor data here
const char *TOPIC_CMD = "thomson_h2o/led/cmd"; // Subscribe to LED commands
const char *TOPIC_MOTOR_CMD =
    "aquamonitor/motor/command"; // Subscribe to motor commands
const char *TOPIC_CONFIG_CMD =
    "aquamonitor/settings/config"; // Subscribe to automation config

// --- Hardware Pins ---
// Level Sensor Contacts (Ground-triggered via INPUT_PULLUP)
const int LEVEL_PINS[] = {15, 4, 5, 18, 19, 21, 23, 13, 12, 14};
const int LEVEL_PCTS[] = {10, 20, 30, 40, 50, 60, 70, 80, 90, 100};
const int NUM_LEVELS = 10;

// NOTE: GPIO 2 and GPIO 22 are no longer used.
// GPIO 21 is now a level sensor (60%). Indicator LED moved to GPIO17.
const int LED_INDICATOR_PIN = 17; // GPIO17 - Status LED
const int LED_EXTERNAL_PIN = 27;  // GPIO27 - MQTT-commanded external LED

// --- BTS7960 Motor Driver Pins ---
const int MOTOR_RPWM_PIN = 25; // Forward control (ON/OFF)
const int MOTOR_LPWM_PIN = 26; // Reverse control (Always LOW)
const int MOTOR_R_EN_PIN = 32; // Right Enable
const int MOTOR_L_EN_PIN = 33; // Left Enable

// --- Project Parameters ---
const unsigned long SENSOR_DELAY = 2000; // Reporting interval (ms)

// ==========================================
// 2. OBJECT INITIALIZATION
// ==========================================

WiFiClientSecure espClient;
PubSubClient mqttClient(espClient);
Preferences preferences;

unsigned long lastReportingTime = 0;
unsigned long lastWiFiAttempt = 0;
bool motorState = false;
int autoTurnOnLevel = 20;  // Motor turns ON when level drops to or below this %
int autoTurnOffLevel = 90; // Motor turns OFF when level reaches this %
String autoMode = "auto";
float simTemp = 24.5;
float simTurbidity = 500.0;

// ==========================================
// 3. FUNCTION MODULES
// ==========================================

/**
 * Function to read current water level percentage from contact pins.
 * Scans bottom-up (10% -> 100%) and stops at the first gap.
 * Water rises continuously, so if 20% is submerged, 10% must be too.
 * A gap (ungrounded pin below a grounded one) is treated as a fault — we
 * report only the last confirmed consecutive level.
 */
int readWaterLevelPercentage() {
  int detectedLevel = 0;
  for (int i = 0; i < NUM_LEVELS; i++) {
    if (digitalRead(LEVEL_PINS[i]) == LOW) {
      // This probe is submerged — advance the confirmed level
      detectedLevel = LEVEL_PCTS[i];
    } else {
      // Gap found — water hasn't reached this probe, stop here
      break;
    }
  }
  return detectedLevel;
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
      digitalWrite(LED_INDICATOR_PIN, HIGH);
      digitalWrite(LED_EXTERNAL_PIN, HIGH);
    } else if (message == "OFF") {
      digitalWrite(LED_INDICATOR_PIN, LOW);
      digitalWrite(LED_EXTERNAL_PIN, LOW);
    }
  }
  // Handle Motor Commands
  else if (String(topic) == TOPIC_MOTOR_CMD) {
    if (message == "ON") {
      motorState = true;
      analogWrite(MOTOR_RPWM_PIN,
                  127); // 127 out of 255 is ~50% duty cycle (Half Speed)
      Serial.println("[Motor] Power ON (Half Speed)");
    } else if (message == "OFF") {
      motorState = false;
      analogWrite(MOTOR_RPWM_PIN, 0); // 0 duty cycle (OFF)
      Serial.println("[Motor] Power OFF");
    }
    // Instantly publish updated state
    reportSensorData();
  }
  // Handle Automation Config
  else if (String(topic) == TOPIC_CONFIG_CMD) {
    JsonDocument configDoc;
    DeserializationError error = deserializeJson(configDoc, message);
    if (!error) {
      if (configDoc.containsKey("turnOnLevel"))
        autoTurnOnLevel = configDoc["turnOnLevel"];
      if (configDoc.containsKey("turnOffLevel"))
        autoTurnOffLevel = configDoc["turnOffLevel"];
      if (configDoc.containsKey("mode"))
        autoMode = configDoc["mode"].as<String>();

      preferences.putInt("turnOnLevel", autoTurnOnLevel);
      preferences.putInt("turnOffLevel", autoTurnOffLevel);
      preferences.putString("mode", autoMode);

      Serial.println("[Config] Saved: Mode=" + autoMode +
                     " OnLevel=" + String(autoTurnOnLevel) +
                     "% OffLevel=" + String(autoTurnOffLevel) + "%");

      reportSensorData();
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
    // Blink indicator LED while connecting (GPIO21, not GPIO2)
    digitalWrite(LED_INDICATOR_PIN, !digitalRead(LED_INDICATOR_PIN));

    attempt++;
    if (attempt > 40) { // ~20 seconds
      Serial.println("\n[WiFi] Connection timed out. Check SSID/Password or "
                     "2.4GHz settings.");
      attempt = 0;
      WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
    }
  }

  digitalWrite(LED_INDICATOR_PIN, HIGH); // Solid ON = connected
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

    if (mqttClient.connect(dynClientId.c_str(), MQTT_USER, MQTT_PASS)) {
      Serial.println("CONNECTED!");
      mqttClient.subscribe(TOPIC_CMD);
      mqttClient.subscribe(TOPIC_MOTOR_CMD);
      mqttClient.subscribe(TOPIC_CONFIG_CMD);
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
  int levelPct = readWaterLevelPercentage();

  Serial.println("[Sensor] Level: " + String(levelPct) + "%");

  // --- AUTOMATION ENGINE ---
  if (autoMode == "auto") {
    // Motor turns ON if level drops to or below the low threshold
    if (levelPct <= autoTurnOnLevel && !motorState) {
      motorState = true;
      analogWrite(MOTOR_RPWM_PIN, 127);
      Serial.println("[Auto] Motor ON - Level " + String(levelPct) +
                     "% <= " + String(autoTurnOnLevel) + "%");
    }
    // Motor turns OFF when level reaches the high threshold
    else if (levelPct >= autoTurnOffLevel && motorState) {
      motorState = false;
      analogWrite(MOTOR_RPWM_PIN, 0);
      Serial.println("[Auto] Motor OFF - Level " + String(levelPct) +
                     "% >= " + String(autoTurnOffLevel) + "%");
    }
  }
  // -------------------------

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

  // Create JSON Payload
  JsonDocument doc;
  doc["level"] = levelPct;
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

  // Load automation preferences from ESP32 Flash Memory
  preferences.begin("aqua", false);
  autoTurnOnLevel = preferences.getInt("turnOnLevel", 20);
  autoTurnOffLevel = preferences.getInt("turnOffLevel", 90);
  autoMode = preferences.getString("mode", "auto");
  Serial.println("\n[Config] Loaded: Mode=" + autoMode +
                 " OnLevel=" + String(autoTurnOnLevel) +
                 "% OffLevel=" + String(autoTurnOffLevel) + "%");

  // Pin configurations
  for (int i = 0; i < NUM_LEVELS; i++) {
    pinMode(LEVEL_PINS[i], INPUT_PULLUP);
  }
  pinMode(LED_INDICATOR_PIN, OUTPUT);
  pinMode(LED_EXTERNAL_PIN, OUTPUT);
  pinMode(MOTOR_RPWM_PIN, OUTPUT);
  pinMode(MOTOR_LPWM_PIN, OUTPUT);
  pinMode(MOTOR_R_EN_PIN, OUTPUT);
  pinMode(MOTOR_L_EN_PIN, OUTPUT);

  // Initial Pin States
  digitalWrite(LED_INDICATOR_PIN, LOW);
  digitalWrite(LED_EXTERNAL_PIN, LOW);

  // Initialize BTS7960 state
  digitalWrite(MOTOR_RPWM_PIN, LOW);  // Motor OFF initially
  digitalWrite(MOTOR_LPWM_PIN, LOW);  // Never reverse
  digitalWrite(MOTOR_R_EN_PIN, HIGH); // Enable right (forward) driving
  digitalWrite(MOTOR_L_EN_PIN, HIGH); // Enable left (reverse) driving

  setupWiFi();

  // Configure secure client for TLS connection
  espClient.setInsecure(); // Disable certificate verification

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

  // Indicator LED: Solid ON when connected, OFF when disconnected
  // (GPIO2 is now a level sensor probe — no blinking on that pin)
  if (WiFi.status() == WL_CONNECTED) {
    digitalWrite(LED_INDICATOR_PIN, HIGH);
  } else {
    digitalWrite(LED_INDICATOR_PIN, LOW);
  }

  unsigned long currentMillis = millis();
  if (currentMillis - lastReportingTime >= SENSOR_DELAY) {
    lastReportingTime = currentMillis;
    reportSensorData();
  }
}
