// hooks/useLoRaWAN.ts
'use client';

import { useEffect, useState } from 'react';
import { LoRaWANPayload } from '@/types';

interface UseLoRaWANOptions {
  apiUrl?: string;
  apiKey?: string;
  enabled?: boolean;
}

const LORA_API_URL = process.env.NEXT_PUBLIC_LORA_API_URL;
const LORA_API_KEY = process.env.NEXT_PUBLIC_LORA_API_KEY;

export function useLoRaWAN(options: UseLoRaWANOptions = {}) {
  const [data, setData] = useState<LoRaWANPayload[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!options.enabled) return;

    console.log('LoRaWAN: Initializing connection...');

    // Ini adalah placeholder untuk LoRaWAN integration
    // Biasanya menggunakan ChirpStack atau The Things Network
    
    const connectLoRaWAN = async () => {
      try {
        // Contoh untuk ChirpStack:
        // const grpc = await import('@chirpstack/chirpstack-api-client');
        // const client = new grpc.ApplicationServiceClient(
        //   options.apiUrl || LORA_API_URL,
        //   options.apiKey || LORA_API_KEY
        // );
        
        // Setup event stream
        // const stream = client.stream({
        //   applicationId: 'your-app-id'
        // });
        
        // stream.on('data', (event) => {
        //   if (event.uplinkEvent) {
        //     const payload = parseLoRaWANPayload(event.uplinkEvent.data);
        //     setData(prev => [...prev.slice(-20), payload]);
        //   }
        // });

        // Simulasi data untuk development
        const simulateInterval = setInterval(() => {
          const mockPayload: LoRaWANPayload = {
            deviceId: `device_${Math.floor(Math.random() * 5) + 1}`,
            latitude: -6.2088 + (Math.random() - 0.5) * 0.2,
            longitude: 106.8456 + (Math.random() - 0.5) * 0.2,
            speed: Math.floor(Math.random() * 40) + 30,
            timestamp: Date.now(),
            batteryLevel: Math.floor(Math.random() * 30) + 70
          };
          setData(prev => [...prev.slice(-20), mockPayload]);
        }, 10000);

        setIsConnected(true);

        return () => {
          clearInterval(simulateInterval);
        };
      } catch (err) {
        console.error('LoRaWAN: Connection error', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      }
    };

    const cleanup = connectLoRaWAN();

    return () => {
      cleanup.then(fn => fn && fn());
    };
  }, [options.enabled, options.apiUrl, options.apiKey]);

  // Helper function to parse LoRaWAN payload
  const parseLoRaWANPayload = (hexData: string): LoRaWANPayload => {
    // Parse hex string ke data
    // Format: LLLLLLLL OOOOOOOO SSSS BB
    // L = Latitude (4 bytes), O = Longitude (4 bytes), S = Speed (2 bytes), B = Battery (1 byte)
    
    const buffer = Buffer.from(hexData, 'hex');
    
    return {
      deviceId: 'device_1',
      latitude: buffer.readInt32BE(0) / 1000000,
      longitude: buffer.readInt32BE(4) / 1000000,
      speed: buffer.readUInt16BE(8),
      timestamp: Date.now(),
      batteryLevel: buffer.readUInt8(10)
    };
  };

  return { data, isConnected, error, parseLoRaWANPayload };
}   