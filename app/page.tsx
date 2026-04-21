"use client";

import React, { useState } from "react";
import { TopNav } from "./TopNav";

type DeviceLog = {
  value: string;
  timestamp: number;
};

// 🔵 Circle Component
const Circle = ({
  value,
  label,
  color,
  max = 100,
}: {
  value: number | null;
  label: string;
  color: string;
  max?: number;
}) => {
  const size = 120;
  const stroke = 8;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  const progress = value !== null ? value / max : 0;
  const offset = circumference - progress * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size}>
          <circle
            stroke="#e5e7eb"
            fill="transparent"
            strokeWidth={stroke}
            r={radius}
            cx={size / 2}
            cy={size / 2}
          />

          <circle
            stroke={color}
            fill="transparent"
            strokeWidth={stroke}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            r={radius}
            cx={size / 2}
            cy={size / 2}
            style={{ transition: "stroke-dashoffset 0.4s ease" }}
          />
        </svg>

        <div className="absolute inset-0 flex items-center justify-center text-2xl font-bold text-black">
          {value ?? "--"}
        </div>
      </div>

      <span className="mt-2 text-sm text-black">{label}</span>
    </div>
  );
};

export default function Page() {
  const [connected, setConnected] = useState(false);
  const [deviceName, setDeviceName] = useState("");
  const [logs, setLogs] = useState<DeviceLog[]>([]);

  const [heartRate, setHeartRate] = useState<number | null>(null);
  const [spo2, setSpo2] = useState<number | null>(null);

  const isLowHeartRate = heartRate !== null && heartRate < 60;

  const connectBluetooth = async () => {
    try {
      if (!navigator.bluetooth) {
        alert("Bluetooth not supported in this browser");
        return;
      }

      console.log("🔵 Requesting device...");

      const device = await navigator.bluetooth.requestDevice({
        filters: [{ services: ["c18d85f8-7801-41f8-b392-610c23cdc0fe"] }],
        optionalServices: ["c18d85f8-7801-41f8-b392-610c23cdc0fe"],
      });

      setDeviceName(device.name || "Unknown Device");

      device.addEventListener("gattserverdisconnected", () => {
        console.warn("⚠️ Device disconnected");
        setConnected(false);
      });

      const server = await device.gatt.connect();
      setConnected(true);

      const service = await server.getPrimaryService(
        "c18d85f8-7801-41f8-b392-610c23cdc0fe",
      );

      const characteristic = await service.getCharacteristic(
        "f3c50892-9a0d-4f0c-b87e-6e5ae3abe63c",
      );

      characteristic.addEventListener(
        "characteristicvaluechanged",
        (event: any) => {
          const value: DataView = event.target.value;
          const text = new TextDecoder().decode(value);

          console.log("📡 RAW DATA:", text);

          const match = text.match(/(\d+).*?(\d+)/);

          if (match) {
            const hr = parseInt(match[1]);
            const sp = parseInt(match[2]);

            console.log("❤️ HR:", hr, "🫁 SpO2:", sp);

            // ❌ Ignore invalid readings
            if (hr === 0 && sp === 0) return;
            if (hr < 40 || hr > 200) return;
            if (sp < 80 || sp > 100) return;

            setHeartRate(hr);
            setSpo2(sp);
          }

          setLogs((prev) => [{ value: text, timestamp: Date.now() }, ...prev]);
        },
      );

      await characteristic.startNotifications();
    } catch (err) {
      console.error("❌ Bluetooth error:", err);
      setConnected(false);
    }
  };

  return (
    <>
      <TopNav />

      <div className="min-h-screen bg-gray-100 flex flex-col items-center p-6 gap-6">
        {/* Connect */}
        <button
          onClick={connectBluetooth}
          className="px-6 py-3 rounded-xl text-white font-semibold bg-blue-600 hover:bg-blue-700 transition"
        >
          {connected ? "Connected" : "Connect ESP32"}
        </button>

        {/* Circles */}
        <div className="flex gap-8">
          <Circle
            value={heartRate}
            label="Heart Rate ❤️"
            color={isLowHeartRate ? "#ef4444" : "#22c55e"}
            max={180}
          />
          <Circle value={spo2} label="SpO₂ 🫁" color="#22c55e" max={100} />
        </div>

        {/* Device */}
        <div className="w-full max-w-md bg-white shadow-lg rounded-2xl p-5">
          <h2 className="text-lg font-bold">Device Status</h2>

          <p className="text-sm text-gray-500">
            {connected ? `Connected to ${deviceName}` : "Not connected"}
          </p>
        </div>

        {/* Logs */}
        <div className="w-full max-w-md bg-white shadow-lg rounded-2xl p-5">
          <h2 className="text-lg font-bold mb-3">Live ESP32 Data</h2>

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {logs.length === 0 ? (
              <p className="text-gray-400 text-sm">Waiting for data...</p>
            ) : (
              logs.map((log, i) => {
                const match = log.value.match(/(\d+).*?(\d+)/);
                const hr = match ? parseInt(match[1]) : null;
                const isLow = hr !== null && hr < 60;

                return (
                  <div
                    key={i}
                    className={`p-2 rounded-lg text-sm font-mono transition ${
                      isLow ? "bg-red-100" : "bg-gray-100"
                    }`}
                  >
                    <div className="text-black">{log.value}</div>
                    <div className="text-xs text-gray-500">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </>
  );
}
