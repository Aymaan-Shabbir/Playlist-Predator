export interface PlaylistInfo {
  // Total playlist info
  totalVideos: number; // Total number of videos in the playlist
  totalDuration: string; // Total duration (HH:MM:SS)
  averageVideoDuration: string; // Average video duration (HH:MM:SS)
  adjustedDurations: string[]; // Durations at 1x, 1.25x, 1.5x, 1.75x, 2x

  // Remaining (after completed videos)
  remainingVideos?: number; // Number of videos left to watch
  remainingDuration?: string; // Duration left (HH:MM:SS)
  adjustedRemainingDurations?: string[]; // Remaining durations at different speeds
}

export interface ErrorResponse {
  error: string;
}

export interface SuccessResponse {
  playlistInfo: PlaylistInfo;
}
