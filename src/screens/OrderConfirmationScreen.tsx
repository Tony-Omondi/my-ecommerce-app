import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { PaperProvider } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';

const OrderConfirmationScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { reference } = route.params;

  return (
    <PaperProvider>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <MaterialIcons name="arrow-back" size={24} color="#0d0f1c" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Order Confirmation</Text>
          <View style={styles.headerPlaceholder} />
        </View>
        <View style={styles.content}>
          <Text style={styles.confirmationText}>
            Thank you for your order!
          </Text>
          <Text style={styles.orderId}>
            Order ID: {reference}
          </Text>
          <Text style={styles.message}>
            Your order has been placed successfully. You'll receive a confirmation email soon.
          </Text>
          <TouchableOpacity
            style={styles.homeButton}
            onPress={() => navigation.navigate('Home')}
          >
            <Text style={styles.homeButtonText}>Back to Home</Text>
          </TouchableOpacity>
        </View>
      </View>
    </PaperProvider>
  );
};

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
    flex: 1,
    textAlign: 'center',
    fontFamily: 'PlusJakartaSans-Regular',
  },
  headerPlaceholder: {
    width: 24,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  confirmationText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0d0f1c',
    marginBottom: 16,
    fontFamily: 'PlusJakartaSans-Regular',
  },
  orderId: {
    fontSize: 16,
    color: '#0d0f1c',
    marginBottom: 16,
    fontFamily: 'NotoSans-Regular',
  },
  message: {
    fontSize: 14,
    color: '#0d0f1c',
    textAlign: 'center',
    marginBottom: 24,
    fontFamily: 'NotoSans-Regular',
  },
  homeButton: {
    backgroundColor: '#607afb',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  homeButtonText: {
    color: '#f8f9fc',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'PlusJakartaSans-Regular',
  },
});

export default OrderConfirmationScreen;