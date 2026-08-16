import { PlayerProfile, ClubPreferences } from './scoringEngine';

export const DUMMY_CLUBS = [
  {
    id: 'c1',
    name: 'Metropolitan City FC',
    level: 4,
    region: 'North West',
    seekingPosition: 'BOX-TO-BOX CM',
    tags: ['HIGH PRESS', 'TRANSITIONAL', 'PHYSICAL'],
    urgent: true,
    preferences: {
      targetPositions: ['CM', 'CDM'],
      region: 'North West',
      targetLevel: 4,
      requiredAvailability: ['Tuesday Eve', 'Thursday Eve', 'Saturday Day']
    } as ClubPreferences
  },
  {
    id: 'c2',
    name: 'Eastern Borough UTD',
    level: 5,
    region: 'North West',
    seekingPosition: 'DEEP LYING PLAYMAKER',
    tags: ['POSSESSION BASED', 'LOW BLOCK'],
    urgent: false,
    preferences: {
      targetPositions: ['CDM', 'CM'],
      region: 'North East',
      targetLevel: 5,
      requiredAvailability: ['Wednesday Eve', 'Saturday Day']
    } as ClubPreferences
  },
  {
    id: 'c3',
    name: 'Southside Athletic',
    level: 3,
    region: 'London',
    seekingPosition: 'ATTACKING WINGBACK',
    tags: ['OVERLAPPING', 'HIGH TEMPO'],
    urgent: true,
    preferences: {
      targetPositions: ['RWB', 'LWB'],
      region: 'London',
      targetLevel: 3,
      requiredAvailability: ['Monday Eve', 'Wednesday Eve', 'Saturday Day']
    } as ClubPreferences
  }
];

export const CURRENT_PLAYER_MOCK: PlayerProfile = {
  positions: ['CM', 'CDM', 'RWB'],
  region: 'North West',
  playingLevel: 4,
  skillRatings: {
    passing: 8,
    stamina: 9,
    tackling: 7,
    vision: 8
  },
  availability: ['Tuesday Eve', 'Thursday Eve', 'Saturday Day', 'Sunday Day'],
  hasActiveBoost: true
};
