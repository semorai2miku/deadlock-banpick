export type TeamSide = "blue" | "red";
export type DraftActionType = "BAN" | "PICK";
export type RoomRole = "host" | "participant" | "spectator";

export interface DraftTurn {
  order: number;
  side: TeamSide;
  action: DraftActionType;
  count?: number;
}

export interface DraftRuleStep {
  side: TeamSide;
  action: DraftActionType;
  count: number;
}

export interface RoomSettings {
  timeLimitSeconds: number;
  draftRules: DraftRuleStep[];
  isPublic: boolean;
  allowSpectators: boolean;
}

export interface DraftActionRecord extends DraftTurn {
  heroName: string;
  actorId: string;
  at: string;
}

export interface MemberState {
  id: string;
  name: string;
  role: RoomRole;
  side: TeamSide | null;
}

export interface RoomState {
  id: string;
  code: string;
  name: string;
  hostId: string;
  status: "waiting" | "drafting" | "paused" | "finished";
  settings: RoomSettings;
  host: MemberState;
  participants: MemberState[];
  spectators: MemberState[];
  heroPool: string[];
  currentTurnIndex: number;
  currentTurnStartedAt: string;
  pausedAt?: string | null;
  expiresAt: string;
  blueBans: string[];
  redBans: string[];
  bluePicks: string[];
  redPicks: string[];
  records: DraftActionRecord[];
}

export interface LobbyRoomSummary {
  id: string;
  code: string;
  name: string;
  status: RoomState["status"];
  settings: Pick<RoomSettings, "timeLimitSeconds" | "isPublic" | "allowSpectators">;
  hostName: string;
  participantCount: number;
  spectatorCount: number;
  currentTurnIndex: number;
  expiresAt: string;
  updatedAt: string;
}
