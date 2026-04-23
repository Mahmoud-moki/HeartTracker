"use client";

import React, { useState } from "react";
import { TopNav } from "./TopNav";
import { Bubbles } from "lucide-react";
import GradientButton from "./_components/button";

type DeviceLog = {
  value: string;
  timestamp: number;
};

// 🔵 Circle Component (FIXED: label is ReactNode)
const Circle = ({
  value,
  label,
  color,
  max = 100,
}: {
  value: number | null;
  label: React.ReactNode;
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
  const [alerts, setAlerts] = useState<
    { type: "hr" | "spo2"; value: string; timestamp: number }[]
  >([]);

  const [heartRate, setHeartRate] = useState<number | null>(null);
  const [spo2, setSpo2] = useState<number | null>(null);

  const isLowHR = heartRate !== null && heartRate < 60;
  const isLowSpO2 = spo2 !== null && spo2 < 90;

  const connectBluetooth = async () => {
    try {
      if (!(navigator as any).bluetooth) {
        alert("Bluetooth not supported in this browser");
        return;
      }

      console.log("🔵 Requesting device...");

      const device = await (navigator as any).bluetooth.requestDevice({
        acceptAllDevices: true,
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

          const match = text.match(/(\d+).*?(\d+)/);

          if (match) {
            const hr = parseInt(match[1]);
            const sp = parseInt(match[2]);

            if (hr === 0 && sp === 0) return;
            if (hr < 40 || hr > 200) return; // allow realistic max values
            if (sp < 80 || sp > 100) return;

            setHeartRate(hr);
            setSpo2(sp);
            if (hr < 60 || hr > 130 || sp < 90) {
              setAlerts((prev) => [
                {
                  type: hr < 60 || hr > 130 ? "hr" : "spo2",
                  value:
                    hr < 60
                      ? `Heart Rate is low: ${hr}`
                      : hr > 130
                        ? `⚠️ Heart Rate is HIGH: ${hr}`
                        : `SpO₂ is low: ${sp}`,
                  timestamp: Date.now(),
                },
                ...prev,
              ]);
            }
          }

          setLogs((prev) => [{ value: text, timestamp: Date.now() }, ...prev]);
        },
      );

      await characteristic.startNotifications();

      console.log("🎉 Listening...");
    } catch (err) {
      console.error("❌ Bluetooth error:", err);
      setConnected(false);
    }
  };

  const layers = [
    { delay: "0s", duration: "25s" },
    { delay: "0.15s", duration: "15.9s" },
    { delay: "0.53s", duration: "26.4s" },
    { delay: "0.45s", duration: "17.8s" },
    { delay: "1.6s", duration: "19.2s" },
    { delay: "1.6s", duration: "29.2s" },
    { delay: "1.6s", duration: "20.2s" },
  ];

  return (
    <>
      <TopNav />

      <div className="min-h-screen bg-gray-100 flex flex-col items-center p-6 gap-6">
        {/* CONNECT */}
        <button
          onClick={connectBluetooth}
          className="px-6 py-3 rounded-xl text-white font-semibold bg-blue-600 hover:bg-blue-700"
        >
          {connected ? "Connected" : "Connect ESP32"}
        </button>

        {/* CIRCLES */}
        <div className="flex gap-8 font-bold">
          <Circle
            value={heartRate}
            label="Heart Rate ❤️"
            color={isLowHR ? "#ef4444" : "#22c55e"}
            max={180}
          />

          {/* ✅ FIXED ICON USAGE */}
          <Circle
            value={spo2}
            label={
              <div className="flex font-bold items-center gap-1">
                <span>SpO₂</span>
                <Bubbles className="w-4 h-4 text-blue-500" />
              </div>
            }
            color={isLowSpO2 ? "#ef4444" : "#22c55e"}
            max={100}
          />
        </div>
        {/* DEVICE */}
        <div className="w-full max-w-md bg-white shadow-lg rounded-2xl p-5">
          <h2 className="text-lg text-black font-bold">Device Status</h2>
          <p className="text-sm text-gray-500">
            {connected ? `Connected to ${deviceName}` : "Not connected"}
          </p>
        </div>
        {/* LOGS */}
        <div className="w-full max-w-md bg-white shadow-lg rounded-2xl p-5">
          <h2 className="text-lg text-black font-bold mb-3">Live Data</h2>

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {logs.length === 0 ? (
              <p className="text-gray-400 text-sm">Waiting for data...</p>
            ) : (
              logs.map((log, i) => (
                <div key={i} className="bg-gray-100 p-2 rounded-lg text-sm">
                  <div>{log.value}</div>
                  <div className="text-xs text-black">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        {/* 🚨 ALERTS */}
        <div className="w-full max-w-md bg-white shadow-lg rounded-2xl p-5">
          <h2 className="text-lg font-bold mb-3 text-red-600">
            ⚠️ Health Alerts
          </h2>

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {alerts.length === 0 ? (
              <p className="text-gray-400 text-sm">No alerts</p>
            ) : (
              alerts.map((a, i) => {
                const isHR = a.type === "hr";

                return (
                  <div
                    key={i}
                    className={`p-2 rounded-lg text-sm font-medium border ${
                      isHR
                        ? "bg-red-100 border-red-400 text-red-700"
                        : "bg-blue-100 border-blue-400 text-blue-700"
                    }`}
                  >
                    {a.value}
                    <div className="text-xs text-gray-500">
                      {new Date(a.timestamp).toLocaleTimeString()}
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
