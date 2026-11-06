// Imported only when Test characters is explicitly opened. No model preloads.
import {TEST_CHARACTER_INFO} from './profiles.js?v=test-characters-20261013';
export const TEST_AVATARS=Object.entries(TEST_CHARACTER_INFO).map(([id,{label}])=>[id,label]);
