import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Modal,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

interface Driver {
  id: string;
  name: string;
  phone: string;
  vehicle_number: string;
  address: string;
  vehicle_type: string;
  account_details: string;
  status: string;
}

const VEHICLE_TYPES = ['E-Rickshaw', 'Toto', 'Auto', 'Tempo', 'Other'];

export default function DriversTab() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    vehicle_number: '',
    address: '',
    vehicle_type: 'E-Rickshaw',
    account_details: '',
  });

  useEffect(() => {
    fetchDrivers();
  }, []);

  const fetchDrivers = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/drivers`);
      setDrivers(response.data);
    } catch (error) {
      console.error('Error fetching drivers:', error);
      Alert.alert('Error', 'Failed to load drivers');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchDrivers();
  }, []);

  const resetForm = () => {
    setFormData({
      name: '',
      phone: '',
      vehicle_number: '',
      address: '',
      vehicle_type: 'E-Rickshaw',
      account_details: '',
    });
    setEditingDriver(null);
  };

  const handleAddDriver = () => {
    resetForm();
    setModalVisible(true);
  };

  const handleEditDriver = (driver: Driver) => {
    setFormData({
      name: driver.name,
      phone: driver.phone,
      vehicle_number: driver.vehicle_number,
      address: driver.address,
      vehicle_type: driver.vehicle_type,
      account_details: driver.account_details,
    });
    setEditingDriver(driver);
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.phone || !formData.vehicle_number) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    setSaving(true);
    try {
      if (editingDriver) {
        await axios.put(`${BACKEND_URL}/api/drivers/${editingDriver.id}`, formData);
        Alert.alert('Success', 'Driver updated successfully');
      } else {
        await axios.post(`${BACKEND_URL}/api/drivers`, formData);
        Alert.alert('Success', 'Driver added successfully');
      }

      setModalVisible(false);
      resetForm();
      fetchDrivers();
    } catch (error) {
      console.error('Error saving driver:', error);
      Alert.alert('Error', 'Failed to save driver');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteDriver = (driver: Driver) => {
    Alert.alert('Delete Driver', `Are you sure you want to delete ${driver.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await axios.delete(`${BACKEND_URL}/api/drivers/${driver.id}`);
            Alert.alert('Success', 'Driver deleted successfully');
            fetchDrivers();
          } catch (error) {
            console.error('Error deleting driver:', error);
            Alert.alert('Error', 'Failed to delete driver');
          }
        },
      },
    ]);
  };

  const renderDriverItem = ({ item }: { item: Driver }) => (
    <View style={styles.driverCard}>
      <View style={styles.driverHeader}>
        <View style={styles.driverHeaderLeft}>
          <Ionicons name="person-circle" size={40} color="#4A90E2" />
          <View style={styles.driverHeaderText}>
            <Text style={styles.driverName}>{item.name}</Text>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: item.status === 'available' ? '#4CAF50' : '#FFA500' },
              ]}
            >
              <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.driverDetails}>
        <View style={styles.detailRow}>
          <Ionicons name="call" size={16} color="#4A90E2" />
          <Text style={styles.detailText}>{item.phone}</Text>
        </View>

        <View style={styles.detailRow}>
          <Ionicons name="car" size={16} color="#4A90E2" />
          <Text style={styles.detailText}>
            {item.vehicle_type} - {item.vehicle_number}
          </Text>
        </View>

        <View style={styles.detailRow}>
          <Ionicons name="location" size={16} color="#4A90E2" />
          <Text style={styles.detailText}>{item.address}</Text>
        </View>

        <View style={styles.detailRow}>
          <Ionicons name="wallet" size={16} color="#4A90E2" />
          <Text style={styles.detailText}>{item.account_details}</Text>
        </View>
      </View>

      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.actionButton, styles.editButton]}
          onPress={() => handleEditDriver(item)}
        >
          <Ionicons name="create" size={18} color="#4A90E2" />
          <Text style={styles.editButtonText}>Edit</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => handleDeleteDriver(item)}
        >
          <Ionicons name="trash" size={18} color="#F44336" />
          <Text style={styles.deleteButtonText}>Delete</Text>
        </TouchableOpacity>
      </View>
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
      {/* Add Button */}
      <TouchableOpacity style={styles.addButton} onPress={handleAddDriver}>
        <Ionicons name="add-circle" size={24} color="#FFF" />
        <Text style={styles.addButtonText}>Add Driver</Text>
      </TouchableOpacity>

      <FlatList
        data={drivers}
        renderItem={renderDriverItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#4A90E2']} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="car-outline" size={64} color="#CCC" />
            <Text style={styles.emptyText}>No drivers added yet</Text>
            <TouchableOpacity style={styles.emptyAddButton} onPress={handleAddDriver}>
              <Text style={styles.emptyAddButtonText}>Add First Driver</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {/* Add/Edit Driver Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingDriver ? 'Edit Driver' : 'Add Driver'}</Text>
              <TouchableOpacity
                onPress={() => {
                  setModalVisible(false);
                  resetForm();
                }}
              >
                <Ionicons name="close" size={24} color="#1A1A1A" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.form}>
              <Text style={styles.label}>Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="Driver name"
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
              />

              <Text style={styles.label}>Phone *</Text>
              <TextInput
                style={styles.input}
                placeholder="Phone number"
                value={formData.phone}
                onChangeText={(text) => setFormData({ ...formData, phone: text })}
                keyboardType="phone-pad"
                maxLength={10}
              />

              <Text style={styles.label}>Vehicle Type *</Text>
              <View style={styles.vehicleTypeContainer}>
                {VEHICLE_TYPES.map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.vehicleTypeButton,
                      formData.vehicle_type === type && styles.vehicleTypeButtonActive,
                    ]}
                    onPress={() => setFormData({ ...formData, vehicle_type: type })}
                  >
                    <Text
                      style={[
                        styles.vehicleTypeText,
                        formData.vehicle_type === type && styles.vehicleTypeTextActive,
                      ]}
                    >
                      {type}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Vehicle Number *</Text>
              <TextInput
                style={styles.input}
                placeholder="Vehicle registration number"
                value={formData.vehicle_number}
                onChangeText={(text) => setFormData({ ...formData, vehicle_number: text })}
                autoCapitalize="characters"
              />

              <Text style={styles.label}>Address</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Driver address"
                value={formData.address}
                onChangeText={(text) => setFormData({ ...formData, address: text })}
                multiline
                numberOfLines={2}
              />

              <Text style={styles.label}>Account Details</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Bank account / UPI details"
                value={formData.account_details}
                onChangeText={(text) => setFormData({ ...formData, account_details: text })}
                multiline
                numberOfLines={2}
              />

              <TouchableOpacity
                style={[styles.saveButton, saving && styles.saveButtonDisabled]}
                onPress={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={20} color="#FFF" />
                    <Text style={styles.saveButtonText}>{editingDriver ? 'Update' : 'Save'}</Text>
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
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
  addButton: {
    backgroundColor: '#4A90E2',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 8,
    gap: 8,
    shadowColor: '#4A90E2',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  addButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
    paddingBottom: 80,
  },
  driverCard: {
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
  driverHeader: {
    marginBottom: 12,
  },
  driverHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  driverHeaderText: {
    flex: 1,
  },
  driverName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFF',
  },
  driverDetails: {
    gap: 10,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  editButton: {
    backgroundColor: '#F0F7FF',
    borderWidth: 1,
    borderColor: '#4A90E2',
  },
  editButtonText: {
    color: '#4A90E2',
    fontSize: 14,
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: '#FFEBEE',
    borderWidth: 1,
    borderColor: '#F44336',
  },
  deleteButtonText: {
    color: '#F44336',
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
    marginBottom: 24,
  },
  emptyAddButton: {
    backgroundColor: '#4A90E2',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyAddButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
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
    maxHeight: '85%',
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
  form: {
    padding: 20,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#F8F9FA',
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
    minHeight: 60,
    textAlignVertical: 'top',
  },
  vehicleTypeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  vehicleTypeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#F8F9FA',
  },
  vehicleTypeButtonActive: {
    backgroundColor: '#4A90E2',
    borderColor: '#4A90E2',
  },
  vehicleTypeText: {
    fontSize: 14,
    color: '#666',
  },
  vehicleTypeTextActive: {
    color: '#FFF',
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#4A90E2',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 8,
    gap: 8,
    marginTop: 8,
    marginBottom: 24,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
