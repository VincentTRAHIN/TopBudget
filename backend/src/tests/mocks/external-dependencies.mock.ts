// Mock file for external dependencies - Complex Jest mock typing is handled with relaxed checks
/* eslint-disable @typescript-eslint/no-explicit-any */

import { jest } from '@jest/globals';

// Types for test mocking - using 'any' is acceptable for complex mock objects
type MockRequest = any;
type MockResponse = any;
type MockNextFunction = any;

export const mockMulter = {
  single: jest.fn((fieldName: string) => {
    return jest.fn((req: MockRequest, res: MockResponse, next: MockNextFunction) => {
      if (fieldName === 'avatar') {
        req.file = {
          fieldname: 'avatar',
          originalname: 'test-avatar.jpg',
          encoding: '7bit',
          mimetype: 'image/jpeg',
          destination: 'public/uploads/avatars/',
          filename: 'test-avatar-123.jpg',
          path: 'public/uploads/avatars/test-avatar-123.jpg',
          size: 1024
        };
      }
      next();
    });
  }),
  
  array: jest.fn((fieldName: string) => {
    return jest.fn((req: MockRequest, res: MockResponse, next: MockNextFunction) => {
      req.files = [
        {
          fieldname: fieldName,
          originalname: 'test-file-1.jpg',
          encoding: '7bit',
          mimetype: 'image/jpeg',
          destination: 'public/uploads/',
          filename: 'test-file-1-123.jpg',
          path: 'public/uploads/test-file-1-123.jpg',
          size: 1024
        },
        {
          fieldname: fieldName,
          originalname: 'test-file-2.jpg',
          encoding: '7bit',
          mimetype: 'image/jpeg',
          destination: 'public/uploads/',
          filename: 'test-file-2-123.jpg',
          path: 'public/uploads/test-file-2-123.jpg',
          size: 2048
        }
      ];
      next();
    });
  })
};

export const mockFileSystem = {
  promises: {
    access: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
    mkdir: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
    writeFile: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
    readFile: jest.fn<() => Promise<Buffer>>().mockResolvedValue(Buffer.from('test file content')),
    unlink: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
    stat: jest.fn<() => Promise<{
      isFile: () => boolean;
      isDirectory: () => boolean;
      size: number;
      mtime: Date;
      ctime: Date;
    }>>().mockResolvedValue({
      isFile: () => true,
      isDirectory: () => false,
      size: 1024,
      mtime: new Date(),
      ctime: new Date()
    })
  },
  
  existsSync: jest.fn<() => boolean>().mockReturnValue(true),
  mkdirSync: jest.fn<() => void>().mockReturnValue(undefined),
  writeFileSync: jest.fn<() => void>().mockReturnValue(undefined),
  readFileSync: jest.fn<() => Buffer>().mockReturnValue(Buffer.from('test file content')),
  unlinkSync: jest.fn<() => void>().mockReturnValue(undefined)
};

interface EmailResponse {
  messageId: string;
  accepted: string[];
  rejected: string[];
  pending: string[];
  response: string;
}

export const mockEmailService = {
  sendEmail: jest.fn<() => Promise<EmailResponse>>().mockResolvedValue({
    messageId: 'test-message-id-123',
    accepted: ['test@example.com'],
    rejected: [],
    pending: [],
    response: '250 Message accepted'
  }),
  
  sendWelcomeEmail: jest.fn<() => Promise<EmailResponse>>().mockResolvedValue({
    messageId: 'welcome-message-id-123',
    accepted: ['new-user@example.com'],
    rejected: [],
    pending: [],
    response: '250 Welcome email sent'
  }),
  
  sendPasswordResetEmail: jest.fn<() => Promise<EmailResponse>>().mockResolvedValue({
    messageId: 'reset-message-id-123',
    accepted: ['user@example.com'],
    rejected: [],
    pending: [],
    response: '250 Password reset email sent'
  }),
  
  sendNotificationEmail: jest.fn<() => Promise<EmailResponse>>().mockResolvedValue({
    messageId: 'notification-message-id-123',
    accepted: ['user@example.com'],
    rejected: [],
    pending: [],
    response: '250 Notification email sent'
  })
};

export const mockExternalAPI = {
  fetchExchangeRates: jest.fn().mockResolvedValue({
    rates: {
      USD: 1.0,
      EUR: 0.85,
      GBP: 0.73,
      JPY: 110.0
    },
    base: 'USD',
    date: new Date().toISOString()
  }),
  
  validateBankAccount: jest.fn().mockResolvedValue({
    valid: true,
    bankName: 'Test Bank',
    accountType: 'checking',
    routingNumber: '123456789'
  }),
  
  fetchCategoryData: jest.fn().mockResolvedValue({
    categories: [
      { id: 1, name: 'Food & Dining', icon: 'utensils' },
      { id: 2, name: 'Transportation', icon: 'car' },
      { id: 3, name: 'Entertainment', icon: 'film' }
    ]
  })
};

export const mockImageProcessing = {
  resizeImage: jest.fn().mockResolvedValue({
    width: 150,
    height: 150,
    format: 'jpeg',
    size: 8192,
    path: 'public/uploads/avatars/resized-avatar-123.jpg'
  }),
  
  generateThumbnail: jest.fn().mockResolvedValue({
    width: 50,
    height: 50,
    format: 'jpeg',
    size: 2048,
    path: 'public/uploads/thumbnails/thumb-123.jpg'
  }),
  
  optimizeImage: jest.fn().mockResolvedValue({
    originalSize: 102400,
    optimizedSize: 51200,
    compressionRatio: 0.5,
    path: 'public/uploads/optimized/optimized-123.jpg'
  })
};

export const mockCloudStorage = {
  uploadFile: jest.fn().mockResolvedValue({
    url: 'https://mock-cloud-storage.com/files/test-file-123.jpg',
    key: 'test-file-123.jpg',
    etag: 'mock-etag-123',
    size: 1024
  }),
  
  downloadFile: jest.fn().mockResolvedValue({
    buffer: Buffer.from('test file content'),
    contentType: 'image/jpeg',
    size: 1024
  }),
  
  deleteFile: jest.fn().mockResolvedValue({
    deleted: true,
    key: 'test-file-123.jpg'
  }),
  
  getFileUrl: jest.fn().mockReturnValue('https://mock-cloud-storage.com/files/test-file-123.jpg')
};

export const mockNotificationService = {
  sendPushNotification: jest.fn().mockResolvedValue({
    messageId: 'push-notification-123',
    delivered: true,
    deviceTokens: ['device-token-1', 'device-token-2']
  }),
  
  sendSmsNotification: jest.fn().mockResolvedValue({
    messageId: 'sms-notification-123',
    delivered: true,
    phoneNumber: '+1234567890'
  }),
  
  sendInAppNotification: jest.fn().mockResolvedValue({
    notificationId: 'in-app-notification-123',
    userId: 'user-123',
    delivered: true
  })
};

export const mockAnalyticsService = {
  trackEvent: jest.fn().mockResolvedValue({
    eventId: 'event-123',
    timestamp: new Date().toISOString(),
    processed: true
  }),
  
  trackPageView: jest.fn().mockResolvedValue({
    pageViewId: 'page-view-123',
    timestamp: new Date().toISOString(),
    processed: true
  }),
  
  trackUserAction: jest.fn().mockResolvedValue({
    actionId: 'action-123',
    userId: 'user-123',
    timestamp: new Date().toISOString(),
    processed: true
  })
};

export const mockPaymentService = {
  processPayment: jest.fn().mockResolvedValue({
    paymentId: 'payment-123',
    status: 'completed',
    amount: 100.00,
    currency: 'USD',
    transactionId: 'txn-123'
  }),
  
  refundPayment: jest.fn().mockResolvedValue({
    refundId: 'refund-123',
    status: 'completed',
    amount: 100.00,
    currency: 'USD',
    originalPaymentId: 'payment-123'
  }),
  
  getPaymentStatus: jest.fn().mockResolvedValue({
    paymentId: 'payment-123',
    status: 'completed',
    amount: 100.00,
    currency: 'USD'
  })
};

export const mockCacheService = {
  get: jest.fn().mockResolvedValue('cached-value'),
  set: jest.fn().mockResolvedValue(true),
  del: jest.fn().mockResolvedValue(true),
  exists: jest.fn().mockResolvedValue(true),
  expire: jest.fn().mockResolvedValue(true),
  flush: jest.fn().mockResolvedValue(true)
};

export const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
  http: jest.fn()
};

export const mockRateLimiter = {
  consume: jest.fn().mockResolvedValue({
    msBeforeNext: 0,
    remainingPoints: 10,
    totalHits: 1,
    isFirstInDuration: true
  }),
  
  penalty: jest.fn().mockResolvedValue({
    msBeforeNext: 1000,
    remainingPoints: 5,
    totalHits: 5,
    isFirstInDuration: false
  }),
  
  reset: jest.fn().mockResolvedValue({
    remainingPoints: 10,
    totalHits: 0,
    isFirstInDuration: true
  })
};

export const mockValidationService = {
  validateEmailFormat: jest.fn().mockReturnValue(true),
  validatePasswordStrength: jest.fn().mockReturnValue({
    valid: true,
    score: 4,
    feedback: 'Strong password'
  }),
  validatePhoneNumber: jest.fn().mockReturnValue(true),
  sanitizeInput: jest.fn().mockImplementation((input: string) => input.trim()),
  validateCreditCard: jest.fn().mockReturnValue({
    valid: true,
    type: 'visa',
    lastFourDigits: '1234'
  })
};

export const setupExternalDependencyMocks = () => {
  jest.doMock('multer', () => ({
    __esModule: true,
    default: jest.fn(() => mockMulter)
  }));

  jest.doMock('fs', () => mockFileSystem);
  jest.doMock('fs/promises', () => mockFileSystem.promises);

  jest.doMock('nodemailer', () => ({
    createTransporter: jest.fn().mockReturnValue({
      sendMail: mockEmailService.sendEmail
    })
  }));

  jest.doMock('axios', () => ({
    get: jest.fn().mockResolvedValue({
      data: mockExternalAPI.fetchExchangeRates(),
      status: 200,
      statusText: 'OK'
    }),
    post: jest.fn().mockResolvedValue({
      data: { success: true },
      status: 200,
      statusText: 'OK'
    }),
    put: jest.fn().mockResolvedValue({
      data: { success: true },
      status: 200,
      statusText: 'OK'
    }),
    delete: jest.fn().mockResolvedValue({
      data: { success: true },
      status: 200,
      statusText: 'OK'
    })
  }));

  jest.doMock('sharp', () => {
    const mockSharp = jest.fn(() => ({
      resize: jest.fn().mockReturnThis(),
      jpeg: jest.fn().mockReturnThis(),
      png: jest.fn().mockReturnThis(),
      toFile: jest.fn().mockResolvedValue(mockImageProcessing.resizeImage),
      toBuffer: jest.fn().mockResolvedValue(Buffer.from('processed image'))
    }));
    return mockSharp;
  });

  jest.doMock('aws-sdk', () => ({
    S3: jest.fn(() => ({
      upload: jest.fn().mockReturnValue({
        promise: jest.fn().mockResolvedValue(mockCloudStorage.uploadFile())
      }),
      getObject: jest.fn().mockReturnValue({
        promise: jest.fn().mockResolvedValue(mockCloudStorage.downloadFile())
      }),
      deleteObject: jest.fn().mockReturnValue({
        promise: jest.fn().mockResolvedValue(mockCloudStorage.deleteFile())
      })
    }))
  }));

  jest.doMock('redis', () => ({
    createClient: jest.fn().mockReturnValue({
      on: jest.fn(),
      connect: jest.fn().mockResolvedValue(undefined),
      get: mockCacheService.get,
      set: mockCacheService.set,
      del: mockCacheService.del,
      exists: mockCacheService.exists,
      expire: mockCacheService.expire,
      flushall: mockCacheService.flush
    })
  }));
};

export const resetExternalDependencyMocks = () => {
  mockMulter.single.mockClear();
  mockMulter.array.mockClear();
  
  Object.values(mockFileSystem.promises).forEach(mock => mock.mockClear());
  Object.values(mockFileSystem).forEach(mock => {
    if (typeof mock === 'function') mock.mockClear();
  });
  
  Object.values(mockEmailService).forEach(mock => mock.mockClear());
  Object.values(mockExternalAPI).forEach(mock => mock.mockClear());
  Object.values(mockImageProcessing).forEach(mock => mock.mockClear());
  Object.values(mockCloudStorage).forEach(mock => mock.mockClear());
  Object.values(mockNotificationService).forEach(mock => mock.mockClear());
  Object.values(mockAnalyticsService).forEach(mock => mock.mockClear());
  Object.values(mockPaymentService).forEach(mock => mock.mockClear());
  Object.values(mockCacheService).forEach(mock => mock.mockClear());
  Object.values(mockLogger).forEach(mock => mock.mockClear());
  Object.values(mockRateLimiter).forEach(mock => mock.mockClear());
  Object.values(mockValidationService).forEach(mock => mock.mockClear());
}; 