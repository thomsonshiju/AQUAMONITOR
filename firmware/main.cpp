#include <PubSubClient.h>
#include <WiFi.h>

// --- WiFi Credentials ---
const char *ssid = "thomson";
const char *password = "Thomson@12345";

// --- MQTT Broker Details ---
// Using HiveMQ public broker as configured in your Dashboard
const char *mqtt_server = "broker.hivemq.com";
const int mqtt_port = 1883;
// const char *mqtt_user = "";
// const char *mqtt_pass = "";

// --- Topics ---
const char *topic_led_command = "thomson_h2o/led/cmd";
const char *topic_status = "thomson_h2o/data";

// --- Pin Definitions ---
// Uses Built-in LED. Adjust if your board is different (e.g. Pin 2 or 4)
#define LED_PIN 2
#define LED_PIN_2 22

WiFiClient espClient;
PubSubClient client(espClient);

void setup_wifi() {
  delay(10);
  Serial.println();
  Serial.print("Connecting to ");
  Serial.println(ssid);

  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("");
  Serial.println("WiFi connected");
  Serial.print("IP address: ");
  Serial.println(WiFi.localIP());
}

void callback(char *topic, byte *payload, unsigned int length) {
  String message;
  for (int i = 0; i < length; i++) {
    message += (char)payload[i];
  }

  Serial.print("Message arrived [");
  Serial.print(topic);
  Serial.print("]Payload: ");
  Serial.println(message);

  if (String(topic) == topic_led_command) {
    if (message == "ON") {
      digitalWrite(LED_PIN, HIGH);
      digitalWrite(LED_PIN_2, HIGH);
      Serial.println("LEDs turned ON");
    } else if (message == "OFF") {
      digitalWrite(LED_PIN, LOW);
      digitalWrite(LED_PIN_2, LOW);
      Serial.println("LEDs turned OFF");
    } else if (message == "BLINK") {
      // Quick blink feedback
      for (int i = 0; i < 5; i++) {
        digitalWrite(LED_PIN, HIGH);
        digitalWrite(LED_PIN_2, HIGH);
        delay(100);
        digitalWrite(LED_PIN, LOW);
        digitalWrite(LED_PIN_2, LOW);
        delay(100);
      }
    }
  }
}

void reconnect() {
  while (!client.connected()) {
    Serial.print("Attempting MQTT connection...");
    String clientId = "ESP32Client-";
    clientId += String(random(0xffff), HEX);

    if (client.connect(clientId.c_str())) {
      Serial.println("connected");
      // Subscribe
      client.subscribe(topic_led_command);
    } else {
      Serial.print("failed, rc=");
      Serial.print(client.state());
      Serial.println(" try again in 5 seconds");
      delay(5000);
    }
  }
}

void setup() {
  pinMode(LED_PIN, OUTPUT);
  pinMode(LED_PIN_2, OUTPUT);   // Set Pin 22 as output
  digitalWrite(LED_PIN, LOW);   // Start OFF
  digitalWrite(LED_PIN_2, LOW); // Start OFF

  Serial.begin(115200);
  setup_wifi();

  client.setServer(mqtt_server, mqtt_port);
  client.setCallback(callback);
}

void loop() {
  if (!client.connected()) {
    reconnect();
  }
  client.loop();
}
