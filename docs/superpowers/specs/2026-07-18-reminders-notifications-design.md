# Spec: Reminders & Notifications Implementation

This specification outlines the technical design for implementing local notifications and reminders within the **digest** mobile application, triggered by the toggles in the Profile settings screen.

## Objective

Make the "Reminders & Notifications" section in the Profile settings screen fully functional. When toggled on, the app should request permission and schedule local notifications. When toggled off, it should cancel the scheduled notifications.

---

## 1. Notification Library & Permission Setup

We will use the official Expo notifications library `expo-notifications`.

### Installation
* `expo install expo-notifications`

### Permissions Workflow
1. When any reminder toggle is turned **ON**:
   * Check current permissions via `Notifications.getPermissionsAsync()`.
   * If permission status is not `granted`, call `Notifications.requestPermissionsAsync()`.
   * If the user grants permission, proceed to schedule the notifications and save the setting to the profile store.
   * If the user denies permission:
     * Show an `Alert` explaining that notification permissions are required to enable reminders.
     * Keep the toggle state as `false` (turned off).
2. When the app loads, we do not auto-request permissions to avoid annoying the user. Permissions are requested contextually upon toggle activation.

---

## 2. Notification Scheduling Configuration

We will create a helper utility `lib/notifications.ts` to manage all scheduling and cancellation logic.

### Localized Notification Content

Based on user profile language (Arabic default, English option):

| Type | Timing | Arabic Title / Body | English Title / Body |
| :--- | :--- | :--- | :--- |
| **Meal: Breakfast** | 8:30 AM | حان وقت تسجيل وجبتك! 🍽️<br>ابدأ يومك بنشاط! لا تنسى تسجيل وجبة الفطور. | Time to Log Your Meal! 🍽️<br>Start your day right! Remember to log your breakfast. |
| **Meal: Lunch** | 1:30 PM | حان وقت تسجيل وجبتك! 🍽️<br>واصل تقدمك! تذكر تسجيل وجبة الغداء. | Time to Log Your Meal! 🍽️<br>Keep up the momentum! Don't forget to log your lunch. |
| **Meal: Dinner** | 7:30 PM | حان وقت تسجيل وجبتك! 🍽️<br>أنهِ يومك بنجاح! سجل وجبة العشاء لإكمال مذكراتك. | Time to Log Your Meal! 🍽️<br>Finish the day strong! Log your dinner to complete your diary. |
| **Water** | Every 2 hours (9 AM - 9 PM) | حافظ على رطوبتك! 💧<br>حان وقت شرب كوب من الماء. حافظ على رطوبة جسمك وصحتك! | Stay Hydrated! 💧<br>Time for a refreshing glass of water. Keep your hydration target on track! |
| **Workout** | 6:30 PM | سجل نشاطك الرياضي! 💪<br>هل تمرنت اليوم؟ سجل أنشطتك الرياضية والتمارين الآن. | Log Your Activity! 💪<br>Did you move today? Log your exercises and workouts now. |

### Scheduling Implementation (Triggers)

Expo local notifications allow scheduling using daily recurring triggers:

1. **Daily Meal Reminders**
   * **Breakfast**: Trigger at `{ hour: 8, minute: 30, repeats: true }` with identifier `meal-breakfast`.
   * **Lunch**: Trigger at `{ hour: 13, minute: 30, repeats: true }` with identifier `meal-lunch`.
   * **Dinner**: Trigger at `{ hour: 19, minute: 30, repeats: true }` with identifier `meal-dinner`.

2. **Daily Hydration Reminders**
   * Triggers at `{ hour: H, minute: 0, repeats: true }` for H ∈ `[9, 11, 13, 15, 17, 19, 21]` (7 distinct daily alarms) with identifiers `water-9am`, `water-11am`, `water-1pm`, `water-3pm`, `water-5pm`, `water-7pm`, `water-9pm`.

3. **Daily Activity Reminders**
   * Trigger at `{ hour: 18, minute: 30, repeats: true }` with identifier `workout-daily`.

### Cancellation

* When a category is toggled **OFF**, we cancel only the relevant identifiers:
  * Meals: Cancel `meal-breakfast`, `meal-lunch`, `meal-dinner`.
  * Water: Cancel `water-9am` to `water-9pm` identifiers.
  * Workouts: Cancel `workout-daily`.
* This ensures that toggling off one category does not impact the others.

---

## 3. Integration with Profile Screen

1. Import `requestNotificationPermission`, `scheduleMealReminders`, `scheduleWaterReminders`, `scheduleWorkoutReminders`, and their corresponding cancel functions in `app/(tabs)/profile.tsx`.
2. Wrap toggle changes in a unified check.
3. Example:
   ```typescript
   const handleReminderChange = async (type: 'meals' | 'water' | 'workout', enabled: boolean) => {
     if (enabled) {
       const hasPermission = await requestNotificationPermission();
       if (!hasPermission) {
         // Revert/stay false
         return;
       }
       // Schedule notifications
       if (type === 'meals') await scheduleMealReminders(language);
       if (type === 'water') await scheduleWaterReminders(language);
       if (type === 'workout') await scheduleWorkoutReminders(language);
     } else {
       // Cancel notifications
       if (type === 'meals') await cancelMealReminders();
       if (type === 'water') await cancelWaterReminders();
       if (type === 'workout') await cancelWorkoutReminders();
     }
     
     // Update state and sync
     handleStatChange(`reminder_${type}`, enabled);
   };
   ```

## 4. Verification & Testing

* **Unit check**: Verify permission logic works without crash.
* **Manual verification**: Verify switches update layout correctly and alert prompt shows on rejection.
