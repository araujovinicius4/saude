import {portalMock, demoSession} from '../data/portal.js';
import {saveCitizenRecord,deleteCitizenRecord} from './health-record/model.js';
import {changeAppointments} from './appointments/model.js';

// Replace this adapter with an authenticated API client when the backend exists.
// This stage performs no network requests and writes no portal data to localStorage.
export const demoPortalRepository = {
  getSnapshot:() => structuredClone(portalMock),
  getSession:() => ({...demoSession}),
  saveHealthRecord:saveCitizenRecord,
  deleteHealthRecord:deleteCitizenRecord,
  changeAppointments,
};
