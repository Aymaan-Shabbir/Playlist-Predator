export interface PlaylistInfo {
  totalVideos: number; // The total number of videos in the playlist
  totalDuration: string; // Total duration of the playlist (in the format HH:MM:SS or similar)
  averageVideoDuration: string; // The average duration of each video (in HH:MM:SS format or string)
  adjustedDurations: string[]; // Array of strings for adjusted durations at different speeds [at 1x, 1.25x, 1.5x, 1.75x, 2x]
}

export interface ErrorResponse {
  error: string;
}

export interface SuccessResponse {
  playlistInfo: PlaylistInfo;
}
