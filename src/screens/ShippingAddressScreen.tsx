import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as Font from 'expo-font';
import { Ionicons } from '@expo/vector-icons';
import { getShippingAddresses, addShippingAddress, setCurrentAddress } from '../api/api';

interface ShippingAddress {
  id: number;
  address: string;
  current_address: boolean;
}

const ShippingAddressScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const fromCheckout = route.params?.fromCheckout || false;
  const [addresses, setAddresses] = useState<ShippingAddress[]>([]);
  const [newAddress, setNewAddress] = useState('');
  const [loading, setLoading] = useState(true);
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadFonts();
    fetchAddresses();
  }, []);

  const loadFonts = async () => {
    try {
      await Font.loadAsync({
        'NotoSans-Regular': require('../../assets/fonts/NotoSans-Regular.ttf'),
        'NotoSans-SemiBold': require('../../assets/fonts/NotoSans-Regular.ttf'),
      });
      setFontsLoaded(true);
    } catch (error) {
      console.error('Error loading fonts:', error);
    }
  };

  const fetchAddresses = async () => {
    try {
      setLoading(true);
      const response = await getShippingAddresses();
      setAddresses(response.data);
    } catch (error) {
      console.error('Error fetching addresses:', error);
      Alert.alert('Error', 'Failed to load shipping addresses');
    } finally {
      setLoading(false);
    }
  };

  const handleAddAddress = async () => {
    if (!newAddress.trim()) {
      Alert.alert('Error', 'Please enter a valid address');
      return;
    }
    try {
      setSubmitting(true);
      await addShippingAddress({ address: newAddress, current_address: addresses.length === 0 });
      setNewAddress('');
      fetchAddresses();
      Alert.alert('Success', 'Address added successfully');
    } catch (error) {
      console.error('Error adding address:', error);
      Alert.alert('Error', 'Failed to add address');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSelectAddress = async (addressId: number) => {
    try {
      await setCurrentAddress(addressId);
      fetchAddresses();
      if (fromCheckout) {
        const selectedAddress = addresses.find(addr => addr.id === addressId);
        navigation.navigate('Checkout', { selectedAddress: selectedAddress?.address });
      } else {
        Alert.alert('Success', 'Address set as default');
      }
    } catch (error) {
      console.error('Error setting current address:', error);
      Alert.alert('Error', 'Failed to set default address');
    }
  };

  const renderAddress = ({ item }: { item: ShippingAddress }) => (
    <TouchableOpacity
      style={[styles.addressContainer, item.current_address && styles.currentAddress]}
      onPress={() => handleSelectAddress(item.id)}
    >
      <Text style={styles.addressText}>{item.address}</Text>
      {item.current_address && (
        <Text style={styles.currentLabel}>Default</Text>
      )}
    </TouchableOpacity>
  );

  if (!fontsLoaded || loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#94e0b2" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={28} color="#94e0b2" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Shipping Addresses</Text>
      </View>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Enter new address"
          placeholderTextColor="#94e0b2"
          value={newAddress}
          onChangeText={setNewAddress}
        />
        <TouchableOpacity
          style={[styles.addButton, submitting && styles.disabledButton]}
          onPress={handleAddAddress}
          disabled={submitting}
        >
          <Text style={styles.addButtonText}>Add Address</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={addresses}
        renderItem={renderAddress}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.addressList}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No addresses found</Text>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#141f18',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#122118',
    borderBottomWidth: 0.5,
    borderBottomColor: '#264532',
  },
  headerTitle: {
    color: 'white',
    fontSize: 20,
    fontFamily: 'NotoSans-SemiBold',
    marginLeft: 10,
  },
  inputContainer: {
    padding: 15,
  },
  input: {
    backgroundColor: '#122118',
    color: '#ffffff',
    fontFamily: 'NotoSans-Regular',
    fontSize: 14,
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  addButton: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#2e4f30',
    opacity: 0.6,
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontFamily: 'NotoSans-SemiBold',
  },
  addressList: {
    padding: 15,
  },
  addressContainer: {
    backgroundColor: '#122118',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
  },
  currentAddress: {
    borderColor: '#94e0b2',
    borderWidth: 1,
  },
  addressText: {
    color: '#ffffff',
    fontSize: 14,
    fontFamily: 'NotoSans-Regular',
  },
  currentLabel: {
    color: '#94e0b2',
    fontSize: 12,
    fontFamily: 'NotoSans-SemiBold',
    marginTop: 5,
  },
  emptyText: {
    color: '#ffffff',
    fontSize: 16,
    fontFamily: 'NotoSans-Regular',
    textAlign: 'center',
    marginTop: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#141f18',
  },
});

export default ShippingAddressScreen;