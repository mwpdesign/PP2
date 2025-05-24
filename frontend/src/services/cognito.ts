/**
 * AWS Cognito service for frontend authentication.
 */
import axios from 'axios';
import { Auth } from 'aws-amplify';

export interface AuthResponse {
  accessToken: string;
  idToken: string;
  refreshToken?: string;
  expiresIn: number;
  tokenType: string;
}

export interface MFAResponse {
  session: string;
  challengeName: string;
}

export interface UserAttributes {
  [key: string]: string;
}

class CognitoService {
  private readonly API_URL = process.env.REACT_APP_API_URL;

  constructor() {
    Auth.configure({
      region: process.env.REACT_APP_AWS_REGION,
      userPoolId: process.env.REACT_APP_COGNITO_USER_POOL_ID,
      userPoolWebClientId: process.env.REACT_APP_COGNITO_CLIENT_ID,
      mandatorySignIn: true,
      authenticationFlowType: 'USER_PASSWORD_AUTH'
    });
  }

  async register(
    email: string,
    password: string,
    attributes: UserAttributes
  ): Promise<{ userId: string; email: string; status: string }> {
    try {
      const response = await axios.post(
        `${this.API_URL}/auth/register`,
        { email, password, attributes }
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async confirmRegistration(
    email: string,
    code: string
  ): Promise<{ message: string }> {
    try {
      const response = await axios.post(
        `${this.API_URL}/auth/confirm-registration`,
        { email, confirmation_code: code }
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    try {
      const response = await axios.post<AuthResponse>(
        `${this.API_URL}/auth/login`,
        { email, password }
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async logout(): Promise<void> {
    try {
      await Auth.signOut();
      await axios.post(`${this.API_URL}/auth/logout`);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async verifyMFA(
    email: string,
    session: string,
    mfaCode: string,
    challengeName: string
  ): Promise<AuthResponse> {
    try {
      const response = await axios.post(
        `${this.API_URL}/auth/verify-mfa`,
        {
          email,
          session,
          mfa_code: mfaCode,
          challenge_name: challengeName
        }
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    try {
      const response = await axios.post(
        `${this.API_URL}/auth/refresh-token`,
        { refresh_token: refreshToken }
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async setupTOTP(): Promise<{ secretCode: string }> {
    try {
      const response = await axios.post(
        `${this.API_URL}/auth/setup-totp`,
        {},
        {
          headers: {
            Authorization: `Bearer ${await this.getAccessToken()}`
          }
        }
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async verifyTOTPSetup(totpCode: string): Promise<{ message: string }> {
    try {
      const response = await axios.post(
        `${this.API_URL}/auth/verify-totp-setup`,
        { totp_code: totpCode },
        {
          headers: {
            Authorization: `Bearer ${await this.getAccessToken()}`
          }
        }
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async forgotPassword(email: string): Promise<{ message: string }> {
    try {
      const response = await axios.post(
        `${this.API_URL}/auth/forgot-password`,
        { email }
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async resetPassword(
    email: string,
    code: string,
    newPassword: string
  ): Promise<{ message: string }> {
    try {
      const response = await axios.post(
        `${this.API_URL}/auth/reset-password`,
        {
          email,
          confirmation_code: code,
          new_password: newPassword
        }
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async verifyToken(): Promise<{
    valid: boolean;
    user: any;
    phiAccess: boolean;
    deviceTrusted: boolean;
  }> {
    try {
      const response = await axios.get(
        `${this.API_URL}/auth/verify-token`,
        {
          headers: {
            Authorization: `Bearer ${await this.getAccessToken()}`
          }
        }
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getAccessToken(): Promise<string> {
    try {
      const session = await Auth.currentSession();
      return session.getAccessToken().getJwtToken();
    } catch (error) {
      throw new Error('No active session');
    }
  }

  private handleError(error: any): Error {
    if (error.response) {
      throw new Error(error.response.data.detail || 'An error occurred');
    }
    throw error;
  }
}

export const cognitoService = new CognitoService(); 