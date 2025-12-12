// safely-home-frontend/services/phoneUtils.js
// ✅ FINAL FIX: Works on Samsung, Redmi, OnePlus, ALL Android phones

import { Linking, Platform, Alert } from 'react-native';
import { showAlert } from '../components/CustomAlert';
/**
 * Universal phone call - Works on ALL Android phones
 * Samsung, Redmi, OnePlus, Xiaomi, etc.
 */
export const makePhoneCall = (phoneNumber, personName = 'Contact') => {
  if (!phoneNumber) {
    Alert.alert('Error', 'Phone number not available');
    return;
  }

  // Clean phone number
  const cleanNumber = phoneNumber.replace(/[^\d+]/g, '');
  console.log('📞 Calling:', cleanNumber);

  showAlert(
    'Call ' + personName,
    `Do you want to call ${personName}?\n\n${phoneNumber}`,
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Call',style: 'destructive',
        onPress: () => {
          const url = `tel:${cleanNumber}`;
          
          Linking.canOpenURL(url)
            .then((supported) => {
              if (supported) {
                return Linking.openURL(url);
              } else {
                // Show number for manual dialing
                showAlert(
                  'Phone Number',
                  `Please dial manually:\n\n${phoneNumber}`,
                  [{ text: 'OK' }],
                  {type: 'info'}
                );
              }
            })
            .catch((err) => {
              console.error('Call error:', err);
              // Fallback: Show number
              showAlert(
                'Phone Number',
                `Please dial manually:\n\n${phoneNumber}`,
                [{ text: 'OK' }],
                {type: 'info'}
              );
            });
        }
      }
    ],
    {type: 'info'}
  );
};

/**
 * Emergency 911 call
 */
export const makeEmergencyCall = () => {
  showAlert(
    '🚨 Emergency Services',
    'This will open your phone dialer with 911.',
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Call 911',
        style: 'destructive',
        onPress: () => {
          const url = 'tel:911';
          
          Linking.canOpenURL(url)
            .then((supported) => {
              if (supported) {
                return Linking.openURL(url);
              } else {
                showAlert('Emergency', 'Please dial 911 manually.');
              }
            })
            .catch(() => {
              showAlert('Emergency', 'Please dial 911 manually.');
            });
        }
      }
    ],
    {type: 'warning'}
  );
};