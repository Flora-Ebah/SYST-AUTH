import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import * as Linking from 'expo-linking';
import { MaterialCommunityIcons } from 'react-native-vector-icons';

const App = () => {
  const [code, setCode] = useState('');
  const [sessionId, setSessionId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [digits, setDigits] = useState([]);
  const shakeAnimation = new Animated.Value(0);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Fonction pour mélanger un tableau
    const shuffleArray = (array) => {
      for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
      }
      return array;
    };

    // Initialiser les chiffres mélangés
    const initialDigits = shuffleArray(['1', '2', '3', '4', '5', '6', '7', '8', '9', '0']);
    setDigits(initialDigits);

    // Gestion des liens entrants
    const handleDeepLink = (event) => {
      let data = Linking.parse(event.url);
      if (data.queryParams && data.queryParams.sessionId) {
        setSessionId(data.queryParams.sessionId);
        console.log('Session ID reçu:', data.queryParams.sessionId);
      }
    };

    // Vérifier si l'app a été ouverte via un lien
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink({ url });
      }
    });

    // Écouter les liens entrants quand l'app est déjà ouverte
    const subscription = Linking.addEventListener('url', handleDeepLink);

    return () => {
      subscription.remove();
    };
  }, []);

  // Fonction pour l'animation de secouement
  const shakeCircles = () => {
    Animated.sequence([
      Animated.timing(shakeAnimation, {
        toValue: 15,
        duration: 50,
        useNativeDriver: true
      }),
      Animated.timing(shakeAnimation, {
        toValue: -15,
        duration: 50,
        useNativeDriver: true
      }),
      Animated.timing(shakeAnimation, {
        toValue: 15,
        duration: 50,
        useNativeDriver: true
      }),
      Animated.timing(shakeAnimation, {
        toValue: -15,
        duration: 50,
        useNativeDriver: true
      }),
      Animated.timing(shakeAnimation, {
        toValue: 0,
        duration: 50,
        useNativeDriver: true
      })
    ]).start(() => {
      setTimeout(() => {
        setCode('');
      }, 150);
    });
  };

  // Fonction pour vérifier le PIN
  const verifyPin = async (pin) => {
    setIsLoading(true);
    let loadingTimeout; // Déclarez une variable pour le timeout
    try {
      console.log(`Vérification du PIN: ${pin}`); // Utilisez le PIN passé en argument
      const response = await fetch('http://192.168.1.186:4000/verify-pin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'user1', // Remplacez par le nom d'utilisateur approprié
          pin: pin, // Utilisez le PIN passé en argument
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setIsAuthenticated(true);
      } else {
        throw new Error(data.message); // Lancez une erreur si la réponse n'est pas OK
      }
    } catch (error) {
      console.error(error.message); // Affichez le message d'erreur dans la console
      shakeCircles(); // Appeler l'animation de secouement en cas d'erreur
    } finally {
      // Démarrez un timeout de 5 secondes avant de masquer le loading
      loadingTimeout = setTimeout(() => {
        setIsLoading(false);
      }, 5000);
    }

    // Nettoyez le timeout si la fonction est appelée à nouveau avant la fin
    return () => clearTimeout(loadingTimeout);
  };

  // Fonction pour gérer l'appui sur un bouton numérique
  const handlePress = (digit) => {
    console.log(`Digit pressed: ${digit}`); // Log pour vérifier quel chiffre est pressé
    if (code.length < 5) {
      const newCode = code + digit;
      setCode(newCode);
      console.log(`Current code: ${newCode}`); // Log pour vérifier le code actuel

      if (newCode.length === 5 && sessionId) {
        console.log('Verifying PIN...'); // Log pour vérifier que nous appelons verifyPin
        console.log(`Code envoyé pour vérification: ${newCode}`); // Ajoutez ce log
        verifyPin(newCode); // Passer newCode à verifyPin
      }
    }
  };

  // Fonction pour supprimer un chiffre (backspace)
  const handleBackspace = () => {
    setCode(code.slice(0, -1));
  };

  return (
    <View style={styles.container}>
      {isLoading && (
        <View style={styles.loaderContainer}>
          <View style={styles.loaderBackground} />
          <ActivityIndicator size="large" color="#0000FF" />
        </View>
      )}
      {!isLoading && isAuthenticated ? (
        <View style={styles.successContainer}>
          <MaterialCommunityIcons name="check-circle" size={100} color="#007AFF" />
          <Text style={styles.successText}>Vous êtes connecté au web !</Text>
        </View>
      ) : (
        <>
          <View style={styles.codeSection}>
            <Text style={styles.instructionText}>
              Votre code secret est requis pour vous connecter
            </Text>
            <Animated.View 
              style={[
                styles.input,
                { transform: [{ translateX: shakeAnimation }] }
              ]}
            >
              {Array.from({ length: 5 }).map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.circle,
                    { backgroundColor: code[index] ? '#0000FF' : '#d3d3d3' }
                  ]}
                />
              ))}
            </Animated.View>
          </View>
          {/* Clavier numérique personnalisé */}
          <View style={styles.keyboard}>
            {digits.slice(0, 9).map((digit, index) => (
              <TouchableOpacity
                key={digit}
                style={[styles.button]}
                onPress={() => handlePress(digit)}
              >
                <Text style={styles.buttonText}>{digit}</Text>
              </TouchableOpacity>
            ))}
            
            <TouchableOpacity
              key={digits[9]}
              style={[styles.button, styles.lastButton]}
              onPress={() => handlePress(digits[9])}
            >
              <Text style={styles.buttonText}>{digits[9]}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.buttonBackspace, styles.backspacePosition]}
              onPress={handleBackspace}
              disabled={code.length === 0}
            >
              <Icon name="backspace" size={22} color={code.length === 0 ? '#999999' : '#000000'} />
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  
  codeSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 190,
  },

  input: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 0,
    marginTop: 0,
  },

  circle: {
    width: 13,
    height: 13,
    borderRadius: 15,
    margin: 10,
    backgroundColor: '#d3d3d3',
  },

  keyboard: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    width: 340,
    marginBottom: 5,
  },

  button: {
    width: 90,
    height: 60,
    margin: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderRadius: 0,
  },

  buttonBackspace: {
    width: 95,
    height: 80,
    margin: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderRadius: 0,
  },

  buttonText: {
    fontSize: 25,
    color: '#000000',
    fontWeight: '500',
    fontFamily: 'Arial',
  },

  instructionText: {
    fontSize: 15,
    color: '#000000',
    marginBottom: 95,
    fontFamily: 'Arial',
  },

  loadingContainer: {
    marginTop: 20,
  },

  successText: {
    fontSize: 24,
    color: '#007AFF',
    fontWeight: 'bold',
    marginTop: 20,
  },

  buttonTextDisabled: {
    color: '#999',
  },

  loaderContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },

  loaderBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
  },

  backspacePosition: {
    marginLeft: 0,
    marginTop: 10,
  },

  lastButton: {
    width: 90,
    height: 60,
    margin: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderRadius: 0,
    marginLeft: 110,
    marginTop: 10,
  },

  successContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
});

export default App;
