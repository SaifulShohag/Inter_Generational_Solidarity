export type UserRole = 'volunteer' | 'elderly';

export interface User {
  id: string;
  role: UserRole;
  name: string;
  email: string;
  avatar: string;
  age?: number;
  bio?: string;
  phone?: string;
  location?: string;
  language?: string;
  interests?: string[];
  availability?: string[];
  emergencyContact?: string;
  joinedAt: string;
  profileCompletion: number;
}

export type MissionCategory =
  | 'transport'
  | 'shopping'
  | 'medical'
  | 'social'
  | 'technology'
  | 'home'
  | 'administrative';

export type MissionUrgency = 'low' | 'medium' | 'high' | 'critical';
export type MissionStatus = 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';

export interface Mission {
  id: string;
  title: string;
  category: MissionCategory;
  description: string;
  location: string;
  distance: string;
  publishedAt: string;
  estimatedDuration: string;
  urgency: MissionUrgency;
  requiredSkills: string[];
  elderlyName: string;
  elderlyAvatar?: string;
  elderlyAge?: number;
  status: MissionStatus;
  missionType: 'immediate' | 'scheduled';
  contactInfo?: string;
  image?: string;
}

export interface CompletedMission extends Mission {
  completedAt: string;
  volunteerId: string;
  volunteerName: string;
  rating?: number;
  review?: string;
  actualDuration: string;
}

export interface VolunteerStats {
  totalMissions: number;
  peopleHelped: number;
  hoursVolunteered: number;
  currentStreak: number;
  longestStreak: number;
  level: number;
  levelName: string;
  nextLevelAt: number;
  currentLevelProgress: number;
  badges: Badge[];
  monthlyData: MonthlyData[];
  weeklyData: WeeklyData[];
  categoryBreakdown: CategoryData[];
  heatmapData: HeatmapEntry[];
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  earnedAt: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface MonthlyData {
  month: string;
  missions: number;
  hours: number;
}

export interface WeeklyData {
  week: string;
  missions: number;
  hours: number;
}

export interface CategoryData {
  category: string;
  count: number;
  color: string;
}

export interface HeatmapEntry {
  date: string;
  count: number;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'mission' | 'system' | 'achievement' | 'reminder';
  read: boolean;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  isVoice?: boolean;
}

export interface HelpRequest {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  status: 'pending' | 'matched' | 'completed';
  volunteerName?: string;
  volunteerAvatar?: string;
  completedAt?: string;
  location?: string;
  duration?: string;
  thankYouSent?: boolean;
}
