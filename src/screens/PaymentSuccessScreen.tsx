import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const PaymentSuccessScreen = ({ route }) => {
  const { orderId } = route.params;
  const navigation = useNavigation();
  return (
    <View style={styles.container}>
      <Text style={styles.successText}>Payment Successful!</Text>
      <Text style={styles.orderText}>Order ID: {orderId}</Text>
      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate('Orders')}
      >
        <Text style={styles.buttonText}>View Orders</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#141f18',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  successText: {
    color: '#94e0b2',
    fontSize: 24,
    fontFamily: 'NotoSans-SemiBold',
    marginBottom: 20,
  },
  orderText: {
    color: '#ffffff',
    fontSize: 16,
    fontFamily: 'NotoSans-Regular',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 8,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontFamily: 'NotoSans-SemiBold',
  },
});

export default PaymentSuccessScreen;