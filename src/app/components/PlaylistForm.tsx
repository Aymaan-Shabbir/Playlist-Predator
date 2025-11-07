/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useState } from "react";
import { PlaylistInfo } from "@/app/types/playlistInfo";
import { Loader2 } from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const PlaylistForm = () => {
  const [playlistUrl, setPlaylistUrl] = useState<string>("");
  const [completedVideos, setCompletedVideos] = useState<number>(0);
  const [result, setResult] = useState<PlaylistInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);
    setLoading(true);

    try {
      const res = await fetch("/api/calculate-duration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playlistUrl, completedVideos }),
      });

      const data = await res.json();

      if (res.ok) {
        setResult(data.playlistInfo as PlaylistInfo);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getSpeedColor = (speed: number) => {
    if (speed === 1) return "#4CAF50";
    if (speed === 1.25) return "#FF9800";
    if (speed === 1.5) return "#FF5722";
    if (speed === 1.75) return "#2196F3";
    return "#9C27B0";
  };

  // Helper to convert time string to seconds
  const parseDuration = (timeStr: string) => {
    const parts = timeStr.split(":").map(Number);
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    return parts[0];
  };

  return (
    <div className="max-w-lg mx-auto">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Playlist URL Input */}
        <input
          type="text"
          value={playlistUrl}
          onChange={(e) => setPlaylistUrl(e.target.value)}
          placeholder="Enter YouTube Playlist URL"
          className="w-full p-3 border border-gray-300 dark:border-gray-700 dark:bg-gray-800 
          dark:text-white text-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 
          focus:border-transparent transition duration-200 ease-in-out"
          required
        />

        {/* Completed Videos Input */}
        {/* Completed Videos Input */}
        <input
          type="number"
          min="0"
          value={completedVideos === 0 ? "" : completedVideos}
          onChange={(e) => {
            const value = e.target.value ? Number(e.target.value) : 0;
            if (result && value > result.totalVideos) {
              setError(
                "You piece of sh!t , you've already finished all the videos!"
              );
            } else {
              setError(null);
            }
            setCompletedVideos(value);
          }}
          placeholder="Enter number of videos completed"
          className="w-full p-3 border border-gray-300 rounded-lg 
  text-gray-800 placeholder-gray-500 
  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent 
  dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400 
  transition duration-200 ease-in-out"
        />

        {/* Error Message */}

        {/* Submit Button */}
        <button
          type="submit"
          className="w-full p-3 text-white bg-blue-600 rounded-lg hover:bg-blue-700 
          dark:bg-blue-700 dark:hover:bg-blue-600 transition duration-200 ease-in-out font-semibold"
          disabled={loading}
        >
          {loading ? (
            <div className="flex justify-center items-center">
              <Loader2 className="animate-spin w-5 h-5 mr-2" />
              Loading...
            </div>
          ) : (
            "Calculate Durations"
          )}
        </button>
      </form>

      {/* Error Message */}
      {error && <p className="mt-4 text-red-500 text-center">{error}</p>}

      {/* Results Section */}
      {result && (
        <div className="mt-6 space-y-6">
          {/* Total Stats */}
          <div>
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
              Total Playlist Info
            </h2>
            <p className="text-gray-700 dark:text-white">
              <strong>Total Videos:</strong> {result.totalVideos}
            </p>
            <p className="text-gray-700 dark:text-white">
              <strong>Total Duration:</strong> {result.totalDuration}
            </p>
            <p className="text-gray-700 dark:text-white">
              <strong>Average Duration:</strong> {result.averageVideoDuration}
            </p>

            {/* PIE CHART SECTION */}
            <div className="mt-8">
              <h3 className="text-lg font-semibold text-center text-gray-800 dark:text-white mb-4">
                Playlist Progress Overview
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={[
                      { name: "Completed Videos", value: completedVideos },
                      {
                        name: "Remaining Videos",
                        value:
                          result.totalVideos - completedVideos >= 0
                            ? result.totalVideos - completedVideos
                            : 0,
                      },
                    ]}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label
                    dataKey="value"
                  >
                    <Cell fill="#4CAF50" />
                    <Cell fill="#FF5252" />
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1f2937",
                      border: "1px solid #4b5563",
                      borderRadius: "8px",
                    }}
                    itemStyle={{ color: "#fff" }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Duration at Different Speeds */}
            <div className="flex flex-wrap justify-center gap-6 mt-6">
              {result.adjustedDurations.map((duration, index) => {
                const base = parseDuration(result.adjustedDurations[0]);
                const current = parseDuration(duration);
                const percent = Math.max((current / base) * 100, 1);
                const speed = (1 + index * 0.25).toFixed(2);
                const color = getSpeedColor(parseFloat(speed));

                const pieData = [
                  { name: "Filled", value: percent },
                  { name: "Empty", value: 100 - percent },
                ];

                return (
                  <div key={index} className="flex flex-col items-center">
                    <ResponsiveContainer width={100} height={100}>
                      <PieChart>
                        <Pie
                          data={pieData}
                          dataKey="value"
                          startAngle={90}
                          endAngle={-270}
                          innerRadius={30}
                          outerRadius={45}
                        >
                          <Cell fill={color} />
                          <Cell fill="#E5E7EB" />
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    <span className="text-sm text-gray-700 dark:text-white mt-2 font-semibold">
                      {speed}x
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {duration}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Remaining Stats */}
          {completedVideos > 0 && result.remainingVideos !== undefined && (
            <div className="mt-6 border-t border-gray-500 pt-4">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
                Remaining Playlist Info
              </h2>
              <p className="text-gray-700 dark:text-white">
                <strong>Remaining Videos:</strong> {result.remainingVideos}
              </p>
              <p className="text-gray-700 dark:text-white">
                <strong>Remaining Duration:</strong> {result.remainingDuration}
              </p>

              <div className="flex flex-wrap justify-center gap-6 mt-4">
                {result.adjustedRemainingDurations?.map((duration, index) => {
                  const base = parseDuration(
                    result.adjustedRemainingDurations[0]
                  );
                  const current = parseDuration(duration);
                  const percent = Math.max((current / base) * 100, 1);
                  const speed = (1 + index * 0.25).toFixed(2);
                  const color = getSpeedColor(parseFloat(speed));

                  const pieData = [
                    { name: "Filled", value: percent },
                    { name: "Empty", value: 100 - percent },
                  ];

                  return (
                    <div key={index} className="flex flex-col items-center">
                      <ResponsiveContainer width={100} height={100}>
                        <PieChart>
                          <Pie
                            data={pieData}
                            dataKey="value"
                            startAngle={90}
                            endAngle={-270}
                            innerRadius={30}
                            outerRadius={45}
                          >
                            <Cell fill={color} />
                            <Cell fill="#E5E7EB" />
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                      <span className="text-sm text-gray-700 dark:text-white mt-2 font-semibold">
                        {speed}x
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {duration}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PlaylistForm;
