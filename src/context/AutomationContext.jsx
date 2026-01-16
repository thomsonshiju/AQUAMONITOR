import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../firebaseConfig';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { useAuth } from './AuthContext';

import mqtt from 'mqtt';
import { MQTT_CONFIG } from '../mqttConfig';

const AutomationContext = createContext(null);

export const AutomationProvider = ({ children }) => {
    const { user } = useAuth();
    const [settings, setSettings] = useState({
        minLevel: 20,
        maxLevel: 90,
        mode: 'auto',
        scheduleEnabled: true,
        startTime: '06:00',
        endTime: '18:00',
        lastUpdated: null
    });
    const [loading, setLoading] = useState(true);

    // MQTT Client for broadcasting settings
    const [mqttClient, setMqttClient] = useState(null);

    useEffect(() => {
        if (!user) return;

        const protocol = 'wss';
        const path = '/mqtt';
        const url = `${protocol}://${MQTT_CONFIG.hostname}:${MQTT_CONFIG.port}${path}`;

        console.log(`AutomationContext connecting to MQTT at ${url}`);

        const client = mqtt.connect(url, {
            username: MQTT_CONFIG.username,
            password: MQTT_CONFIG.password,
            clientId: `web_client_${Math.random().toString(16).slice(2, 8)}`,
            keepalive: 60,
            reconnectPeriod: 2000
        });

        client.on('connect', () => {
            console.log("MQTT connected in AutomationContext");
            setMqttClient(client);
        });

        return () => client.end();
    }, [user]);

    useEffect(() => {
        if (!user) {
            setLoading(false);
            return;
        }

        const settingsDocRef = doc(db, 'users', user.uid, 'settings', 'automation');

        // Use onSnapshot for real-time updates across devices
        const unsubscribe = onSnapshot(settingsDocRef, (docSnap) => {
            if (docSnap.exists()) {
                setSettings(docSnap.data());
            } else {
                // Initialize if doesn't exist
                const initialSettings = {
                    minLevel: 20,
                    maxLevel: 90,
                    mode: 'auto',
                    scheduleEnabled: true,
                    startTime: '06:00',
                    endTime: '18:00',
                    lastUpdated: new Date()
                };
                setDoc(settingsDocRef, initialSettings);
                setSettings(initialSettings);
            }
            setLoading(false);
        }, (error) => {
            console.error("Error fetching automation settings:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    const updateSettings = async (newSettings) => {
        if (!user) return { success: false, error: 'User not authenticated' };

        try {
            const settingsDocRef = doc(db, 'users', user.uid, 'settings', 'automation');
            const dataToSave = {
                ...newSettings,
                lastUpdated: new Date()
            };

            // 1. Save to Firestore
            await setDoc(settingsDocRef, dataToSave);

            // 2. Broadcast to ESP32 via MQTT if connected
            if (mqttClient && mqttClient.connected) {
                mqttClient.publish('aquamonitor/settings/config', JSON.stringify(newSettings), { qos: 1 });
                console.log("Settings published to MQTT");
            }

            return { success: true };
        } catch (error) {
            console.error("Error saving automation settings:", error);
            return { success: false, error: error.message };
        }
    };

    return (
        <AutomationContext.Provider value={{ settings, updateSettings, loading }}>
            {children}
        </AutomationContext.Provider>
    );
};

export const useAutomation = () => useContext(AutomationContext);
