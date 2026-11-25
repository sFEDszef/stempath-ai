import {assertSession} from './integrity';
import type {ResearchSession} from './session';

/** Display only the existing policy-filtered export for the selected participant. */
export function readResearchBundle(text: string, participantCode: string): ResearchSession[] {
  const value: unknown = JSON.parse(text);
  if (!value || typeof value !== 'object' || !('schemaVersion' in value) || value.schemaVersion !== '0.6'
    || !('sessions' in value) || !Array.isArray(value.sessions)) throw Error('Invalid research export');
  return value.sessions.map(session => {
    assertSession(session);
    if (session.participantCode !== participantCode) throw Error('Participant mismatch in research export');
    return session;
  });
}
