import { Linking, Platform, Alert } from 'react-native';

/**
 * Universal phone call function that works on all devices
 * @param {string} phoneNumber - Phone number to call
 * @param {string} personName - Name of person being called (optional)
 */
export const makePhoneCall = async (phoneNumber, personName = 'Contact') => {
  if (!phoneNumber) {
    Alert.alert('Error', 'Phone number not available');
    return;
  }

  // Clean phone number (remove spaces, dashes, parentheses)
  const cleanNumber = phoneNumber.replace(/[^\d+]/g, '');
  
  console.log('📞 Attempting to call:', { original: phoneNumber, cleaned: cleanNumber });

  // ✅ FIX: Try multiple URL schemes for maximum compatibility
  const urlSchemes = [
    `tel:${cleanNumber}`,           // Standard (iOS/Android)
    `telprompt:${cleanNumber}`,     // iOS with confirmation
    `intent://call?number=${cleanNumber}#Intent;scheme=tel;package=com.android.phone;end` // Android intent
  ];

  let callSuccessful = false;

  for (const url of urlSchemes) {
    try {
      const supported = await Linking.canOpenURL(url);
      
      if (supported) {
        console.log(`✅ Opening dialer with scheme: ${url}`);
        
        Alert.alert(
          'Call ' + personName,
          `Do you want to call ${personName}?\n\n${phoneNumber}`,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Call',
              onPress: async () => {
                try {
                  await Linking.openURL(url);
                  callSuccessful = true;
                } catch (err) {
                  console.error('❌ Error opening dialer:', err);
                  
                  // ✅ FALLBACK: Show number for manual dialing
                  Alert.alert(
                    'Cannot Open Dialer',
                    `Please dial manually:\n\n${phoneNumber}`,
                    [
                      {
                        text: 'Copy Number',
                        onPress: () => {
                          // Copy to clipboard if available
                          if (Platform.OS === 'android') {
                            Alert.alert('Number', phoneNumber);
                          }
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
        
        return; // Exit if we found a working scheme
      }
    } catch (error) {
      console.log(`⚠️ Scheme ${url} not supported:`, error.message);
      continue; // Try next scheme
    }
  }

  // ✅ If NO schemes worked, show manual dial option
  if (!callSuccessful) {
    Alert.alert(
      'Dialer Not Available',
      `This device cannot make calls directly.\n\nPlease dial manually:\n\n${phoneNumber}`,
      [
        { text: 'OK' }
      ]
    );
  }
};

/**
 * Emergency 911 call function
 * Works on ALL devices
 */
export const makeEmergencyCall = () => {
  Alert.alert(
    '🚨 Emergency Services',
    'This will call emergency services immediately.',
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Call 911',
        style: 'destructive',
        onPress: async () => {
          const emergencyNumber = '911';
          
          // ✅ FIX: Try multiple emergency call methods
          const emergencySchemes = [
            `tel:${emergencyNumber}`,
            `telprompt:${emergencyNumber}`,
            Platform.OS === 'android' 
              ? `intent://call?number=${emergencyNumber}#Intent;scheme=tel;package=com.android.phone;S.browser_fallback_url=tel:${emergencyNumber};end`
              : `tel:${emergencyNumber}`
          ];

          let emergencyCallSuccessful = false;

          for (const url of emergencySchemes) {
            try {
              const supported = await Linking.canOpenURL(url);
              
              if (supported) {
                console.log('✅ Opening emergency dialer:', url);
                await Linking.openURL(url);
                emergencyCallSuccessful = true;
                return;
              }
            } catch (error) {
              console.log('⚠️ Emergency scheme failed:', url);
              continue;
            }
          }

          // ✅ If emergency dialing fails, show manual option
          if (!emergencyCallSuccessful) {
            Alert.alert(
              'Emergency Dialing Failed',
              'Please dial 911 manually from your phone dialer immediately.',
              [{ text: 'OK' }]
            );
          }
        }
      }
    ]
  );
};