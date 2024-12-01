/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";
import { useState } from "react";
import { PlaylistInfo } from "@/app/types/playlistInfo";
import { Loader2 } from "lucide-react"; // Import the Loader2 spinner icon

const PlaylistForm = () => {
  const [playlistUrl, setPlaylistUrl] = useState<string>("");
  const [result, setResult] = useState<PlaylistInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false); // Track loading state

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); // Reset error on each submission
    setResult(null); // Reset result on each submission
    setLoading(true); // Set loading state to true

    try {
      const res = await fetch("/api/calculate-duration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playlistUrl }),
      });

      const data = await res.json();

      if (res.ok) {
        setResult(data as PlaylistInfo); // Set the playlist info result
      } else {
        setError(data.error); // If an error occurs, set the error message
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false); // Reset loading state once the request is complete
    }
  };

  // Function to return a color based on the speed (1x, 1.25x, etc.)
  const getSpeedColor = (speed: number) => {
    if (speed === 1) return "#4CAF50"; // Green for 1x speed
    if (speed === 1.25) return "#FF9800"; // Orange for 1.25x speed
    if (speed === 1.5) return "#FF5722"; // Deep Orange for 1.5x speed
    if (speed === 1.75) return "#2196F3"; // Blue for 1.75x speed
    return "#9C27B0"; // Purple for speeds higher than 1.75x
  };

  return (
    <div className="max-w-lg mx-auto">
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          value={playlistUrl}
          onChange={(e) => setPlaylistUrl(e.target.value)}
          placeholder="Enter YouTube Playlist URL"
          className="w-full p-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white  text-gray-700 rounded-md"
          required
        />
        <button
          type="submit"
          className="w-full p-2 text-white bg-blue-500 rounded-md hover:bg-blue-600 dark:bg-blue-700 dark:hover:bg-blue-600"
          disabled={loading} // Disable the button while loading
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
      {error && <p className="mt-4 text-red-500">{error}</p>}
      {result && (
        <div className="mt-4 space-y-2">
          <p className="text-lg font-semibold  text-gray-700 dark:text-white">
            Total Videos: {result.totalVideos}
          </p>
          <p className="text-lg font-semibold  text-gray-700 dark:text-white">
            Total Duration: {result.totalDuration}
          </p>
          <p className="text-lg font-semibold  text-gray-700 dark:text-white">
            Average Video Duration: {result.averageVideoDuration}
          </p>
          <div>
            <strong className="block text-lg font-semibold  text-gray-700 dark:text-white">
              Adjusted Durations at Different Speeds:
            </strong>
            <div className="flex flex-wrap justify-center gap-6 mt-4">
              {result.adjustedDurations.map(
                (duration: string, index: number) => {
                  const speed = (1 + index * 0.25).toFixed(2); // Calculate speed (1x, 1.25x, etc.)
                  const percentage = (
                    (parseFloat(duration) / parseFloat(result.totalDuration)) *
                    100
                  ).toFixed(2);
                  const speedNumber = parseFloat(speed);
                  const durationColor = getSpeedColor(speedNumber); // Get color based on speed

                  return (
                    <div key={index} className="flex flex-col items-center">
                      <div
                        className="relative flex items-center justify-center w-24 h-24 rounded-full"
                        style={{
                          background: `conic-gradient(${durationColor} ${percentage}%, #4CAF50 ${percentage}% 100%)`, // Unfilled section in light gray
                        }}
                      >
                        <span className="absolute text-white text-lg font-semibold">
                          {speed}x
                        </span>
                      </div>
                      <span className="mt-2 text-sm text-gray-700 dark:text-white">
                        {duration}
                      </span>
                    </div>
                  );
                }
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlaylistForm;
