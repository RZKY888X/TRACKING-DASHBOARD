// hooks/useMQTT.ts
'use client';

import { useEffect, useState } from 'react';
import { MQTTMessage } from '@/types';

interface UseMQTTOptions {
  brokerUrl?: string;
  topics?: string[];
  enabled?: boolean;
}

const MQTT_BROKER_URL = process.env.NEXT_PUBLIC_MQTT_BROKER_URL;

export function useMQTT(options: UseMQTTOptions = {}) {
  const [messages, setMessages] = useState<MQTTMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!options.enabled) return;

    // Ini adalah placeholder untuk MQTT client
    // Nanti install: npm install mqtt
    // import mqtt from 'mqtt';
    
    console.log('MQTT: Initializing connection...');
    
    // Simulasi koneksi
    const connectMQTT = () => {
      try {
        // const client = mqtt.connect(options.brokerUrl || MQTT_BROKER_URL);
        
        // client.on('connect', () => {
        //   console.log('MQTT: Connected');
        //   setIsConnected(true);
        //   
        //   if (options.topics) {
        //     options.topics.forEach(topic => {
        //       client.subscribe(topic, (err) => {
        //         if (err) {
        //           console.error('MQTT: Subscribe error', err);
        //         }
        //       });
        //     });
        //   }
        // });
        
        // client.on('message', (topic, payload) => {
        //   const message: MQTTMessage = {
        //     topic,
        //     payload: JSON.parse(payload.toString()),
        //     timestamp: Date.now()
        //   };
        //   setMessages(prev => [...prev, message]);
        // });
        
        // client.on('error', (err) => {
        //   console.error('MQTT: Error', err);
        //   setError(err.message);
        // });

        // Simulasi data untuk development
        const simulateInterval = setInterval(() => {
          const mockMessage: MQTTMessage = {
            topic: 'vehicle/position',
            payload: {
              vehicleId: 'B 9213 KA',
              lat: -6.2088 + (Math.random() - 0.5) * 0.1,
              lng: 106.8456 + (Math.random() - 0.5) * 0.1,
              speed: Math.floor(Math.random() * 30) + 40,
              timestamp: Date.now()
            },
            timestamp: Date.now()
          };
          setMessages(prev => [...prev.slice(-10), mockMessage]);
        }, 5000);

        setIsConnected(true);

        return () => {
          clearInterval(simulateInterval);
          // client.end();
        };
      } catch (err) {
        console.error('MQTT: Connection error', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      }
    };

    const cleanup = connectMQTT();

    return () => {
      if (cleanup) cleanup();
    };
  }, [options.enabled, options.brokerUrl, options.topics]);

  return { messages, isConnected, error };
}