export interface PollOption {
  id: number;
  text: string;
  voteCount: number;
}

export interface Poll {
  id: string;
  question: string;
  options: PollOption[];
  showResults: boolean;
  createdAt: string;
}

export interface VotePayload {
  pollId: string;
  optionId: number;
}

export interface VoteResponse {
  success: boolean;
  poll: Poll;
}

export interface CreatePollPayload {
  question: string;
  options: string[];
  showResults?: boolean;
}
