import { NextRequest } from "next/server";
import { PlaylistInfo } from "@/app/types/playlistInfo";

// Helper function to format duration in seconds into HH:MM:SS
function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = Math.floor(seconds % 60);

  return `${padZero(hours)}:${padZero(minutes)}:${padZero(remainingSeconds)}`;
}

// Helper function to add leading zeros to single-digit values (e.g., 1 -> 01)
function padZero(num: number): string {
  return num < 10 ? `0${num}` : `${num}`;
}

export async function POST(req: NextRequest) {
  // Parse the request body to get the playlist URL
  const { playlistUrl } = await req.json();

  // Validate if the playlist URL is provided
  if (!playlistUrl) {
    return new Response(JSON.stringify({ error: "Playlist URL is required" }), {
      status: 400,
    });
  }

  try {
    // Extract Playlist ID from the URL
    const playlistId = new URL(playlistUrl).searchParams.get("list");
    if (!playlistId) throw new Error("Invalid YouTube playlist URL");

    // Get the API Key from environment variables
    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) {
      throw new Error(
        "API key is missing. Please set YOUTUBE_API_KEY in your environment variables."
      );
    }

    let totalDurationSeconds = 0;
    let totalVideos = 0;
    let nextPageToken: string | undefined;

    // Helper function to fetch playlist items
    const fetchPlaylistItems = async (pageToken = "") => {
      const url = `https://www.googleapis.com/youtube/v3/playlistItems?part=contentDetails&playlistId=${playlistId}&maxResults=50&key=${apiKey}&pageToken=${pageToken}`;
      const response = await fetch(url);
      return response.json();
    };

    // Helper function to fetch video durations
    const fetchVideoDurations = async (videoIds: string[]) => {
      const url = `https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${videoIds.join(
        ","
      )}&key=${apiKey}`;
      const response = await fetch(url);
      return response.json();
    };

    // Loop through the playlist items and fetch durations
    do {
      const playlistData = await fetchPlaylistItems(nextPageToken);
      const videoIds = playlistData.items.map(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (item: any) => item.contentDetails.videoId
      );
      totalVideos += videoIds.length;

      // Get the durations of the videos
      const videoData = await fetchVideoDurations(videoIds);
      totalDurationSeconds += videoData.items.reduce(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (sum: number, video: any) => {
          // Extract hours, minutes, and seconds from the YouTube video duration
          const match = video.contentDetails.duration.match(
            /PT(\d+H)?(\d+M)?(\d+S)?/
          );
          const hours = match[1] ? parseInt(match[1]) : 0;
          const minutes = match[2] ? parseInt(match[2]) : 0;
          const seconds = match[3] ? parseInt(match[3]) : 0;
          return sum + hours * 3600 + minutes * 60 + seconds;
        },
        0
      );

      // Get the next page token for pagination
      nextPageToken = playlistData.nextPageToken;
    } while (nextPageToken);

    // Calculate average video duration in seconds
    const averageVideoDurationSeconds = totalDurationSeconds / totalVideos;

    // Calculate the durations at different speeds (e.g., 1x, 1.25x, 1.5x, 1.75x, 2x)
    const adjustedDurations = [1, 1.25, 1.5, 1.75, 2].map((speed) =>
      formatDuration(totalDurationSeconds / speed)
    );

    // Format the total duration (convert seconds to HH:MM:SS)
    const formattedDuration = formatDuration(totalDurationSeconds);

    // Calculate the average video duration in HH:MM:SS format
    const formattedAvgVideoDuration = formatDuration(
      averageVideoDurationSeconds
    );

    // Prepare the response data
    const playlistInfo: PlaylistInfo = {
      totalVideos,
      totalDuration: formattedDuration,
      averageVideoDuration: formattedAvgVideoDuration,
      adjustedDurations, // Duration at different speeds
    };

    // Send the response with playlist info
    return new Response(JSON.stringify(playlistInfo), {
      status: 200,
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    // Handle errors gracefully and return the error message
    return new Response(
      JSON.stringify({ error: error.message || "Failed to process playlist" }),
      {
        status: 500,
      }
    );
  }
}
