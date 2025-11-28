import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  FlatList, 
  KeyboardAvoidingView, 
  Platform,
} from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";

import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS } from '../config';
import socketService from '../services/socket';

export default function ChatScreen({ navigation, route }) {
  const { rideId, otherUser, userType } = route.params;
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [currentUserId, setCurrentUserId] = useState(null);
  const [currentUserName, setCurrentUserName] = useState('');
  const flatListRef = useRef(null);

  useEffect(() => {
    loadUser();
    setupSocketListeners();

    return () => {
      socketService.off('newMessage');
      socketService.off('messageHistory');
    };
  }, []);

  const loadUser = async () => {
    const userData = await AsyncStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      setCurrentUserId(user.id);
      setCurrentUserName(user.name); // ✅ FIXED: Set current user name
      
      console.log('✅ Chat loaded:', {
        currentUser: user.name,
        otherUser: otherUser?.name,
        rideId: rideId
      });
      
      // Request message history
      socketService.emit('getChatHistory', { rideId });
    }
  };

  const setupSocketListeners = () => {
    socketService.on('newMessage', (message) => {
      console.log('📨 New message received:', message);
      if (message.rideId === rideId) {
        setMessages(prev => [...prev, message]);
        scrollToBottom();
      }
    });

    socketService.on('messageHistory', (history) => {
      console.log('📜 Message history loaded:', history.length);
      setMessages(history);
      scrollToBottom();
    });
  };

  const sendMessage = () => {
    if (!inputText.trim()) return;

    const message = {
      rideId: rideId,
      senderId: currentUserId,
      senderName: currentUserName, // ✅ FIXED: Use actual current user name
      text: inputText.trim(),
      timestamp: new Date().toISOString()
    };

    console.log('📤 Sending message:', message);
    socketService.emit('sendMessage', message);
    
    setInputText('');
    scrollToBottom();
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const renderMessage = ({ item }) => {
    const isMyMessage = item.senderId === currentUserId;
    
    return (
      <View style={[styles.messageContainer, isMyMessage ? styles.myMessage : styles.theirMessage]}>
        {!isMyMessage && (
          <Text style={styles.senderName}>{item.senderName || 'User'}</Text>
        )}
        <Text style={styles.messageText}>{item.text}</Text>
        <Text style={styles.messageTime}>
          {new Date(item.timestamp).toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </Text>
      </View>
    );
  };

 return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backButton}>←</Text>
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>{otherUser?.name || 'Chat'}</Text>
            <Text style={styles.headerSubtitle}>
              {userType === 'rider' ? 'Your Driver' : 'Your Rider'}
            </Text>
          </View>
          <View style={{ width: 40 }} />
        </View>

        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item, index) => item._id?.toString() || index.toString()}
          contentContainerStyle={styles.messagesList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>💬</Text>
              <Text style={styles.emptyText}>No messages yet</Text>
            </View>
          }
        />

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Type a message..."
            placeholderTextColor="#999"
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
          />
          <TouchableOpacity 
            style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
            onPress={sendMessage}
            disabled={!inputText.trim()}
          >
            <Text style={styles.sendButtonText}>Send</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: COLORS.primary
  },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    padding: 20, 
    paddingTop: 10, // ✅ Adjust for SafeAreaView
    backgroundColor: COLORS.secondary 
  },
  backButton: { fontSize: 30, color: COLORS.accent },
  headerInfo: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.text },
  headerSubtitle: { fontSize: 14, color: COLORS.text, opacity: 0.7 },
  messagesList: { 
    padding: 20, 
    paddingBottom: 10 
  },
  emptyContainer: { alignItems: 'center', marginTop: 100 },
  emptyIcon: { fontSize: 80, marginBottom: 20 },
  emptyText: { fontSize: 18, color: COLORS.text, fontWeight: 'bold' },
  inputContainer: { 
    flexDirection: 'row', 
    padding: 15, 
    backgroundColor: COLORS.secondary, 
    alignItems: 'flex-end',
    paddingBottom: Platform.OS === 'android' ? 25 : 15 // ✅ Android nav button fix
  },
  input: { 
    flex: 1, 
    backgroundColor: COLORS.primary, 
    borderRadius: 25, 
    paddingHorizontal: 20, 
    paddingVertical: 12, 
    color: COLORS.text, 
    fontSize: 16, 
    maxHeight: 100, 
    marginRight: 10 
  },
  sendButton: { 
    backgroundColor: COLORS.accent, 
    borderRadius: 25, 
    paddingHorizontal: 25, 
    paddingVertical: 12, 
    justifyContent: 'center' 
  },
  sendButtonDisabled: { opacity: 0.5 },
  sendButtonText: { fontSize: 16, fontWeight: 'bold', color: COLORS.textDark }
});