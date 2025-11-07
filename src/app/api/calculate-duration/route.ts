import { NextRequest, NextResponse } from "next/server";
import {
  PlaylistInfo,
  SuccessResponse,
  ErrorResponse,
} from "@/app/types/playlistInfo";

// Helper: format duration as HH:MM:SS
function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${padZero(hours)}:${padZero(minutes)}:${padZero(remainingSeconds)}`;
}

// Helper: pad with leading zero
function padZero(num: number): string {
  return num < 10 ? `0${num}` : `${num}`;
}

// YouTube API Response Interfaces
interface PlaylistItem {
  contentDetails: {
    videoId: string;
  };
}

interface PlaylistResponse {
  items: PlaylistItem[];
  nextPageToken?: string;
}

interface VideoContentDetails {
  duration: string;
}

interface VideoItem {
  contentDetails: VideoContentDetails;
}

interface VideoResponse {
  items: VideoItem[];
}

export async function POST(req: NextRequest) {
  const {
    playlistUrl,
    completedVideos = 0,
  }: { playlistUrl?: string; completedVideos?: number } = await req.json();

  if (!playlistUrl) {
    const errorResponse: ErrorResponse = { error: "Playlist URL is required" };
    return NextResponse.json(errorResponse, { status: 400 });
  }

  try {
    // Extract Playlist ID
    const playlistId = new URL(playlistUrl).searchParams.get("list");
    if (!playlistId) {
      const errorResponse: ErrorResponse = {
        error: "Invalid YouTube playlist URL",
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // Get API Key
    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) {
      const errorResponse: ErrorResponse = {
        error:
          "API key missing. Please set YOUTUBE_API_KEY in your environment variables.",
      };
      return NextResponse.json(errorResponse, { status: 500 });
    }

    let totalDurationSeconds = 0;
    let totalVideos = 0;
    let nextPageToken: string | undefined;
    const videoDurations: number[] = [];

    // Fetch playlist items
    const fetchPlaylistItems = async (
      pageToken = ""
    ): Promise<PlaylistResponse> => {
      const url = `https://www.googleapis.com/youtube/v3/playlistItems?part=contentDetails&playlistId=${playlistId}&maxResults=50&key=${apiKey}&pageToken=${pageToken}`;
      const response = await fetch(url);
      return response.json();
    };

    // Fetch video durations
    const fetchVideoDurations = async (
      videoIds: string[]
    ): Promise<VideoResponse> => {
      const url = `https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${videoIds.join(
        ","
      )}&key=${apiKey}`;
      const response = await fetch(url);
      return response.json();
    };

    // Fetch all videos in the playlist
    do {
      const playlistData = await fetchPlaylistItems(nextPageToken);
      const videoIds = playlistData.items.map(
        (item) => item.contentDetails.videoId
      );

      totalVideos += videoIds.length;

      // Get durations
      const videoData = await fetchVideoDurations(videoIds);
      videoData.items.forEach((video) => {
        const match = video.contentDetails.duration.match(
          /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/
        );

        const hours = match?.[1] ? parseInt(match[1], 10) : 0;
        const minutes = match?.[2] ? parseInt(match[2], 10) : 0;
        const seconds = match?.[3] ? parseInt(match[3], 10) : 0;
        const duration = hours * 3600 + minutes * 60 + seconds;

        videoDurations.push(duration);
      });

      nextPageToken = playlistData.nextPageToken;
    } while (nextPageToken);

    // Compute totals
    totalDurationSeconds = videoDurations.reduce((a, b) => a + b, 0);
    const averageVideoDurationSeconds = totalDurationSeconds / totalVideos;

    // Handle completed videos
    const remainingVideos = Math.max(totalVideos - completedVideos, 0);
    const completedDurationSeconds = videoDurations
      .slice(0, completedVideos)
      .reduce((a, b) => a + b, 0);
    const remainingDurationSeconds =
      totalDurationSeconds - completedDurationSeconds;

    // Adjusted durations for playback speeds
    const speeds = [1, 1.25, 1.5, 1.75, 2];
    const adjustedDurations = speeds.map((speed) =>
      formatDuration(totalDurationSeconds / speed)
    );
    const adjustedRemainingDurations = speeds.map((speed) =>
      formatDuration(remainingDurationSeconds / speed)
    );

    // Build playlist info
    const playlistInfo: PlaylistInfo = {
      totalVideos,
      totalDuration: formatDuration(totalDurationSeconds),
      averageVideoDuration: formatDuration(averageVideoDurationSeconds),
      adjustedDurations,
      remainingVideos,
      remainingDuration: formatDuration(remainingDurationSeconds),
      adjustedRemainingDurations,
    };

    const successResponse: SuccessResponse = { playlistInfo };
    return NextResponse.json(successResponse, { status: 200 });
  } catch (error) {
    const errorResponse: ErrorResponse = {
      error:
        error instanceof Error ? error.message : "Failed to process playlist",
    };
    return NextResponse.json(errorResponse, { status: 500 });
  }
}
