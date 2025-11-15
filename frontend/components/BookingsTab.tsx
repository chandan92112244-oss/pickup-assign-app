import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Modal,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

interface Driver {
  id: string;
  name: string;
  phone: string;
  vehicle_number: string;
  vehicle_type: string;
  status: string;
}

interface Booking {
  id: string;
  pickup_address: string;
  pickup_phone: string;
  delivery_address: string;
  delivery_phone: string;
  goods_description?: string;
  payment_method: string;
  status: string;
  assigned_driver_details?: any;
  created_at: string;
}

export default function BookingsTab() {
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [assignModalVisible, setAssignModalVisible] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [bookingsRes, driversRes] = await Promise.all([
        axios.get(`${BACKEND_URL}/api/bookings`),
        axios.get(`${BACKEND_URL}/api/drivers`),
      ]);
      setBookings(bookingsRes.data);
      setDrivers(driversRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      Alert.alert('Error', 'Failed to load data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, []);

  const handleAssignDriver = async (driverId: string) => {
    if (!selectedBooking) return;

    setAssigning(true);
    try {
      await axios.put(`${BACKEND_URL}/api/bookings/${selectedBooking.id}/assign`, {
        driver_id: driverId,
      });

      Alert.alert('Success', 'Driver assigned successfully');
      setAssignModalVisible(false);
      setSelectedBooking(null);
      fetchData();
    } catch (error) {
      console.error('Error assigning driver:', error);
      Alert.alert('Error', 'Failed to assign driver');
    } finally {
      setAssigning(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await AsyncStorage.removeItem('adminLoggedIn');
          await AsyncStorage.removeItem('adminUsername');
          router.replace('/');
        },
      },
    ]);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return '#FFA500';
      case 'assigned':
        return '#4A90E2';
      case 'completed':
        return '#4CAF50';
      case 'cancelled':
        return '#F44336';
      default:
        return '#999';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderBookingItem = ({ item }: { item: Booking }) => (
    <View style={styles.bookingCard}>
      <View style={styles.bookingHeader}>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {item.status.toUpperCase()}
          </Text>
        </View>
        <Text style={styles.dateText}>{formatDate(item.created_at)}</Text>
      </View>

      <View style={styles.bookingDetails}>
        <View style={styles.detailRow}>
          <Ionicons name="location" size={16} color="#4A90E2" />
          <View style={styles.detailContent}>
            <Text style={styles.detailLabel}>Pickup:</Text>
            <Text style={styles.detailValue}>{item.pickup_address}</Text>
            <Text style={styles.detailPhone}>{item.pickup_phone}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.detailRow}>
          <Ionicons name="flag" size={16} color="#4A90E2" />
          <View style={styles.detailContent}>
            <Text style={styles.detailLabel}>Delivery:</Text>
            <Text style={styles.detailValue}>{item.delivery_address}</Text>
            <Text style={styles.detailPhone}>{item.delivery_phone}</Text>
          </View>
        </View>

        {item.goods_description && (
          <>
            <View style={styles.divider} />
            <View style={styles.detailRow}>
              <Ionicons name="cube" size={16} color="#4A90E2" />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Goods:</Text>
                <Text style={styles.detailValue}>{item.goods_description}</Text>
              </View>
            </View>
          </>
        )}

        <View style={styles.divider} />

        <View style={styles.detailRow}>
          <Ionicons name="wallet" size={16} color="#4A90E2" />
          <View style={styles.detailContent}>
            <Text style={styles.detailLabel}>Payment:</Text>
            <Text style={styles.detailValue}>{item.payment_method.toUpperCase()}</Text>
          </View>
        </View>

        {item.assigned_driver_details && (
          <>
            <View style={styles.divider} />
            <View style={styles.driverInfo}>
              <Ionicons name="car" size={16} color="#4CAF50" />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Assigned Driver:</Text>
                <Text style={styles.driverName}>{item.assigned_driver_details.name}</Text>
                <Text style={styles.detailPhone}>{item.assigned_driver_details.phone}</Text>
                <Text style={styles.detailPhone}>
                  {item.assigned_driver_details.vehicle_type} - {item.assigned_driver_details.vehicle_number}
                </Text>
              </View>
            </View>
          </>
        )}
      </View>

      {item.status === 'pending' && (
        <TouchableOpacity
          style={styles.assignButton}
          onPress={() => {
            setSelectedBooking(item);
            setAssignModalVisible(true);
          }}
        >
          <Ionicons name="person-add" size={18} color="#FFF" />
          <Text style={styles.assignButtonText}>Assign Driver</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4A90E2" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header with Logout */}
      <View style={styles.topBar}>
        <Text style={styles.topBarText}>Total Bookings: {bookings.length}</Text>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Ionicons name="log-out-outline" size={20} color="#F44336" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={bookings}
        renderItem={renderBookingItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#4A90E2']} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={64} color="#CCC" />
            <Text style={styles.emptyText}>No bookings yet</Text>
          </View>
        }
      />

      {/* Assign Driver Modal */}
      <Modal visible={assignModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Driver</Text>
              <TouchableOpacity onPress={() => setAssignModalVisible(false)}>
                <Ionicons name="close" size={24} color="#1A1A1A" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.driverList}>
              {drivers
                .filter((d) => d.status === 'available')
                .map((driver) => (
                  <TouchableOpacity
                    key={driver.id}
                    style={styles.driverItem}
                    onPress={() => handleAssignDriver(driver.id)}
                    disabled={assigning}
                  >
                    <View style={styles.driverItemContent}>
                      <Ionicons name="person-circle" size={40} color="#4A90E2" />
                      <View style={styles.driverItemDetails}>
                        <Text style={styles.driverItemName}>{driver.name}</Text>
                        <Text style={styles.driverItemPhone}>{driver.phone}</Text>
                        <Text style={styles.driverItemVehicle}>
                          {driver.vehicle_type} - {driver.vehicle_number}
                        </Text>
                      </View>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#999" />
                  </TouchableOpacity>
                ))}

              {drivers.filter((d) => d.status === 'available').length === 0 && (
                <View style={styles.noDrivers}>
                  <Ionicons name="alert-circle-outline" size={48} color="#999" />
                  <Text style={styles.noDriversText}>No available drivers</Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  topBarText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F44336',
  },
  listContent: {
    padding: 16,
    paddingBottom: 80,
  },
  bookingCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  dateText: {
    fontSize: 12,
    color: '#999',
  },
  bookingDetails: {
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    gap: 12,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    color: '#1A1A1A',
    fontWeight: '500',
  },
  detailPhone: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  driverInfo: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: '#F0F7FF',
    padding: 12,
    borderRadius: 8,
  },
  driverName: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
  },
  assignButton: {
    backgroundColor: '#4A90E2',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
    marginTop: 12,
  },
  assignButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  driverList: {
    padding: 16,
  },
  driverItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    marginBottom: 12,
  },
  driverItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  driverItemDetails: {
    flex: 1,
  },
  driverItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  driverItemPhone: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  driverItemVehicle: {
    fontSize: 13,
    color: '#4A90E2',
    marginTop: 2,
  },
  noDrivers: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noDriversText: {
    fontSize: 14,
    color: '#999',
    marginTop: 12,
  },
});
