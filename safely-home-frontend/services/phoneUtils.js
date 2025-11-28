// safely-home-frontend/services/phoneUtils.js
// ✅ WORKS ON ALL ANDROID PHONES (Redmi, OnePlus, Samsung, etc.)

import { Linking, Platform, Alert } from 'react-native';
import * as IntentLauncher from 'expo-intent-launcher';

/**
 * Universal phone call function that works on ALL Android phones
 * including Redmi, OnePlus, Xiaomi, etc.
 */
export const makePhoneCall = async (phoneNumber, personName = 'Contact') => {
  if (!phoneNumber) {
    Alert.alert('Error', 'Phone number not available');
    return;
  }

  // Clean phone number
  const cleanNumber = phoneNumber.replace(/[^\d+]/g, '');
  console.log('📞 Attempting to call:', { original: phoneNumber, cleaned: cleanNumber });

  Alert.alert(
    'Call ' + personName,
    `Do you want to call ${personName}?\n\n${phoneNumber}`,
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Call',
        onPress: async () => {
          try {
            if (Platform.OS === 'android') {
              // ✅ CRITICAL FIX: Use Android Intent for maximum compatibility
              // This works on Redmi, OnePlus, Xiaomi, and all Android phones
              await IntentLauncher.startActivityAsync('android.intent.action.DIAL', {
                data: `tel:${cleanNumber}`,
                type: 'text/plain'
              });
              console.log('✅ Opened dialer via Android Intent');
            } else {
              // iOS
              const url = `tel:${cleanNumber}`;
              const canOpen = await Linking.canOpenURL(url);
              
              if (canOpen) {
                await Linking.openURL(url);
                console.log('✅ Opened iOS dialer');
              } else {
                throw new Error('Cannot open dialer on iOS');
              }
            }
          } catch (error) {
            console.error('❌ Dialer error:', error);
            
            // ✅ FALLBACK: Show manual dial instructions
            Alert.alert(
              'Unable to Open Dialer',
              `Please open your phone app and dial:\n\n${phoneNumber}\n\nOr copy this number.`,
              [
                {
                  text: 'Show Number Again',
                  onPress: () => {
                    Alert.alert('Phone Number', phoneNumber, [{ text: 'OK' }]);
                  }
                },
                { text: 'OK' }
              ]
            );
          }
        }
      }
    ]
  );
};

/**
 * Emergency 911 call - Works on ALL phones
 */
export const makeEmergencyCall = () => {
  Alert.alert(
    '🚨 Emergency Services',
    'This will open the dialer with 911.\n\nPress CALL to connect immediately.',
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Open Dialer',
        style: 'destructive',
        onPress: async () => {
          const emergencyNumber = '911';
          
          try {
            if (Platform.OS === 'android') {
              // ✅ Use Android Intent for emergency calls
              await IntentLauncher.startActivityAsync('android.intent.action.DIAL', {
                data: `tel:${emergencyNumber}`,
                type: 'text/plain'
              });
              console.log('✅ Opened emergency dialer via Android Intent');
            } else {
              // iOS
              const url = `tel:${emergencyNumber}`;
              await Linking.openURL(url);
              console.log('✅ Opened iOS emergency dialer');
            }
          } catch (error) {
            console.error('❌ Emergency dialer error:', error);
            
            Alert.alert(
              'Emergency',
              'Please dial 911 manually from your phone dialer immediately.',
              [{ text: 'OK' }]
            );
          }
        }
      }
    ]
  );
};