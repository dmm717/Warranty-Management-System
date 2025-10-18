/* ==========================================================================
   API TEST UTILITY - Để test API integration dễ dàng hơn
   ========================================================================== */

import apiService from './ApiService';
import authService from './AuthService';

/**
 * Test các API endpoints
 */
class ApiTestUtility {
  /**
   * Test login với credentials
   */
  async testLogin(email, password) {
    console.group('🧪 Testing Login API');
    console.log('Request:', { email, password });

    try {
      const result = await authService.login({ email, password });

      if (result.success) {
        console.log('✅ Login Success');
        console.log('Response:', result);
        console.log('Token stored:', apiService.getToken());
        console.log('User info:', result.data);
      } else {
        console.log('❌ Login Failed');
        console.log('Message:', result.message);
        console.log('Errors:', result.errors);
      }

      console.groupEnd();
      return result;
    } catch (error) {
      console.error('💥 Test Error:', error);
      console.groupEnd();
      throw error;
    }
  }

  /**
   * Test logout
   */
  async testLogout() {
    console.group('🧪 Testing Logout');

    try {
      await authService.logout();
      console.log('✅ Logout Success');
      console.log('Token removed:', !apiService.getToken());
      console.log('User removed:', !localStorage.getItem('user'));
      console.groupEnd();
    } catch (error) {
      console.error('💥 Test Error:', error);
      console.groupEnd();
      throw error;
    }
  }

  /**
   * Test token validation
   */
  testTokenValidation() {
    console.group('🧪 Testing Token Validation');

    const token = apiService.getToken();
    const isValid = apiService.hasValidToken();

    console.log('Token:', token);
    console.log('Is Valid:', isValid);

    if (token && isValid) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        console.log('Token Payload:', payload);
        console.log('Expiry:', new Date(payload.exp * 1000));
      } catch (error) {
        console.error('Cannot decode token:', error);
      }
    }

    console.groupEnd();
    return isValid;
  }

  /**
   * Test client-side validation
   */
  testValidation(credentials) {
    console.group('🧪 Testing Client-side Validation');
    console.log('Input:', credentials);

    const result = authService.validateCredentials(credentials);

    if (result.isValid) {
      console.log('✅ Validation Passed');
    } else {
      console.log('❌ Validation Failed');
      console.log('Errors:', result.errors);
    }

    console.groupEnd();
    return result;
  }

  /**
   * Test API GET request
   */
  async testGet(endpoint) {
    console.group(`🧪 Testing GET ${endpoint}`);

    try {
      const result = await apiService.get(endpoint);
      console.log('Response:', result);
      console.groupEnd();
      return result;
    } catch (error) {
      console.error('💥 Test Error:', error);
      console.groupEnd();
      throw error;
    }
  }

  /**
   * Test API POST request
   */
  async testPost(endpoint, data) {
    console.group(`🧪 Testing POST ${endpoint}`);
    console.log('Request Data:', data);

    try {
      const result = await apiService.post(endpoint, data);
      console.log('Response:', result);
      console.groupEnd();
      return result;
    } catch (error) {
      console.error('💥 Test Error:', error);
      console.groupEnd();
      throw error;
    }
  }

  /**
   * Run all tests
   */
  async runAllTests() {
    console.log('🚀 Starting API Tests...\n');

    // Test 1: Validation
    console.log('Test 1: Client-side Validation');
    this.testValidation({ email: '', password: '' });
    this.testValidation({ email: 'invalid', password: '123' });
    this.testValidation({ email: 'valid@email.com', password: 'password123' });

    // Test 2: Login with valid credentials
    console.log('\nTest 2: Login with valid credentials');
    await this.testLogin('sc_admin@vinfast.com', 'password123');

    // Test 3: Token validation
    console.log('\nTest 3: Token Validation');
    this.testTokenValidation();

    // Test 4: Logout
    console.log('\nTest 4: Logout');
    await this.testLogout();

    // Test 5: Token validation after logout
    console.log('\nTest 5: Token Validation after Logout');
    this.testTokenValidation();

    console.log('\n✅ All tests completed!');
  }

  /**
   * Quick test login scenarios
   */
  async quickLoginTests() {
    const scenarios = [
      {
        name: 'Valid SC Admin Login',
        email: 'sc_admin@vinfast.com',
        password: 'password123',
      },
      {
        name: 'Invalid Email Format',
        email: 'invalid-email',
        password: 'password123',
      },
      {
        name: 'Empty Credentials',
        email: '',
        password: '',
      },
      {
        name: 'Wrong Password',
        email: 'sc_admin@vinfast.com',
        password: 'wrongpassword',
      },
    ];

    console.log('🚀 Running Quick Login Tests...\n');

    for (const scenario of scenarios) {
      console.log(`\n📋 Scenario: ${scenario.name}`);
      await this.testLogin(scenario.email, scenario.password);

      // Cleanup after each test
      if (apiService.getToken()) {
        await this.testLogout();
      }
    }

    console.log('\n✅ Quick tests completed!');
  }
}

// Create singleton instance
const apiTestUtility = new ApiTestUtility();

// Export để sử dụng trong console
if (typeof window !== 'undefined') {
  window.apiTest = apiTestUtility;
}

export default apiTestUtility;

/* ==========================================================================
   CÁCH SỬ DỤNG:

   1. Import trong component hoặc console:
      import apiTest from './services/ApiTestUtility';

   2. Trong browser console:
      // Test login
      await window.apiTest.testLogin('sc_admin@vinfast.com', 'password123')

      // Test validation
      window.apiTest.testValidation({ email: 'test@test.com', password: '123' })

      // Test token
      window.apiTest.testTokenValidation()

      // Run all tests
      await window.apiTest.runAllTests()

      // Quick login tests
      await window.apiTest.quickLoginTests()

   3. Test API endpoints:
      await window.apiTest.testGet('/vehicles')
      await window.apiTest.testPost('/warranty-claims', { data })
   ========================================================================== */
