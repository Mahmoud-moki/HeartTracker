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
  const [lowHeartLogs, setLowHeartLogs] = useState<DeviceLog[]>([]);

  const [heartRate, setHeartRate] = useState<number | null>(null);
  const [spo2, setSpo2] = useState<number | null>(null);

  const isLowHeartRate = heartRate !== null && heartRate < 60;

  const connectBluetooth = async () => {
    try {
      console.log("🔵 Step 1: Checking browser support...");

      if (!(navigator as any).bluetooth) {
        alert("Bluetooth not supported in this browser");
        return;
      }

      console.log("🔵 Step 2: Requesting device...");

      const device = await (navigator as any).bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: [
          "c18d85f8-7801-41f8-b392-610c23cdc0fe", // IMPORTANT FIX
        ],
      });

      console.log("✅ Device selected:", device.name);

      setDeviceName(device.name || "Unknown Device");

      device.addEventListener("gattserverdisconnected", () => {
        console.warn("⚠️ Device disconnected");
        setConnected(false);
      });

      console.log("🔵 Step 3: Connecting to GATT...");

      const server = await device.gatt.connect();

      console.log("✅ GATT connected");

      setConnected(true);

      console.log("🔵 Step 4: Getting service...");

      const service = await server.getPrimaryService(
        "c18d85f8-7801-41f8-b392-610c23cdc0fe",
      );

      console.log("✅ Service found");

      console.log("🔵 Step 5: Getting characteristic...");

      const characteristic = await service.getCharacteristic(
        "f3c50892-9a0d-4f0c-b87e-6e5ae3abe63c",
      );

      console.log("✅ Characteristic found");

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

            if (hr === 0 && sp === 0) return;
            if (hr < 40 || hr > 200) return;
            if (sp < 80 || sp > 100) return;

            setHeartRate(hr);
            setSpo2(sp);

            // 🔴 LOW HEART RATE LIST
            if (hr < 60) {
              setLowHeartLogs((prev) => [
                { value: text, timestamp: Date.now() },
                ...prev,
              ]);
            }
          }

          setLogs((prev) => [{ value: text, timestamp: Date.now() }, ...prev]);
        },
      );

      console.log("🔵 Step 6: Starting notifications...");

      await characteristic.startNotifications();

      console.log("🎉 READY: Listening for ESP32 data");
    } catch (err) {
      console.error("❌ Bluetooth FULL ERROR:", err);
      setConnected(false);
    }
  };

  return (
    <>
      <TopNav />

      <div className="min-h-screen bg-gray-100 flex flex-col items-center p-6 gap-6">
        {/* CONNECT */}
        <button
          onClick={connectBluetooth}
          className="px-6 py-3 rounded-xl text-white font-semibold bg-blue-600 hover:bg-blue-700 transition"
        >
          {connected ? "Connected" : "Connect ESP32"}
        </button>

        {/* CIRCLES */}
        <div className="flex gap-8">
          <Circle
            value={heartRate}
            label="Heart Rate ❤️"
            color={isLowHeartRate ? "#ef4444" : "#22c55e"}
            max={180}
          />
          <Circle value={spo2} label="SpO₂ 🫁" color="#22c55e" max={100} />
        </div>

        {/* DEVICE */}
        <div className="w-full max-w-md bg-white shadow-lg rounded-2xl p-5">
          <h2 className="text-lg font-bold text-black">Device Status</h2>
          <p className="text-sm text-gray-500">
            {connected ? `Connected to ${deviceName}` : "Not connected"}
          </p>
        </div>

        {/* ALL LOGS */}
        <div className="w-full max-w-md bg-white shadow-lg rounded-2xl p-5">
          <h2 className="text-lg font-bold text-black mb-3">Live ESP32 Data</h2>

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {logs.length === 0 ? (
              <p className="text-gray-400 text-sm">Waiting for data...</p>
            ) : (
              logs.map((log, i) => (
                <div
                  key={i}
                  className="bg-gray-100 p-2 rounded-lg text-sm font-mono"
                >
                  <div className="text-black">{log.value}</div>
                  <div className="text-xs text-gray-500">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* LOW HEART RATE ALERTS */}
        <div className="w-full max-w-md bg-white shadow-lg rounded-2xl p-5 border border-red-200">
          <h2 className="text-lg font-bold text-red-600 mb-3">
            ⚠️ Low Heart Rate (&lt; 60)
          </h2>

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {lowHeartLogs.length === 0 ? (
              <p className="text-gray-400 text-sm">No alerts</p>
            ) : (
              lowHeartLogs.map((log, i) => (
                <div
                  key={i}
                  className="bg-red-100 p-2 rounded-lg text-sm font-mono"
                >
                  <div className="text-black">{log.value}</div>
                  <div className="text-xs text-gray-500">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
}
