import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useFonts } from 'expo-font';
import { MaterialIcons, MaterialCommunityIcons, FontAwesome } from '@expo/vector-icons';
import { PaperProvider } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import {
  getShippingAddresses,
  createShippingAddress,
  updateShippingAddress,
  deleteShippingAddress,
} from '../api/api';

interface Address {
  id: number;
  title: string;
  street_address: string;
  city: string;
  county: string;
  postal_code: string;
  phone_number: string;
  is_default: boolean;
}

export default function ShippingAddressScreen() {
  const navigation = useNavigation();
  const [fontsLoaded] = useFonts({
    'PlusJakartaSans-Regular': require('../../assets/fonts/NotoSans-Regular.ttf'),
    'NotoSans-Regular': require('../../assets/fonts/NotoSans-Regular.ttf'),
  });

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [newAddress, setNewAddress] = useState({
    title: '',
    street_address: '',
    city: '',
    county: '',
    postal_code: '',
    phone_number: '',
    is_default: false,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<number | null>(null);

  useEffect(() => {
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    try {
      setLoading(true);
      const response = await getShippingAddresses();
      setAddresses(response.data);
      setLoading(false);
    } catch (err: any) {
      console.error('Fetch Addresses Error:', err);
      setError('Failed to fetch addresses');
      setLoading(false);
    }
  };

  const handleAddOrUpdateAddress = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      const data = {
        ...newAddress,
        is_default: newAddress.is_default,
      };

      let response;
      if (editingAddressId) {
        // Update existing address
        response = await updateShippingAddress(editingAddressId, data);
        setAddresses(
          addresses.map((addr) =>
            addr.id === editingAddressId ? response.data : addr
          )
        );
        Alert.alert('Success', 'Address updated successfully!');
      } else {
        // Create new address
        response = await createShippingAddress(data);
        setAddresses([...addresses, response.data]);
        Alert.alert('Success', 'Address added successfully!');
      }

      // Reset form
      setNewAddress({
        title: '',
        street_address: '',
        city: '',
        county: '',
        postal_code: '',
        phone_number: '',
        is_default: false,
      });
      setEditingAddressId(null);
    } catch (err: any) {
      console.error('Address Operation Error:', err.response?.data);
      let errorMessage = 'Failed to save address';
      if (err.response?.data) {
        errorMessage = 'Please fix the following errors:';
        Object.entries(err.response.data).forEach(([field, errors]) => {
          errorMessage += `\n• ${field}: ${
            Array.isArray(errors) ? errors.join(', ') : errors
          }`;
        });
      }
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditAddress = (address: Address) => {
    setNewAddress({
      title: address.title,
      street_address: address.street_address,
      city: address.city,
      county: address.county,
      postal_code: address.postal_code,
      phone_number: address.phone_number,
      is_default: address.is_default,
    });
    setEditingAddressId(address.id);
  };

  const handleDeleteAddress = async (id: number) => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this address?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteShippingAddress(id);
              setAddresses(addresses.filter((addr) => addr.id !== id));
              Alert.alert('Success', 'Address deleted successfully!');
            } catch (err: any) {
              console.error('Delete Address Error:', err);
              setError('Failed to delete address');
            }
          },
        },
      ]
    );
  };

  const handleSetDefault = async (id: number) => {
    try {
      const address = addresses.find((addr) => addr.id === id);
      if (!address) return;
      const response = await updateShippingAddress(id, {
        ...address,
        is_default: true,
      });
      setAddresses(
        addresses.map((addr) =>
          addr.id === id
            ? response.data
            : { ...addr, is_default: false }
        )
      );
      Alert.alert('Success', 'Default address updated!');
    } catch (err: any) {
      console.error('Set Default Address Error:', err);
      setError('Failed to set default address');
    }
  };

  if (!fontsLoaded || loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#607afb" />
      </View>
    );
  }

  return (
    <PaperProvider>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <MaterialIcons name="arrow-back" size={24} color="#0d0f1c" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Shipping Addresses</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView style={styles.scrollView}>
          <View style={styles.formContainer}>
            {error && <Text style={styles.errorText}>{error}</Text>}

            {/* Address Form */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Title (e.g., Home, Work)</Text>
              <TextInput
                style={styles.input}
                value={newAddress.title}
                onChangeText={(text) =>
                  setNewAddress({ ...newAddress, title: text })
                }
                placeholder="Enter address title"
                placeholderTextColor="#47569e"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Street Address</Text>
              <TextInput
                style={styles.input}
                value={newAddress.street_address}
                onChangeText={(text) =>
                  setNewAddress({ ...newAddress, street_address: text })
                }
                placeholder="Enter street address"
                placeholderTextColor="#47569e"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>City</Text>
              <TextInput
                style={styles.input}
                value={newAddress.city}
                onChangeText={(text) =>
                  setNewAddress({ ...newAddress, city: text })
                }
                placeholder="Enter city"
                placeholderTextColor="#47569e"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>County</Text>
              <TextInput
                style={styles.input}
                value={newAddress.county}
                onChangeText={(text) =>
                  setNewAddress({ ...newAddress, county: text })
                }
                placeholder="Enter county"
                placeholderTextColor="#47569e"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Postal Code</Text>
              <TextInput
                style={styles.input}
                value={newAddress.postal_code}
                onChangeText={(text) =>
                  setNewAddress({ ...newAddress, postal_code: text })
                }
                placeholder="Enter postal code"
                placeholderTextColor="#47569e"
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Phone Number</Text>
              <TextInput
                style={styles.input}
                value={newAddress.phone_number}
                onChangeText={(text) =>
                  setNewAddress({ ...newAddress, phone_number: text })
                }
                placeholder="Enter phone number"
                placeholderTextColor="#47569e"
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.checkboxContainer}>
              <TouchableOpacity
                style={styles.checkbox}
                onPress={() =>
                  setNewAddress({
                    ...newAddress,
                    is_default: !newAddress.is_default,
                  })
                }
              >
                <View style={styles.checkboxCircle}>
                  {newAddress.is_default && <View style={styles.checkboxDot} />}
                </View>
                <Text style={styles.checkboxLabel}>Set as Default</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[
                styles.updateButton,
                isSubmitting && styles.updateButtonDisabled,
              ]}
              onPress={handleAddOrUpdateAddress}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#f8f9fc" />
              ) : (
                <Text style={styles.updateButtonText}>
                  {editingAddressId ? 'Update Address' : 'Add Address'}
                </Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Address List */}
          <View style={styles.addressList}>
            <Text style={styles.sectionTitle}>Saved Addresses</Text>
            {addresses.length === 0 ? (
              <Text style={styles.noAddressesText}>No addresses saved yet.</Text>
            ) : (
              addresses.map((address) => (
                <View key={address.id} style={styles.addressCard}>
                  <View style={styles.addressInfo}>
                    <Text style={styles.addressTitle}>
                      {address.title} {address.is_default && '(Default)'}
                    </Text>
                    <Text style={styles.addressText}>
                      {address.street_address}, {address.city}
                    </Text>
                    <Text style={styles.addressText}>
                      {address.county} {address.postal_code}
                    </Text>
                    <Text style={styles.addressText}>
                      Phone: {address.phone_number}
                    </Text>
                  </View>
                  <View style={styles.addressActions}>
                    <TouchableOpacity
                      onPress={() => handleEditAddress(address)}
                      style={styles.actionButton}
                    >
                      <MaterialIcons name="edit" size={20} color="#607afb" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleDeleteAddress(address.id)}
                      style={styles.actionButton}
                    >
                      <MaterialIcons name="delete" size={20} color="#ff0000" />
                    </TouchableOpacity>
                    {!address.is_default && (
                      <TouchableOpacity
                        onPress={() => handleSetDefault(address.id)}
                        style={styles.actionButton}
                      >
                        <MaterialIcons
                          name="star-border"
                          size={20}
                          color="#607afb"
                        />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              ))
            )}
          </View>
        </ScrollView>

        <View style={styles.bottomNav}>
          <TouchableOpacity
            style={styles.navItem}
            onPress={() => navigation.navigate('Home')}
          >
            <MaterialCommunityIcons
              name="home-outline"
              size={24}
              color="#47569e"
            />
            <Text style={styles.navText}>Home</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.navItem}
            onPress={() => navigation.navigate('Cart')}
          >
            <MaterialCommunityIcons
              name="cart-outline"
              size={24}
              color="#47569e"
            />
            <Text style={styles.navText}>Cart</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.navItem}
            onPress={() => navigation.navigate('Notifications')}
          >
            <MaterialIcons
              name="notifications-none"
              size={24}
              color="#47569e"
            />
            <Text style={styles.navText}>Notification</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem}>
            <FontAwesome name="user" size={20} color="#0d0f1c" />
            <Text style={[styles.navText, { color: '#0d0f1c' }]}>Profile</Text>
          </TouchableOpacity>
        </View>
      </View>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingBottom: 8,
    backgroundColor: '#f8f9fc',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0d0f1c',
    textAlign: 'center',
    flex: 1,
    marginRight: 24,
  },
  scrollView: {
    flex: 1,
  },
  formContainer: {
    paddingHorizontal: 16,
  },
  inputContainer: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#0d0f1c',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#e6e9f4',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#0d0f1c',
    height: 56,
  },
  checkboxContainer: {
    marginVertical: 12,
  },
  checkbox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
  },
  checkboxCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#ced2e9',
    marginRight: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#607afb',
  },
  checkboxLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#0d0f1c',
  },
  updateButton: {
    backgroundColor: '#607afb',
    borderRadius: 24,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 16,
  },
  updateButtonDisabled: {
    backgroundColor: '#a0b4ff',
  },
  updateButtonText: {
    color: '#f8f9fc',
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorText: {
    fontSize: 16,
    color: '#ff0000',
    textAlign: 'center',
    marginBottom: 16,
  },
  addressList: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0d0f1c',
    marginVertical: 16,
  },
  addressCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e6e9f4',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  addressInfo: {
    flex: 1,
  },
  addressTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0d0f1c',
    marginBottom: 4,
  },
  addressText: {
    fontSize: 14,
    color: '#47569e',
    marginBottom: 2,
  },
  addressActions: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: 8,
  },
  noAddressesText: {
    fontSize: 16,
    color: '#47569e',
    textAlign: 'center',
    marginVertical: 16,
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: '#e6e9f4',
    backgroundColor: '#f8f9fc',
  },
  navItem: {
    alignItems: 'center',
    padding: 8,
  },
  navText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#47569e',
    marginTop: 4,
  },
});