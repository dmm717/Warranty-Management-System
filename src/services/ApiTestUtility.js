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
    try {
      const result = await authService.login({ email, password });

      if (result.success) {);      } else {      }

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
      await authService.logout();););
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
    if (token && isValid) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1])););
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
    const result = authService.validateCredentials(credentials);

    if (result.isValid) {    } else {    }

    console.groupEnd();
    return result;
  }

  /**
   * Test API GET request
   */
  async testGet(endpoint) {
    console.group(`🧪 Testing GET ${endpoint}`);

    try {
      const result = await apiService.get(endpoint);      console.groupEnd();
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
    try {
      const result = await apiService.post(endpoint, data);      console.groupEnd();
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
    // Test 1: Validation    this.testValidation({ email: '', password: '' });
    this.testValidation({ email: 'invalid', password: '123' });
    this.testValidation({ email: 'valid@email.com', password: 'password123' });

    // Test 2: Login with valid credentials    await this.testLogin('sc_admin@vinfast.com', 'password123');

    // Test 3: Token validation    this.testTokenValidation();

    // Test 4: Logout    await this.testLogout();

    // Test 5: Token validation after logout    this.testTokenValidation();  }

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
    for (const scenario of scenarios) {      await this.testLogin(scenario.email, scenario.password);

      // Cleanup after each test
      if (apiService.getToken()) {
        await this.testLogout();
      }
    }  }
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
