import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export default function BookingScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    pickup_address: '',
    pickup_phone: '',
    delivery_address: '',
    delivery_phone: '',
    goods_description: '',
    payment_method: 'cash',
  });

  const handleSubmit = async () => {
    // Validate
    if (!formData.pickup_address || !formData.pickup_phone || 
        !formData.delivery_address || !formData.delivery_phone) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${BACKEND_URL}/api/bookings`, formData);
      
      Alert.alert(
        'Success!',
        'Your booking has been created. Admin will assign a driver soon.',
        [
          {
            text: 'OK',
            onPress: () => router.push('/'),
          },
        ]
      );
    } catch (error) {
      console.error('Booking error:', error);
      Alert.alert('Error', 'Failed to create booking. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>New Booking</Text>
            <View style={{ width: 24 }} />
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* Pickup Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                <Ionicons name="location" size={16} color="#4A90E2" /> Pickup Details
              </Text>
              
              <Text style={styles.label}>Pickup Address *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter pickup address"
                value={formData.pickup_address}
                onChangeText={(text) => setFormData({ ...formData, pickup_address: text })}
                multiline
              />

              <Text style={styles.label}>Pickup Phone *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter phone number"
                value={formData.pickup_phone}
                onChangeText={(text) => setFormData({ ...formData, pickup_phone: text })}
                keyboardType="phone-pad"
                maxLength={10}
              />
            </View>

            {/* Delivery Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                <Ionicons name="flag" size={16} color="#4A90E2" /> Delivery Details
              </Text>
              
              <Text style={styles.label}>Delivery Address *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter delivery address"
                value={formData.delivery_address}
                onChangeText={(text) => setFormData({ ...formData, delivery_address: text })}
                multiline
              />

              <Text style={styles.label}>Delivery Phone *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter phone number"
                value={formData.delivery_phone}
                onChangeText={(text) => setFormData({ ...formData, delivery_phone: text })}
                keyboardType="phone-pad"
                maxLength={10}
              />
            </View>

            {/* Goods Description */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                <Ionicons name="cube" size={16} color="#4A90E2" /> Goods Information
              </Text>
              
              <Text style={styles.label}>Description (Optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="E.g., Furniture, boxes, etc."
                value={formData.goods_description}
                onChangeText={(text) => setFormData({ ...formData, goods_description: text })}
                multiline
                numberOfLines={3}
              />
            </View>

            {/* Payment Method */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                <Ionicons name="wallet" size={16} color="#4A90E2" /> Payment Method
              </Text>
              
              <View style={styles.paymentOptions}>
                <TouchableOpacity
                  style={[
                    styles.paymentOption,
                    formData.payment_method === 'cash' && styles.paymentOptionActive,
                  ]}
                  onPress={() => setFormData({ ...formData, payment_method: 'cash' })}
                >
                  <Ionicons
                    name="cash-outline"
                    size={24}
                    color={formData.payment_method === 'cash' ? '#4A90E2' : '#999'}
                  />
                  <Text
                    style={[
                      styles.paymentText,
                      formData.payment_method === 'cash' && styles.paymentTextActive,
                    ]}
                  >
                    Cash
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.paymentOption,
                    formData.payment_method === 'upi' && styles.paymentOptionActive,
                  ]}
                  onPress={() => setFormData({ ...formData, payment_method: 'upi' })}
                >
                  <Ionicons
                    name="phone-portrait-outline"
                    size={24}
                    color={formData.payment_method === 'upi' ? '#4A90E2' : '#999'}
                  />
                  <Text
                    style={[
                      styles.paymentText,
                      formData.payment_method === 'upi' && styles.paymentTextActive,
                    ]}
                  >
                    UPI
                  </Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.paymentNote}>Payment after delivery</Text>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.submitButton, loading && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={24} color="#FFF" />
                  <Text style={styles.submitButtonText}>Submit Booking</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  form: {
    padding: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1A1A1A',
    marginBottom: 16,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  paymentOptions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  paymentOption: {
    flex: 1,
    backgroundColor: '#FFF',
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    gap: 8,
  },
  paymentOptionActive: {
    borderColor: '#4A90E2',
    backgroundColor: '#F0F7FF',
  },
  paymentText: {
    fontSize: 14,
    color: '#999',
    fontWeight: '500',
  },
  paymentTextActive: {
    color: '#4A90E2',
    fontWeight: '600',
  },
  paymentNote: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
    marginTop: 4,
  },
  submitButton: {
    backgroundColor: '#4A90E2',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 8,
    gap: 8,
    marginTop: 16,
    shadowColor: '#4A90E2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
  },
});
