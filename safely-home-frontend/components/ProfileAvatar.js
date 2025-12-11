// safely-home-frontend/components/ProfileAvatar.js
// ✅ REUSABLE PROFILE PICTURE COMPONENT

import React from 'react';
import { View, Image, Text, StyleSheet } from 'react-native';
import { COLORS } from '../config';

export default function ProfileAvatar({ 
  user, 
  size = 60, 
  fontSize = 24,
  style = {} 
}) {
  const avatarSize = {
    width: size,
    height: size,
    borderRadius: size / 2
  };

  const getInitials = () => {
    if (!user?.name) return 'U';
    return user.name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  // Check if user has profile picture
  const hasProfilePicture = user?.profilePicture || user?.faceData;

  return (
    <View style={[styles.container, avatarSize, style]}>
      {hasProfilePicture ? (
        <Image
          source={{ uri: user.profilePicture || user.faceData }}
          style={[styles.image, avatarSize]}
          defaultSource={require('../assets/icon.png')} // Fallback while loading
        />
      ) : (
        <View style={[styles.placeholder, avatarSize]}>
          <Text style={[styles.initials, { fontSize: fontSize }]}>
            {getInitials()}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    backgroundColor: COLORS.accent,
  },
  image: {
    width: '100%',
    height: '100%'
  },
  placeholder: {
    backgroundColor: COLORS.accent,
    justifyContent: 'center',
    alignItems: 'center'
  },
  initials: {
    fontWeight: 'bold',
    color: COLORS.textDark
  }
});