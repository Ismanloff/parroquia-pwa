
export type Saint = {
  date: string;
  name: string;
  bio: string;
  source?: Record<string, any>;
  updated_at?: string;
};

export type Gospel = {
  date: string;
  title: string;
  passage: string;
  content: string;
  source?: Record<string, any>;
  updated_at?: string;
};

export type UserEvent = {
  id: string;
  user_id: string;
  title: string;
  starts_at: string;
  ends_at?: string;
  location?: string;
  notes?: string;
  created_at?: string;
};

export type PublicEvent = {
  id: string;
  title:string;
  starts_at: string;
  ends_at?: string;
  location?: string;
  meta?: Record<string, any>;
  updated_at?: string;
};

export type DayData = {
  date: string;
  saint?: Saint;
  gospel?: Gospel;
};
