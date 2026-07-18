# Privacy Policy Modal Design Spec

This specification outlines the integration of a custom, dynamically-translated Privacy Policy modal in the **digest** app. It adapts guidelines and policies from similar health/diet tools (Cronometer, Eat This Much) into a structured format for `digest` without exposing specific backend model names.

## Proposed Changes

### Data Layer

#### [NEW] [privacyData.ts](file:///d:/digest/data/privacyData.ts)
This file will store the structured content of the privacy policy in both English and Arabic. It splits the document into logical sections, each with a header, an icon name, paragraphs, and optional bullet points.

Key sections will include:
1. **Introduction / Welcome**: Purpose of the policy.
2. **Information We Collect**: Account details (names, emails) and health biometrics (weight, height, age, gender, activity levels) used for calculating Mifflin-St Jeor metabolic rates.
3. **How We Use Your Data**: Tracking food logs, water logs, and workout activities (MET calculations).
4. **AI & Image Processing**: How the camera food recognition and meal swap scanner analyze food/meals without identifying specific model names (referred to as cloud AI services).
5. **Data Storage & Security**: Secure Supabase cloud storage (Auth, Database, Storage) and local caching (AsyncStorage).
6. **Your Rights & Deletion**: How users can access, correct, or request deletion of their health data.

### Screen & UI Layer

#### [MODIFY] [profile.tsx](file:///d:/digest/app/(tabs)/profile.tsx)
* **Import**: Import `privacySections` from `data/privacyData`.
* **State**: Add a boolean state `showPrivacyModal` (initialized to `false`).
* **Trigger**: Update the "Privacy Policy" `TouchableOpacity` in the Support & Legal card to call `setShowPrivacyModal(true)` instead of alerting.
* **Modal Component**: Add a standard React Native `<Modal>` component at the bottom of the screen containing:
  - `<SafeAreaView style={{ flex: 1, backgroundColor: '#F8F9F8' }}>`
  - **Header View**: Dynamic title matching the translation language, a back chevron button, and a bottom border.
  - **Scrollable Content**: A `<ScrollView>` containing the list of sections. Each section displays:
    - An icon (`Ionicons`) next to the section title.
    - Beautifully styled paragraph text.
    - Bullet points for itemized details.

## Verification Plan

### Automated Checks
- Ensure the app builds successfully with `npm run typecheck`.

### Manual Verification
1. Tap the **Privacy Policy** option under the Help & Legal section on the Profile tab.
2. Verify that the modal slides up smoothly and displays the formatted policy.
3. Verify that the back chevron closes the modal properly.
4. Toggle the language in the app settings (Arabic <-> English) and confirm the Privacy Policy text dynamically updates to the corresponding language.
