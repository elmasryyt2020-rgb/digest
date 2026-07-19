import { Platform } from 'react-native';

let Notifications: any = null;
let isNotificationsSupported = false;

try {
  // Use require to dynamically load expo-notifications and catch import-time crashes in unsupported environments like Expo Go Android
  Notifications = require('expo-notifications');
  isNotificationsSupported = !!Notifications;
} catch (e) {
  console.warn('expo-notifications is not supported in this environment (e.g. Expo Go Android):', e);
}

export { isNotificationsSupported };

// Set notification handler to show alerts when the app is in the foreground
if (isNotificationsSupported && Notifications) {
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  } catch (err) {
    console.warn('Failed to set notification handler:', err);
  }
}

/**
 * Request notification permission and configure Android notification channel if needed
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!isNotificationsSupported || !Notifications) {
    return false;
  }

  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#4C6E58',
      });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    return finalStatus === 'granted';
  } catch (err) {
    console.warn('Error requesting notification permission:', err);
    return false;
  }
}

/**
 * Schedule daily reminders for Breakfast (8:30 AM), Lunch (1:30 PM), and Dinner (7:30 PM)
 */
export async function scheduleMealReminders(language: 'ar' | 'en') {
  if (!isNotificationsSupported || !Notifications) {
    return;
  }

  const meals = [
    {
      id: 'meal-breakfast',
      hour: 8,
      minute: 30,
      title: language === 'ar' ? 'حان وقت تسجيل وجبتك! 🍽️' : 'Time to Log Your Meal! 🍽️',
      body: language === 'ar' ? 'ابدأ يومك بنشاط! لا تنسى تسجيل وجبة الفطور.' : 'Start your day right! Remember to log your breakfast.',
    },
    {
      id: 'meal-lunch',
      hour: 13,
      minute: 30,
      title: language === 'ar' ? 'حان وقت تسجيل وجبتك! 🍽️' : 'Time to Log Your Meal! 🍽️',
      body: language === 'ar' ? 'واصل تقدمك! تذكر تسجيل وجبة الغداء.' : 'Keep up the momentum! Don\'t forget to log your lunch.',
    },
    {
      id: 'meal-dinner',
      hour: 19,
      minute: 30,
      title: language === 'ar' ? 'حان وقت تسجيل وجبتك! 🍽️' : 'Time to Log Your Meal! 🍽️',
      body: language === 'ar' ? 'أنهِ يومك بنجاح! سجل وجبة العشاء لإكمال مذكراتك.' : 'Finish the day strong! Log your dinner to complete your diary.',
    },
  ];

  for (const meal of meals) {
    try {
      await Notifications.cancelScheduledNotificationAsync(meal.id);
    } catch (_) {}

    try {
      await Notifications.scheduleNotificationAsync({
        identifier: meal.id,
        content: {
          title: meal.title,
          body: meal.body,
          sound: true,
          ...Platform.select({
            android: {
              channelId: 'default',
            },
            default: {},
          }),
        },
        trigger: {
          hour: meal.hour,
          minute: meal.minute,
          repeats: true,
        } as any,
      });
    } catch (err) {
      console.warn(`Failed to schedule meal reminder ${meal.id}:`, err);
    }
  }
}

/**
 * Cancel scheduled daily meal reminders
 */
export async function cancelMealReminders() {
  if (!isNotificationsSupported || !Notifications) {
    return;
  }

  const mealIds = ['meal-breakfast', 'meal-lunch', 'meal-dinner'];
  for (const id of mealIds) {
    try {
      await Notifications.cancelScheduledNotificationAsync(id);
    } catch (_) {}
  }
}

/**
 * Schedule hydration reminders every 2 hours from 9 AM to 9 PM (7 times daily)
 */
export async function scheduleWaterReminders(language: 'ar' | 'en') {
  if (!isNotificationsSupported || !Notifications) {
    return;
  }

  const title = language === 'ar' ? 'حافظ على رطوبتك! 💧' : 'Stay Hydrated! 💧';
  const body = language === 'ar' ? 'حان وقت شرب كوب من الماء. حافظ على رطوبة جسمك وصحتك!' : 'Time for a refreshing glass of water. Keep your hydration target on track!';
  
  const hours = [9, 11, 13, 15, 17, 19, 21];
  for (const hour of hours) {
    const identifier = `water-${hour}`;
    try {
      await Notifications.cancelScheduledNotificationAsync(identifier);
    } catch (_) {}

    try {
      await Notifications.scheduleNotificationAsync({
        identifier,
        content: {
          title,
          body,
          sound: true,
          ...Platform.select({
            android: {
              channelId: 'default',
            },
            default: {},
          }),
        },
        trigger: {
          hour,
          minute: 0,
          repeats: true,
        } as any,
      });
    } catch (err) {
      console.warn(`Failed to schedule water reminder ${identifier}:`, err);
    }
  }
}

/**
 * Cancel hydration reminders
 */
export async function cancelWaterReminders() {
  if (!isNotificationsSupported || !Notifications) {
    return;
  }

  const hours = [9, 11, 13, 15, 17, 19, 21];
  for (const hour of hours) {
    try {
      await Notifications.cancelScheduledNotificationAsync(`water-${hour}`);
    } catch (_) {}
  }
}

/**
 * Schedule daily activity reminders at 6:30 PM
 */
export async function scheduleWorkoutReminders(language: 'ar' | 'en') {
  if (!isNotificationsSupported || !Notifications) {
    return;
  }

  const identifier = 'workout-daily';
  const title = language === 'ar' ? 'سجل نشاطك الرياضي! 💪' : 'Log Your Activity! 💪';
  const body = language === 'ar' ? 'هل تمرنت اليوم؟ سجل أنشطتك الرياضية والتمارين الآن.' : 'Did you move today? Log your exercises and workouts now.';

  try {
    await Notifications.cancelScheduledNotificationAsync(identifier);
  } catch (_) {}

  try {
    await Notifications.scheduleNotificationAsync({
      identifier,
      content: {
        title,
        body,
        sound: true,
        ...Platform.select({
          android: {
            channelId: 'default',
          },
          default: {},
        }),
      },
      trigger: {
        hour: 18,
        minute: 30,
        repeats: true,
      } as any,
    });
  } catch (err) {
    console.warn('Failed to schedule workout reminder:', err);
  }
}

/**
 * Cancel daily activity reminders
 */
export async function cancelWorkoutReminders() {
  if (!isNotificationsSupported || !Notifications) {
    return;
  }

  try {
    await Notifications.cancelScheduledNotificationAsync('workout-daily');
  } catch (_) {}
}
