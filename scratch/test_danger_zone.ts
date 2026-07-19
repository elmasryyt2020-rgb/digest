import { useAuthStore } from '../store/useAuthStore';
import { useDiaryStore } from '../store/useDiaryStore';

// Simple sanity check of Danger Zone state functions
async function runSanityCheck() {
  console.log('Running Danger Zone sanity checks...');

  // 1. Verify existence of deleteAccount in AuthStore
  const authStore = useAuthStore.getState();
  if (typeof authStore.deleteAccount !== 'function') {
    throw new Error('deleteAccount is not a function on useAuthStore');
  }
  console.log('✓ useAuthStore.deleteAccount exists.');

  // 2. Verify existence of resetAll in DiaryStore
  const diaryStore = useDiaryStore.getState();
  if (typeof diaryStore.resetAll !== 'function') {
    throw new Error('resetAll is not a function on useDiaryStore');
  }
  console.log('✓ useDiaryStore.resetAll exists.');

  // 3. Verify resetAll sets initial empty state correctly
  diaryStore.resetAll();
  const resetState = useDiaryStore.getState();
  if (!resetState.isTrial) {
    throw new Error('resetAll did not set isTrial to true');
  }
  if (resetState.foodLogs.length !== 0 || resetState.waterLogs.length !== 0 || resetState.workoutLogs.length !== 0) {
    throw new Error('resetAll did not clear food/water/workout logs');
  }
  console.log('✓ useDiaryStore.resetAll resets state correctly.');

  console.log('Danger Zone sanity check passed successfully!');
}

runSanityCheck().catch(err => {
  console.error('FAIL:', err);
  process.exit(1);
});
