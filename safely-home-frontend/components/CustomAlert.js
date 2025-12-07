// safely-home-frontend/components/CustomAlert.js
// ✅ PREMIUM CUSTOM ALERT - Themed with icons & animations

import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  BackHandler
} from 'react-native';
import { COLORS } from '../config';

const { width } = Dimensions.get('window');

let globalShowAlert = null;

// Alert types with icons and colors
const ALERT_TYPES = {
  success: {
    icon: '✓',
    color: '#4CAF50',
    backgroundColor: '#4CAF50' + '15'
  },
  error: {
    icon: '✕',
    color: '#F44336',
    backgroundColor: '#F44336' + '15'
  },
  warning: {
    icon: '⚠',
    color: '#FF9800',
    backgroundColor: '#FF9800' + '15'
  },
  info: {
    icon: 'ℹ',
    color: COLORS.accent,
    backgroundColor: COLORS.accent + '15'
  },
  searching: {
    icon: '🔍',
    color: COLORS.accent,
    backgroundColor: COLORS.accent + '15'
  },
  loading: {
    icon: '⏳',
    color: COLORS.accent,
    backgroundColor: COLORS.accent + '15'
  },
  neutral: {
    icon: '💬',
    color: COLORS.text,
    backgroundColor: COLORS.secondary
  }
};

export const showAlert = (title, message, buttons = [{ text: 'OK' }], options = {}) => {
  if (globalShowAlert) {
    globalShowAlert(title, message, buttons, options);
  }
};

export default function CustomAlert() {
  const [visible, setVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [buttons, setButtons] = useState([]);
  const [options, setOptions] = useState({});
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const iconScale = useRef(new Animated.Value(0)).current;
  const [pressedButton, setPressedButton] = useState(null);

  useEffect(() => {
    globalShowAlert = (alertTitle, alertMessage, alertButtons, alertOptions = {}) => {
      setTitle(alertTitle);
      setMessage(alertMessage);
      setButtons(alertButtons);
      setOptions(alertOptions);
      setVisible(true);
    };

    return () => {
      globalShowAlert = null;
    };
  }, []);

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Animate icon after alert appears
        Animated.spring(iconScale, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }).start();
      });

      const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
        if (options.cancelable !== false) {
          handleDismiss();
          return true;
        }
        return true;
      });

      return () => backHandler.remove();
    } else {
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.8);
      iconScale.setValue(0);
    }
  }, [visible]);

  const handleDismiss = () => {
    if (options.cancelable === false) return;
    
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.8,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setVisible(false);
      setPressedButton(null);
    });
  };

  const handleButtonPress = (button, index) => {
    setPressedButton(index);

    // Quick scale animation on button press
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.8,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setVisible(false);
        setPressedButton(null);
        if (button.onPress) {
          button.onPress();
        }
      });
    }, 100);
  };

  const getAlertType = () => {
    const type = options.type || 'neutral';
    return ALERT_TYPES[type] || ALERT_TYPES.neutral;
  };

  const getButtonStyle = (button, index) => {
    const isPressed = pressedButton === index;
    
    if (button.style === 'cancel') {
      return [
        styles.button,
        styles.cancelButton,
        isPressed && styles.buttonPressed
      ];
    } else if (button.style === 'destructive') {
      return [
        styles.button,
        styles.destructiveButton,
        isPressed && styles.buttonPressed
      ];
    }
    return [
      styles.button,
      styles.defaultButton,
      isPressed && styles.buttonPressed
    ];
  };

  const getButtonTextStyle = (button) => {
    if (button.style === 'cancel') {
      return styles.cancelButtonText;
    } else if (button.style === 'destructive') {
      return styles.destructiveButtonText;
    }
    return styles.defaultButtonText;
  };

  if (!visible) return null;

  const alertType = getAlertType();

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={handleDismiss}
    >
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <TouchableOpacity 
          style={styles.backdrop} 
          activeOpacity={1}
          onPress={handleDismiss}
        />
        
        <Animated.View 
          style={[
            styles.alertContainer,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }]
            }
          ]}
        >
          {/* Icon */}
          <Animated.View 
            style={[
              styles.iconContainer,
              { 
                backgroundColor: alertType.backgroundColor,
                transform: [{ scale: iconScale }]
              }
            ]}
          >
            <Text style={[styles.iconText, { color: alertType.color }]}>
              {alertType.icon}
            </Text>
          </Animated.View>

          {/* Title */}
          {title ? (
            <View style={styles.titleContainer}>
              <Text style={styles.title}>{title}</Text>
            </View>
          ) : null}

          {/* Message */}
          {message ? (
            <View style={styles.messageContainer}>
              <Text style={styles.message}>{message}</Text>
            </View>
          ) : null}

          {/* Buttons */}
          <View style={styles.buttonsContainer}>
            {buttons.length === 1 ? (
              <TouchableOpacity
                style={getButtonStyle(buttons[0], 0)}
                onPress={() => handleButtonPress(buttons[0], 0)}
                activeOpacity={0.9}
              >
                <Text style={getButtonTextStyle(buttons[0])}>
                  {buttons[0].text || 'OK'}
                </Text>
              </TouchableOpacity>
            ) : buttons.length === 2 ? (
              <View style={styles.twoButtons}>
                {buttons.map((button, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      ...getButtonStyle(button, index),
                      styles.halfButton,
                      index === 0 && styles.leftButton
                    ]}
                    onPress={() => handleButtonPress(button, index)}
                    activeOpacity={0.9}
                  >
                    <Text style={getButtonTextStyle(button)}>
                      {button.text || 'OK'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <View style={styles.multipleButtons}>
                {buttons.map((button, index) => (
                  <TouchableOpacity
                    key={index}
                    style={getButtonStyle(button, index)}
                    onPress={() => handleButtonPress(button, index)}
                    activeOpacity={0.9}
                  >
                    <Text style={getButtonTextStyle(button)}>
                      {button.text || 'OK'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  alertContainer: {
    width: width * 0.85,
    maxWidth: 400,
    backgroundColor: COLORS.secondary,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.accent + '30',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 15,
    borderWidth: 3,
    borderColor: COLORS.primary,
  },
  iconText: {
    fontSize: 40,
    fontWeight: 'bold',
  },
  titleContainer: {
    paddingHorizontal: 25,
    paddingBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    textAlign: 'center',
  },
  messageContainer: {
    paddingHorizontal: 25,
    paddingBottom: 25,
  },
  message: {
    fontSize: 15,
    color: COLORS.text,
    textAlign: 'center',
    lineHeight: 22,
    opacity: 0.9,
  },
  buttonsContainer: {
    borderTopWidth: 1,
    borderTopColor: COLORS.primary,
  },
  twoButtons: {
    flexDirection: 'row',
  },
  multipleButtons: {
    flexDirection: 'column',
  },
  button: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 0,
  },
  halfButton: {
    flex: 1,
  },
  leftButton: {
    borderRightWidth: 1,
    borderRightColor: COLORS.primary,
  },
  defaultButton: {
    backgroundColor: 'transparent',
  },
  cancelButton: {
    backgroundColor: 'transparent',
  },
  destructiveButton: {
    backgroundColor: 'transparent',
  },
  buttonPressed: {
    backgroundColor: COLORS.primary,
    opacity: 0.8,
  },
  defaultButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.accent,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.accent,
    opacity: 0.7,
  },
  destructiveButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#F44336',
  },
});