// safely-home-frontend/screens/SupportScreen.js
// ✅ WITH CUSTOM ALERTS

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Linking,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../config';
import { showAlert } from '../components/CustomAlert';

export default function SupportScreen({ navigation }) {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const categories = [
    { id: 'technical', icon: '🔧', label: 'Technical Issue' },
    { id: 'account', icon: '👤', label: 'Account Problem' },
    { id: 'payment', icon: '💳', label: 'Payment Issue' },
    { id: 'safety', icon: '🛡️', label: 'Safety Concern' },
    { id: 'feedback', icon: '💬', label: 'Feedback' },
    { id: 'other', icon: '📝', label: 'Other' }
  ];

  const faqs = [
    {
      question: 'How do I book a ride?',
      answer: 'Tap "Book Your Ride" on the home screen, enter your pickup and destination, then confirm your booking.'
    },
    {
      question: 'How do I change my driver preference?',
      answer: 'Go to Settings > Driver Preference to choose between male, female, or any driver.'
    },
    {
      question: 'What if I need to cancel a ride?',
      answer: 'You can cancel a ride from the tracking screen before the driver arrives. Note that cancellation policies may apply.'
    },
    {
      question: 'How is my safety ensured?',
      answer: 'All drivers are verified with facial recognition. You can also share your ride details with contacts and use the emergency button if needed.'
    },
    {
      question: 'How do payments work?',
      answer: 'Payments are processed securely after each ride. You can view your payment history in the ride history section.'
    }
  ];

  const handleSubmit = async () => {
    if (!selectedCategory) {
      showAlert(
        'Category Required',
        'Please select a category for your support request',
        [{ text: 'OK' }],
        { type: 'warning' }
      );
      return;
    }

    if (!message.trim()) {
      showAlert(
        'Description Required',
        'Please describe your issue so we can help you better',
        [{ text: 'OK' }],
        { type: 'warning' }
      );
      return;
    }

    setSubmitting(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      showAlert(
        'Request Submitted ✓',
        'Thank you for contacting us. Our support team will respond to your request within 24-48 hours via email.',
        [
          {
            text: 'OK',
            onPress: () => {
              setMessage('');
              setSelectedCategory(null);
            }
          }
        ],
        { type: 'success' }
      );
    } catch (error) {
      showAlert(
        'Submission Failed',
        'Failed to send support request. Please try again or contact us directly.',
        [{ text: 'OK' }],
        { type: 'error' }
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleCall = () => {
    const phoneNumber = 'tel:+923332859061';
    Linking.canOpenURL(phoneNumber)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(phoneNumber);
        } else {
          showAlert(
            'Phone Not Available',
            'Phone dialer is not available on this device. Please call: +92 (333) 2859061',
            [{ text: 'OK' }],
            { type: 'error' }
          );
        }
      })
      .catch((err) => {
        console.error('Error opening phone:', err);
        showAlert(
          'Error',
          'Failed to open phone dialer',
          [{ text: 'OK' }],
          { type: 'error' }
        );
      });
  };

  const handleEmail = () => {
    const email = 'mailto:support@safelyhome.com?subject=Support Request';
    Linking.openURL(email).catch((err) => {
      console.error('Error opening email:', err);
      showAlert(
        'Email Not Available',
        'Email client is not available. Please email us at: support@safelyhome.com',
        [{ text: 'OK' }],
        { type: 'error' }
      );
    });
  };

  const FAQItem = ({ item }) => {
    const [expanded, setExpanded] = useState(false);

    return (
      <TouchableOpacity
        style={styles.faqItem}
        onPress={() => setExpanded(!expanded)}
        activeOpacity={0.7}
      >
        <View style={styles.faqHeader}>
          <Text style={styles.faqQuestion}>{item.question}</Text>
          <Text style={styles.faqIcon}>{expanded ? '−' : '+'}</Text>
        </View>
        {expanded && (
          <Text style={styles.faqAnswer}>{item.answer}</Text>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help & Support</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Quick Contact */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Us</Text>
          <View style={styles.contactButtons}>
            <TouchableOpacity
              style={styles.contactButton}
              onPress={handleCall}
            >
              <Text style={styles.contactIcon}>📞</Text>
              <Text style={styles.contactLabel}>Call Support</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.contactButton}
              onPress={handleEmail}
            >
              <Text style={styles.contactIcon}>✉️</Text>
              <Text style={styles.contactLabel}>Email Us</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* FAQs */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
          {faqs.map((faq, index) => (
            <FAQItem key={index} item={faq} />
          ))}
        </View>

        {/* Submit Request */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Submit a Support Request</Text>

          <Text style={styles.label}>Category</Text>
          <View style={styles.categoriesGrid}>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.categoryCard,
                  selectedCategory === cat.id && styles.categoryCardSelected
                ]}
                onPress={() => setSelectedCategory(cat.id)}
              >
                <Text style={styles.categoryIcon}>{cat.icon}</Text>
                <Text
                  style={[
                    styles.categoryLabel,
                    selectedCategory === cat.id && styles.categoryLabelSelected
                  ]}
                >
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Describe Your Issue</Text>
          <TextInput
            style={styles.messageInput}
            placeholder="Please provide as much detail as possible..."
            placeholderTextColor="#999"
            value={message}
            onChangeText={setMessage}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
          />

          <TouchableOpacity
            style={[
              styles.submitButton,
              (!selectedCategory || !message.trim() || submitting) && styles.submitButtonDisabled
            ]}
            onPress={handleSubmit}
            disabled={!selectedCategory || !message.trim() || submitting}
          >
            {submitting ? (
              <ActivityIndicator color={COLORS.textDark} />
            ) : (
              <Text style={styles.submitButtonText}>Send Request</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* App Info */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Safely Home Support</Text>
          <Text style={styles.infoText}>
            Email: support@safelyhome.com{'\n'}
            Phone: +92 (333) 2859061{'\n'}
            Hours: 24/7 Support Available
          </Text>
        </View>

        <View style={{ height: 50 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.primary },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 10
  },
  backButton: { fontSize: 30, color: COLORS.accent },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.text },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 30 },

  section: {
    marginTop: 25
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 15
  },

  contactButtons: {
    flexDirection: 'row',
    gap: 12
  },
  contactButton: {
    flex: 1,
    backgroundColor: COLORS.secondary,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center'
  },
  contactIcon: {
    fontSize: 32,
    marginBottom: 8
  },
  contactLabel: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '600'
  },

  faqItem: {
    backgroundColor: COLORS.secondary,
    borderRadius: 12,
    padding: 15,
    marginBottom: 10
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  faqQuestion: {
    flex: 1,
    fontSize: 15,
    color: COLORS.text,
    fontWeight: '600',
    marginRight: 10
  },
  faqIcon: {
    fontSize: 20,
    color: COLORS.accent,
    fontWeight: 'bold'
  },
  faqAnswer: {
    fontSize: 14,
    color: COLORS.text,
    opacity: 0.8,
    marginTop: 10,
    lineHeight: 20
  },

  label: {
    fontSize: 14,
    color: COLORS.text,
    marginBottom: 12,
    marginLeft: 5
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20
  },
  categoryCard: {
    width: '30%',
    backgroundColor: COLORS.secondary,
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent'
  },
  categoryCardSelected: {
    borderColor: COLORS.accent,
    backgroundColor: COLORS.accent + '20'
  },
  categoryIcon: {
    fontSize: 28,
    marginBottom: 8
  },
  categoryLabel: {
    fontSize: 12,
    color: COLORS.text,
    textAlign: 'center'
  },
  categoryLabelSelected: {
    fontWeight: 'bold',
    color: COLORS.accent
  },

  messageInput: {
    backgroundColor: COLORS.secondary,
    borderRadius: 12,
    padding: 15,
    color: COLORS.text,
    fontSize: 14,
    height: 120,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.accent + '30'
  },

  submitButton: {
    backgroundColor: COLORS.accent,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center'
  },
  submitButtonDisabled: {
    opacity: 0.5
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.textDark
  },

  infoCard: {
    backgroundColor: COLORS.secondary,
    borderRadius: 15,
    padding: 20,
    marginTop: 25
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 10
  },
  infoText: {
    fontSize: 14,
    color: COLORS.text,
    opacity: 0.8,
    lineHeight: 22
  }
});