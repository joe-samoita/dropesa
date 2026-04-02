import React, { useState, useEffect } from 'react';
import { SafeAreaView, View, Text, TextInput, Button, FlatList, Alert, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import QRCode from 'react-native-qrcode-svg';
import * as Sharing from 'react-native-share';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const Stack = createNativeStackNavigator();

const apiClient = axios.create({
  baseURL: 'http://localhost:4000/api',
  timeout: 10000,
});

// Auth interceptor
apiClient.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const LoginScreen = ({ navigation }) => {
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSignup = async () => {
    if (!phone || !name) {
      setError('Phone and name are required');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const resp = await apiClient.post('/auth/signup', { phone, name });
      await AsyncStorage.setItem('authToken', resp.data.token);
      await AsyncStorage.setItem('user', JSON.stringify(resp.data.user));
      navigation.replace('Home');
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, padding: 16, justifyContent: 'center' }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20 }}>Dropesa</Text>
      <Text style={{ marginBottom: 10 }}>Enter your M-Pesa phone number</Text>
      <TextInput
        value={phone}
        onChangeText={setPhone}
        placeholder="254712345678"
        keyboardType="phone-pad"
        style={{ borderWidth: 1, marginVertical: 10, padding: 8, borderRadius: 4 }}
      />
      <Text style={{ marginBottom: 10 }}>Your name</Text>
      <TextInput
        value={name}
        onChangeText={setName}
        placeholder="John Doe"
        style={{ borderWidth: 1, marginVertical: 10, padding: 8, borderRadius: 4 }}
      />
      {error && <Text style={{ color: 'red', marginVertical: 10 }}>{error}</Text>}
      {loading ? <ActivityIndicator size="large" color="#0000ff" /> : <Button title="Sign Up / Login" onPress={handleSignup} />}
    </SafeAreaView>
  );
};

const HomeScreen = ({ navigation }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      const userData = await AsyncStorage.getItem('user');
      if (userData) setUser(JSON.parse(userData));
    };
    loadUser();
  }, []);

  const handleLogout = async () => {
    await AsyncStorage.removeItem('authToken');
    await AsyncStorage.removeItem('user');
    navigation.replace('Login');
  };

  return (
    <SafeAreaView style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 20 }}>Welcome {user?.name}</Text>
      <Button title="Pair Contacts" onPress={() => navigation.navigate('Pairing')} />
      <Button title="My Contacts" onPress={() => navigation.navigate('Contacts')} />
      <Button title="Pay via M-Pesa" onPress={() => navigation.navigate('Pay')} />
      <Button title="History" onPress={() => navigation.navigate('History')} />
      <View style={{ marginTop: 20 }}>
        <Button title="Logout" onPress={handleLogout} color="red" />
      </View>
    </SafeAreaView>
  );
};

const PairingScreen = ({ navigation }) => {
  const [pairingData, setPairingData] = useState(null);
  const [loading, setLoading] = useState(false);

  const generatePairingCode = async () => {
    try {
      setLoading(true);
      const resp = await apiClient.post('/contacts/generate', {});
      setPairingData(resp.data);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  const sharePairingCode = async () => {
    if (!pairingData) return;
    try {
      await Sharing.open({ message: JSON.stringify(pairingData) });
    } catch (e) {
      Alert.alert('Share error', e.message);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, padding: 16 }}>
      <Button title="Generate Pairing Code" onPress={generatePairingCode} />
      {loading && <ActivityIndicator size="large" color="#0000ff" style={{ marginTop: 20 }} />}
      {pairingData ? (
        <View style={{ marginTop: 20, alignItems: 'center' }}>
          <Text style={{ marginBottom: 10 }}>Scan this QR to pair</Text>
          <QRCode value={JSON.stringify(pairingData)} size={180} />
          <Button title="Share Code" onPress={sharePairingCode} />
        </View>
      ) : null}
    </SafeAreaView>
  );
};

const ContactsScreen = () => {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadContacts = async () => {
    try {
      setLoading(true);
      setError(null);
      const resp = await apiClient.get('/contacts');
      setContacts(resp.data);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    loadContacts();
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, padding: 16 }}>
      <Button title="Refresh" onPress={loadContacts} />
      {loading && <ActivityIndicator size="large" color="#0000ff" />}
      {error && <Text style={{ color: 'red', marginVertical: 10 }}>{error}</Text>}
      <FlatList
        data={contacts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={{ borderBottomWidth: 1, paddingVertical: 10 }}>
            <Text style={{ fontWeight: 'bold' }}>{item.name}</Text>
            <Text>{item.phone}</Text>
            <Text style={{ fontSize: 12, color: 'gray' }}>Status: {item.status}</Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
};

const PayScreen = () => {
  const [recipient, setRecipient] = useState('254700000000');
  const [amount, setAmount] = useState('10');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const validateInput = () => {
    if (!recipient || !amount) {
      setError('Recipient and amount are required');
      return false;
    }
    if (!/^254\d{9}$/.test(recipient)) {
      setError('Invalid phone number format (e.g., 254712345678)');
      return false;
    }
    if (isNaN(amount) || Number(amount) <= 0) {
      setError('Amount must be a positive number');
      return false;
    }
    return true;
  };

  const pay = async () => {
    if (!validateInput()) return;

    try {
      setLoading(true);
      setError(null);
      setStatus('Sending STK Push...');
      const resp = await apiClient.post('/mpesa/stkpush', {
        phoneNumber: recipient,
        amount: Number(amount),
        accountReference: 'DropesaApp',
        transactionDesc: 'App payment',
      });
      setStatus(`Success! Request ID: ${resp.data.requestId}`);
      setTimeout(() => setStatus(''), 3000);
    } catch (err) {
      const errMsg = err.response?.data?.error || err.message;
      setError(errMsg);
      setStatus('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontWeight: 'bold', marginBottom: 10 }}>Recipient M-Pesa number</Text>
      <TextInput
        value={recipient}
        onChangeText={setRecipient}
        keyboardType="phone-pad"
        style={{ borderWidth: 1, marginVertical: 10, padding: 8, borderRadius: 4 }}
      />
      <Text style={{ fontWeight: 'bold', marginBottom: 10 }}>Amount (KES)</Text>
      <TextInput
        value={amount}
        onChangeText={setAmount}
        keyboardType="numeric"
        style={{ borderWidth: 1, marginVertical: 10, padding: 8, borderRadius: 4 }}
      />
      {error && <Text style={{ color: 'red', marginVertical: 10 }}>{error}</Text>}
      {status && <Text style={{ color: 'green', marginVertical: 10 }}>{status}</Text>}
      {loading ? <ActivityIndicator size="large" color="#0000ff" /> : <Button title="Send STK Push" onPress={pay} />}
    </SafeAreaView>
  );
};

const HistoryScreen = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      const resp = await apiClient.get('/mpesa/transactions');
      setItems(resp.data);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    loadHistory();
  }, []);

  const statusColor = (status) => {
    return status === 'SUCCESS' ? 'green' : status === 'FAILED' ? 'red' : 'orange';
  };

  return (
    <SafeAreaView style={{ flex: 1, padding: 16 }}>
      <Button title="Refresh" onPress={loadHistory} />
      {loading && <ActivityIndicator size="large" color="#0000ff" style={{ marginTop: 10 }} />}
      {error && <Text style={{ color: 'red', marginVertical: 10 }}>{error}</Text>}
      {items.length === 0 && !loading && <Text style={{ marginTop: 20, textAlign: 'center' }}>No transactions yet</Text>}
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={{ borderBottomWidth: 1, paddingVertical: 10 }}>
            <Text style={{ fontWeight: 'bold' }}>Ref: {item.accountReference}</Text>
            <Text>Amount: {item.amount} KES</Text>
            <Text>Phone: {item.phoneNumber}</Text>
            <Text style={{ color: statusColor(item.status), fontWeight: 'bold' }}>Status: {item.status}</Text>
            <Text style={{ fontSize: 12, color: 'gray' }}>Desc: {item.transactionDesc}</Text>
            <Text style={{ fontSize: 12, color: 'gray' }}>{new Date(item.createdAt).toLocaleString()}</Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
};

export default function App() {
  const [initialRoute, setInitialRoute] = useState(null);

  useEffect(() => {
    const checkAuth = async () => {
      const token = await AsyncStorage.getItem('authToken');
      setInitialRoute(token ? 'Home' : 'Login');
    };
    checkAuth();
  }, []);

  if (!initialRoute) {
    return <ActivityIndicator size="large" color="#0000ff" style={{ flex: 1, justifyContent: 'center' }} />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName={initialRoute} screenOptions={{ headerShown: true }}>
        <Stack.Screen name="Login" component={LoginScreen} options={{ title: 'Dropesa - Login' }} />
        <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'Dropesa' }} />
        <Stack.Screen name="Pairing" component={PairingScreen} options={{ title: 'Pair Contacts' }} />
        <Stack.Screen name="Contacts" component={ContactsScreen} options={{ title: 'My Contacts' }} />
        <Stack.Screen name="Pay" component={PayScreen} options={{ title: 'Send Money' }} />
        <Stack.Screen name="History" component={HistoryScreen} options={{ title: 'Transaction History' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
