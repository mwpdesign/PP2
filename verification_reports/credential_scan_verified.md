
# Healthcare IVR Platform - Credential Security Scan Report
Generated: 2025-06-04 20:40:05
Project Root: .

## Executive Summary
- **Files Scanned**: 1990
- **Total Findings**: 152
- **High Risk**: 0 🔴
- **Medium Risk**: 0 🟡
- **Low Risk**: 152 🟢

## Risk Assessment
ℹ️ **INFO**: Low-risk items found. Consider review.

## Detailed Findings

### 🟢 LOW Risk Issues (152)

#### 1. Email Addresses
- **File**: `frontend/src/components/settings/ProfileSection.tsx`
- **Line**: 49
- **Pattern**: email_addresses
- **Match**: `john.doe@healthcare.com`
- **Context**: `email: 'john.doe@healthcare.com',`
- **Hash**: de597cb5

#### 2. Email Addresses
- **File**: `frontend/src/components/auth/LoginForm.tsx`
- **Line**: 92
- **Pattern**: email_addresses
- **Match**: `doctor@test.com`
- **Context**: `<li>doctor@test.com / demo123 (Doctor role)</li>`
- **Hash**: cd2b2d49

#### 3. Email Addresses
- **File**: `frontend/src/components/auth/LoginForm.tsx`
- **Line**: 93
- **Pattern**: email_addresses
- **Match**: `admin@test.com`
- **Context**: `<li>admin@test.com / demo123 (Admin role)</li>`
- **Hash**: 5b37040e

#### 4. Email Addresses
- **File**: `frontend/src/components/auth/LoginForm.tsx`
- **Line**: 94
- **Pattern**: email_addresses
- **Match**: `ivr@test.com`
- **Context**: `<li>ivr@test.com / demo123 (IVR Company role)</li>`
- **Hash**: a9483f3c

#### 5. Email Addresses
- **File**: `frontend/src/components/auth/LoginForm.tsx`
- **Line**: 95
- **Pattern**: email_addresses
- **Match**: `logistics@test.com`
- **Context**: `<li>logistics@test.com / demo123 (Logistics role)</li>`
- **Hash**: 2c98dccc

#### 6. Email Addresses
- **File**: `frontend/src/components/auth/LoginForm.tsx`
- **Line**: 96
- **Pattern**: email_addresses
- **Match**: `sales@test.com`
- **Context**: `<li>sales@test.com / demo123 (Sales role)</li>`
- **Hash**: 5f030385

#### 7. Email Addresses
- **File**: `frontend/src/components/auth/AuthDebugTest.tsx`
- **Line**: 18
- **Pattern**: email_addresses
- **Match**: `admin@healthcare.local`
- **Context**: `email: process.env.REACT_APP_TEST_ADMIN_EMAIL || 'admin@healthcare.local',`
- **Hash**: 0d430825

#### 8. Email Addresses
- **File**: `frontend/src/components/auth/AuthDebugTest.tsx`
- **Line**: 24
- **Pattern**: email_addresses
- **Match**: `admin@healthcare.local`
- **Context**: `email: process.env.REACT_APP_TEST_ADMIN_EMAIL || 'admin@healthcare.local',`
- **Hash**: 0d430825

#### 9. Email Addresses
- **File**: `frontend/src/components/auth/AuthDebugTest.tsx`
- **Line**: 28
- **Pattern**: email_addresses
- **Match**: `doctor@healthcare.local`
- **Context**: `email: process.env.REACT_APP_TEST_DOCTOR_EMAIL || 'doctor@healthcare.local',`
- **Hash**: be58a2be

#### 10. Email Addresses
- **File**: `frontend/src/components/auth/AuthDebugTest.tsx`
- **Line**: 32
- **Pattern**: email_addresses
- **Match**: `ivr@healthcare.local`
- **Context**: `email: process.env.REACT_APP_TEST_IVR_EMAIL || 'ivr@healthcare.local',`
- **Hash**: fdcfc7ac

#### 11. Email Addresses
- **File**: `frontend/src/components/auth/TestLogin.tsx`
- **Line**: 15
- **Pattern**: email_addresses
- **Match**: `admin@healthcare.local`
- **Context**: `body: 'username=admin@healthcare.local&password=admin123'`
- **Hash**: 0d430825

#### 12. Email Addresses
- **File**: `frontend/src/components/auth/TestLogin.tsx`
- **Line**: 29
- **Pattern**: email_addresses
- **Match**: `admin@healthcare.local`
- **Context**: `await login('admin@healthcare.local', 'admin123');`
- **Hash**: 0d430825

#### 13. Email Addresses
- **File**: `frontend/src/components/auth/TestLogin.tsx`
- **Line**: 41
- **Pattern**: email_addresses
- **Match**: `doctor@healthcare.local`
- **Context**: `await login('doctor@healthcare.local', 'doctor123');`
- **Hash**: be58a2be

#### 14. Email Addresses
- **File**: `frontend/src/components/auth/TestLogin.tsx`
- **Line**: 53
- **Pattern**: email_addresses
- **Match**: `ivr@healthcare.local`
- **Context**: `await login('ivr@healthcare.local', 'ivr123');`
- **Hash**: fdcfc7ac

#### 15. Email Addresses
- **File**: `frontend/src/components/auth/TestLogin.tsx`
- **Line**: 69
- **Pattern**: email_addresses
- **Match**: `admin@healthcare.local`
- **Context**: `<li><strong>Admin:</strong> admin@healthcare.local / admin123</li>`
- **Hash**: 0d430825

#### 16. Email Addresses
- **File**: `frontend/src/components/auth/TestLogin.tsx`
- **Line**: 70
- **Pattern**: email_addresses
- **Match**: `doctor@healthcare.local`
- **Context**: `<li><strong>Doctor:</strong> doctor@healthcare.local / doctor123</li>`
- **Hash**: be58a2be

#### 17. Email Addresses
- **File**: `frontend/src/components/auth/TestLogin.tsx`
- **Line**: 71
- **Pattern**: email_addresses
- **Match**: `ivr@healthcare.local`
- **Context**: `<li><strong>IVR:</strong> ivr@healthcare.local / ivr123</li>`
- **Hash**: fdcfc7ac

#### 18. Ip Addresses
- **File**: `frontend/src/components/admin/Settings.tsx`
- **Line**: 13
- **Pattern**: ip_addresses
- **Match**: `2.37.996.608`
- **Context**: `<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924...`
- **Hash**: c95d489a

#### 19. Email Addresses
- **File**: `frontend/src/components/admin/UserManagement.tsx`
- **Line**: 11
- **Pattern**: email_addresses
- **Match**: `sarah.johnson@healthcare.com`
- **Context**: `email: 'sarah.johnson@healthcare.com',`
- **Hash**: 18ed9444

#### 20. Email Addresses
- **File**: `frontend/src/components/admin/UserManagement.tsx`
- **Line**: 20
- **Pattern**: email_addresses
- **Match**: `admin.smith@healthcare.com`
- **Context**: `email: 'admin.smith@healthcare.com',`
- **Hash**: 54447ec7

#### 21. Email Addresses
- **File**: `frontend/src/components/admin/UserManagement.tsx`
- **Line**: 29
- **Pattern**: email_addresses
- **Match**: `nurse.williams@healthcare.com`
- **Context**: `email: 'nurse.williams@healthcare.com',`
- **Hash**: 95a60185

#### 22. Ip Addresses
- **File**: `frontend/src/components/admin/AuditLogs.tsx`
- **Line**: 22
- **Pattern**: ip_addresses
- **Match**: `192.168.1.100`
- **Context**: `details: 'Multiple failed login attempts from IP 192.168.1.100',`
- **Hash**: d984a05f

#### 23. Email Addresses
- **File**: `frontend/src/components/admin/users/AdminUserTable.tsx`
- **Line**: 32
- **Pattern**: email_addresses
- **Match**: `sarah.johnson@healthcare.com`
- **Context**: `email: 'sarah.johnson@healthcare.com',`
- **Hash**: 18ed9444

#### 24. Email Addresses
- **File**: `frontend/src/components/admin/users/AdminUserTable.tsx`
- **Line**: 42
- **Pattern**: email_addresses
- **Match**: `michael.chen@healthcare.com`
- **Context**: `email: 'michael.chen@healthcare.com',`
- **Hash**: 675e7e33

#### 25. Email Addresses
- **File**: `frontend/src/components/admin/users/AdminUserTable.tsx`
- **Line**: 52
- **Pattern**: email_addresses
- **Match**: `emily.r@healthcare.com`
- **Context**: `email: 'emily.r@healthcare.com',`
- **Hash**: 47975a79

#### 26. Email Addresses
- **File**: `frontend/src/components/admin/users/AdminUserTable.tsx`
- **Line**: 62
- **Pattern**: email_addresses
- **Match**: `david.w@healthcare.com`
- **Context**: `email: 'david.w@healthcare.com',`
- **Hash**: fd5bb4ce

#### 27. Email Addresses
- **File**: `frontend/src/components/admin/users/AdminUserTable.tsx`
- **Line**: 72
- **Pattern**: email_addresses
- **Match**: `maria.g@healthcare.com`
- **Context**: `email: 'maria.g@healthcare.com',`
- **Hash**: 881bd9b2

#### 28. Ip Addresses
- **File**: `frontend/src/components/navigation/AdminNavigation.tsx`
- **Line**: 35
- **Pattern**: ip_addresses
- **Match**: `2.37.996.608`
- **Context**: `<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924...`
- **Hash**: c95d489a

#### 29. Email Addresses
- **File**: `frontend/src/components/distributor/network/NetworkManagement.tsx`
- **Line**: 21
- **Pattern**: email_addresses
- **Match**: `east@distributor.com`
- **Context**: `email: 'east@distributor.com',`
- **Hash**: 1d310b9e

#### 30. Email Addresses
- **File**: `frontend/src/components/distributor/network/NetworkManagement.tsx`
- **Line**: 29
- **Pattern**: email_addresses
- **Match**: `john.smith@sales.com`
- **Context**: `email: 'john.smith@sales.com',`
- **Hash**: cef94b41

#### 31. Email Addresses
- **File**: `frontend/src/components/distributor/network/NetworkManagement.tsx`
- **Line**: 38
- **Pattern**: email_addresses
- **Match**: `sarah.johnson@hospital.com`
- **Context**: `email: 'sarah.johnson@hospital.com',`
- **Hash**: 79b05224

#### 32. Email Addresses
- **File**: `frontend/src/components/distributor/network/NetworkManagement.tsx`
- **Line**: 47
- **Pattern**: email_addresses
- **Match**: `michael.chen@clinic.com`
- **Context**: `email: 'michael.chen@clinic.com',`
- **Hash**: 669801cb

#### 33. Email Addresses
- **File**: `frontend/src/components/distributor/network/NetworkManagement.tsx`
- **Line**: 58
- **Pattern**: email_addresses
- **Match**: `emma.rodriguez@sales.com`
- **Context**: `email: 'emma.rodriguez@sales.com',`
- **Hash**: 93b09e9c

#### 34. Email Addresses
- **File**: `frontend/src/components/distributor/network/NetworkManagement.tsx`
- **Line**: 67
- **Pattern**: email_addresses
- **Match**: `david.williams@medical.com`
- **Context**: `email: 'david.williams@medical.com',`
- **Hash**: bb8eb17b

#### 35. Email Addresses
- **File**: `frontend/src/components/distributor/network/NetworkManagement.tsx`
- **Line**: 80
- **Pattern**: email_addresses
- **Match**: `west@distributor.com`
- **Context**: `email: 'west@distributor.com',`
- **Hash**: 363701b2

#### 36. Email Addresses
- **File**: `frontend/src/components/distributor/network/NetworkManagement.tsx`
- **Line**: 88
- **Pattern**: email_addresses
- **Match**: `maria.garcia@sales.com`
- **Context**: `email: 'maria.garcia@sales.com',`
- **Hash**: 33bd8b7b

#### 37. Email Addresses
- **File**: `frontend/src/components/distributor/network/NetworkManagement.tsx`
- **Line**: 97
- **Pattern**: email_addresses
- **Match**: `james.wilson@hospital.com`
- **Context**: `email: 'james.wilson@hospital.com',`
- **Hash**: 2e727546

#### 38. Email Addresses
- **File**: `frontend/src/components/distributor/orders/ShippingLogistics.tsx`
- **Line**: 65
- **Pattern**: email_addresses
- **Match**: `lisa.park@austinregional.com`
- **Context**: `email: 'lisa.park@austinregional.com'`
- **Hash**: af0df21d

#### 39. Email Addresses
- **File**: `frontend/src/components/distributor/orders/ShippingLogistics.tsx`
- **Line**: 106
- **Pattern**: email_addresses
- **Match**: `emma.davis@northaustin.com`
- **Context**: `email: 'emma.davis@northaustin.com'`
- **Hash**: ddb57327

#### 40. Email Addresses
- **File**: `frontend/src/components/distributor/orders/ShippingLogistics.tsx`
- **Line**: 148
- **Pattern**: email_addresses
- **Match**: `robert.chen@southaustin.com`
- **Context**: `email: 'robert.chen@southaustin.com'`
- **Hash**: e5cc7b01

#### 41. Email Addresses
- **File**: `frontend/src/components/distributor/orders/ShippingLogistics.tsx`
- **Line**: 189
- **Pattern**: email_addresses
- **Match**: `jennifer.martinez@cedarpark.com`
- **Context**: `email: 'jennifer.martinez@cedarpark.com'`
- **Hash**: 254657a2

#### 42. Email Addresses
- **File**: `frontend/src/components/distributor/orders/OrderFulfillmentDashboard.tsx`
- **Line**: 75
- **Pattern**: email_addresses
- **Match**: `sarah.chen@metro.health`
- **Context**: `email: 'sarah.chen@metro.health'`
- **Hash**: 4549161d

#### 43. Email Addresses
- **File**: `frontend/src/components/distributor/orders/OrderFulfillmentDashboard.tsx`
- **Line**: 119
- **Pattern**: email_addresses
- **Match**: `michael.rodriguez@stmarys.org`
- **Context**: `email: 'michael.rodriguez@stmarys.org'`
- **Hash**: deb22ef4

#### 44. Email Addresses
- **File**: `frontend/src/components/distributor/orders/OrderFulfillmentDashboard.tsx`
- **Line**: 157
- **Pattern**: email_addresses
- **Match**: `james.wilson@centraltx.com`
- **Context**: `email: 'james.wilson@centraltx.com'`
- **Hash**: 8c3071f2

#### 45. Email Addresses
- **File**: `frontend/src/pages/admin/users/index.tsx`
- **Line**: 17
- **Pattern**: email_addresses
- **Match**: `sarah.johnson@healthcare.com`
- **Context**: `email: 'sarah.johnson@healthcare.com',`
- **Hash**: 18ed9444

#### 46. Email Addresses
- **File**: `frontend/src/pages/admin/users/index.tsx`
- **Line**: 25
- **Pattern**: email_addresses
- **Match**: `james.wilson@healthcare.com`
- **Context**: `email: 'james.wilson@healthcare.com',`
- **Hash**: 0a1c9a48

#### 47. Email Addresses
- **File**: `frontend/src/pages/admin/users/index.tsx`
- **Line**: 33
- **Pattern**: email_addresses
- **Match**: `maria.garcia@healthcare.com`
- **Context**: `email: 'maria.garcia@healthcare.com',`
- **Hash**: ec369cbc

#### 48. Email Addresses
- **File**: `frontend/src/pages/admin/users/index.tsx`
- **Line**: 41
- **Pattern**: email_addresses
- **Match**: `david.chen@healthcare.com`
- **Context**: `email: 'david.chen@healthcare.com',`
- **Hash**: 73a9fd77

#### 49. Email Addresses
- **File**: `frontend/src/pages/login/index.tsx`
- **Line**: 104
- **Pattern**: email_addresses
- **Match**: `admin@healthcare.local`
- **Context**: `email: process.env.REACT_APP_TEST_ADMIN_EMAIL || 'admin@healthcare.local',`
- **Hash**: 0d430825

#### 50. Email Addresses
- **File**: `frontend/src/pages/login/index.tsx`
- **Line**: 108
- **Pattern**: email_addresses
- **Match**: `doctor@healthcare.local`
- **Context**: `email: process.env.REACT_APP_TEST_DOCTOR_EMAIL || 'doctor@healthcare.local',`
- **Hash**: be58a2be

#### 51. Email Addresses
- **File**: `frontend/src/pages/login/index.tsx`
- **Line**: 112
- **Pattern**: email_addresses
- **Match**: `ivr@healthcare.local`
- **Context**: `email: process.env.REACT_APP_TEST_IVR_EMAIL || 'ivr@healthcare.local',`
- **Hash**: fdcfc7ac

#### 52. Email Addresses
- **File**: `frontend/src/pages/login/index.tsx`
- **Line**: 151
- **Pattern**: email_addresses
- **Match**: `admin@healthcare.local`
- **Context**: `<span><strong>Admin:</strong> {process.env.REACT_APP_TEST_ADMIN_EMAIL || 'admin@healthcare.local'} /...`
- **Hash**: 0d430825

#### 53. Email Addresses
- **File**: `frontend/src/pages/login/index.tsx`
- **Line**: 161
- **Pattern**: email_addresses
- **Match**: `doctor@healthcare.local`
- **Context**: `<span><strong>Doctor:</strong> {process.env.REACT_APP_TEST_DOCTOR_EMAIL || 'doctor@healthcare.local'...`
- **Hash**: be58a2be

#### 54. Email Addresses
- **File**: `frontend/src/pages/login/index.tsx`
- **Line**: 171
- **Pattern**: email_addresses
- **Match**: `ivr@healthcare.local`
- **Context**: `<span><strong>IVR:</strong> {process.env.REACT_APP_TEST_IVR_EMAIL || 'ivr@healthcare.local'} / {proc...`
- **Hash**: fdcfc7ac

#### 55. Email Addresses
- **File**: `frontend/src/services/mockPatientService.ts`
- **Line**: 9
- **Pattern**: email_addresses
- **Match**: `john.smith@email.com`
- **Context**: `email: 'john.smith@email.com',`
- **Hash**: d9d058c2

#### 56. Email Addresses
- **File**: `frontend/src/services/mockPatientService.ts`
- **Line**: 29
- **Pattern**: email_addresses
- **Match**: `sarah.j@email.com`
- **Context**: `email: 'sarah.j@email.com',`
- **Hash**: 0a9aaa24

#### 57. Email Addresses
- **File**: `frontend/src/services/mockPatientService.ts`
- **Line**: 49
- **Pattern**: email_addresses
- **Match**: `michael.b@email.com`
- **Context**: `email: 'michael.b@email.com',`
- **Hash**: 7f7b151b

#### 58. Email Addresses
- **File**: `frontend/src/services/mockPatientService.ts`
- **Line**: 69
- **Pattern**: email_addresses
- **Match**: `emily.d@email.com`
- **Context**: `email: 'emily.d@email.com',`
- **Hash**: 693312b4

#### 59. Email Addresses
- **File**: `frontend/src/services/mockPatientService.ts`
- **Line**: 89
- **Pattern**: email_addresses
- **Match**: `robert.w@email.com`
- **Context**: `email: 'robert.w@email.com',`
- **Hash**: d402b63b

#### 60. Email Addresses
- **File**: `frontend/src/services/mockIVRService.ts`
- **Line**: 13
- **Pattern**: email_addresses
- **Match**: `jane.smith@ivrcompany.com`
- **Context**: `{ id: 'IVR1', name: 'Jane Smith', email: 'jane.smith@ivrcompany.com', role: 'IVRCompany' },`
- **Hash**: 85d3d4e4

#### 61. Email Addresses
- **File**: `frontend/src/services/mockIVRService.ts`
- **Line**: 14
- **Pattern**: email_addresses
- **Match**: `bob.johnson@ivrcompany.com`
- **Context**: `{ id: 'IVR2', name: 'Bob Johnson', email: 'bob.johnson@ivrcompany.com', role: 'IVRCompany' }`
- **Hash**: bbe20462

#### 62. Email Addresses
- **File**: `backend/test_auth.py`
- **Line**: 52
- **Pattern**: email_addresses
- **Match**: `admin@healthcare.local`
- **Context**: `("admin@healthcare.local", "admin123", True),`
- **Hash**: 0d430825

#### 63. Email Addresses
- **File**: `backend/test_auth.py`
- **Line**: 53
- **Pattern**: email_addresses
- **Match**: `doctor@healthcare.local`
- **Context**: `("doctor@healthcare.local", "doctor123", True),`
- **Hash**: be58a2be

#### 64. Email Addresses
- **File**: `backend/test_auth.py`
- **Line**: 54
- **Pattern**: email_addresses
- **Match**: `ivr@healthcare.local`
- **Context**: `("ivr@healthcare.local", "ivr123", True),`
- **Hash**: fdcfc7ac

#### 65. Email Addresses
- **File**: `backend/test_auth.py`
- **Line**: 55
- **Pattern**: email_addresses
- **Match**: `admin@healthcare.local`
- **Context**: `("admin@healthcare.local", "wrong_password", False),`
- **Hash**: 0d430825

#### 66. Email Addresses
- **File**: `backend/test_auth.py`
- **Line**: 56
- **Pattern**: email_addresses
- **Match**: `nonexistent@healthcare.local`
- **Context**: `("nonexistent@healthcare.local", "password", False),`
- **Hash**: e9f1fc08

#### 67. Email Addresses
- **File**: `backend/test_patient_integration_final.py`
- **Line**: 46
- **Pattern**: email_addresses
- **Match**: `doctor@hospital.com`
- **Context**: `user_email="doctor@hospital.com",`
- **Hash**: 17710065

#### 68. Email Addresses
- **File**: `backend/test_patient_integration_final.py`
- **Line**: 59
- **Pattern**: email_addresses
- **Match**: `jane.smith@email.com`
- **Context**: `"email": "jane.smith@email.com",`
- **Hash**: 5a15de96

#### 69. Email Addresses
- **File**: `backend/test_patient_integration_final.py`
- **Line**: 219
- **Pattern**: email_addresses
- **Match**: `doctor@hospital.com`
- **Context**: `"user_email": "doctor@hospital.com",`
- **Hash**: 17710065

#### 70. Email Addresses
- **File**: `backend/test_patient_integration_final.py`
- **Line**: 225
- **Pattern**: email_addresses
- **Match**: `nurse@hospital.com`
- **Context**: `"user_email": "nurse@hospital.com",`
- **Hash**: 0758b07e

#### 71. Email Addresses
- **File**: `backend/test_patient_integration_final.py`
- **Line**: 231
- **Pattern**: email_addresses
- **Match**: `admin@hospital.com`
- **Context**: `"user_email": "admin@hospital.com",`
- **Hash**: 4690ff8f

#### 72. Email Addresses
- **File**: `backend/test_patient_encryption.py`
- **Line**: 80
- **Pattern**: email_addresses
- **Match**: `doctor@test.com`
- **Context**: `email="doctor@test.com",`
- **Hash**: cd2b2d49

#### 73. Email Addresses
- **File**: `backend/test_patient_encryption.py`
- **Line**: 106
- **Pattern**: email_addresses
- **Match**: `provider@test.com`
- **Context**: `email="provider@test.com",`
- **Hash**: 6dd03a8c

#### 74. Email Addresses
- **File**: `backend/test_patient_encryption.py`
- **Line**: 148
- **Pattern**: email_addresses
- **Match**: `john.doe@email.com`
- **Context**: `"email": "john.doe@email.com",`
- **Hash**: 8f6e9627

#### 75. Email Addresses
- **File**: `backend/test_patient_encryption.py`
- **Line**: 195
- **Pattern**: email_addresses
- **Match**: `john.doe@email.com`
- **Context**: `assert retrieved_patient.email == "john.doe@email.com", "Email mismatch"`
- **Hash**: 8f6e9627

#### 76. Ip Addresses
- **File**: `backend/app/schemas/compliance.py`
- **Line**: 34
- **Pattern**: ip_addresses
- **Match**: `192.168.1.1`
- **Context**: `"ip_address": "192.168.1.1",`
- **Hash**: 66efff4c

#### 77. Ip Addresses
- **File**: `backend/app/schemas/compliance.py`
- **Line**: 63
- **Pattern**: ip_addresses
- **Match**: `192.168.1.1`
- **Context**: `"details": {"attempt_count": 5, "ip_address": "192.168.1.1"},`
- **Hash**: 66efff4c

#### 78. Email Addresses
- **File**: `backend/app/services/mock_auth_service.py`
- **Line**: 29
- **Pattern**: email_addresses
- **Match**: `admin@healthcare.local`
- **Context**: `"admin@healthcare.local": {`
- **Hash**: 0d430825

#### 79. Email Addresses
- **File**: `backend/app/services/mock_auth_service.py`
- **Line**: 31
- **Pattern**: email_addresses
- **Match**: `admin@healthcare.local`
- **Context**: `"email": "admin@healthcare.local",`
- **Hash**: 0d430825

#### 80. Email Addresses
- **File**: `backend/app/services/mock_auth_service.py`
- **Line**: 42
- **Pattern**: email_addresses
- **Match**: `doctor@healthcare.local`
- **Context**: `"doctor@healthcare.local": {`
- **Hash**: be58a2be

#### 81. Email Addresses
- **File**: `backend/app/services/mock_auth_service.py`
- **Line**: 44
- **Pattern**: email_addresses
- **Match**: `doctor@healthcare.local`
- **Context**: `"email": "doctor@healthcare.local",`
- **Hash**: be58a2be

#### 82. Email Addresses
- **File**: `backend/app/services/mock_auth_service.py`
- **Line**: 55
- **Pattern**: email_addresses
- **Match**: `ivr@healthcare.local`
- **Context**: `"ivr@healthcare.local": {`
- **Hash**: fdcfc7ac

#### 83. Email Addresses
- **File**: `backend/app/services/mock_auth_service.py`
- **Line**: 57
- **Pattern**: email_addresses
- **Match**: `ivr@healthcare.local`
- **Context**: `"email": "ivr@healthcare.local",`
- **Hash**: fdcfc7ac

#### 84. Email Addresses
- **File**: `backend/app/services/mock_auth_service.py`
- **Line**: 68
- **Pattern**: email_addresses
- **Match**: `distributor@healthcare.local`
- **Context**: `"distributor@healthcare.local": {`
- **Hash**: de359838

#### 85. Email Addresses
- **File**: `backend/app/services/mock_auth_service.py`
- **Line**: 70
- **Pattern**: email_addresses
- **Match**: `distributor@healthcare.local`
- **Context**: `"email": "distributor@healthcare.local",`
- **Hash**: de359838

#### 86. Email Addresses
- **File**: `backend/app/services/mock_auth_service.py`
- **Line**: 81
- **Pattern**: email_addresses
- **Match**: `chp@healthcare.local`
- **Context**: `"chp@healthcare.local": {`
- **Hash**: ac055b2e

#### 87. Email Addresses
- **File**: `backend/app/services/mock_auth_service.py`
- **Line**: 83
- **Pattern**: email_addresses
- **Match**: `chp@healthcare.local`
- **Context**: `"email": "chp@healthcare.local",`
- **Hash**: ac055b2e

#### 88. Email Addresses
- **File**: `backend/app/services/mock_auth_service.py`
- **Line**: 94
- **Pattern**: email_addresses
- **Match**: `distributor2@healthcare.local`
- **Context**: `"distributor2@healthcare.local": {`
- **Hash**: 0f75ee24

#### 89. Email Addresses
- **File**: `backend/app/services/mock_auth_service.py`
- **Line**: 96
- **Pattern**: email_addresses
- **Match**: `distributor2@healthcare.local`
- **Context**: `"email": "distributor2@healthcare.local",`
- **Hash**: 0f75ee24

#### 90. Email Addresses
- **File**: `backend/app/services/mock_auth_service.py`
- **Line**: 107
- **Pattern**: email_addresses
- **Match**: `sales@healthcare.local`
- **Context**: `"sales@healthcare.local": {`
- **Hash**: f04cb7e4

#### 91. Email Addresses
- **File**: `backend/app/services/mock_auth_service.py`
- **Line**: 109
- **Pattern**: email_addresses
- **Match**: `sales@healthcare.local`
- **Context**: `"email": "sales@healthcare.local",`
- **Hash**: f04cb7e4

#### 92. Email Addresses
- **File**: `backend/app/services/mock_auth_service.py`
- **Line**: 120
- **Pattern**: email_addresses
- **Match**: `logistics@healthcare.local`
- **Context**: `"logistics@healthcare.local": {`
- **Hash**: 9f4e98fb

#### 93. Email Addresses
- **File**: `backend/app/services/mock_auth_service.py`
- **Line**: 122
- **Pattern**: email_addresses
- **Match**: `logistics@healthcare.local`
- **Context**: `"email": "logistics@healthcare.local",`
- **Hash**: 9f4e98fb

#### 94. Ip Addresses
- **File**: `backend/tests/test_security_monitoring.py`
- **Line**: 24
- **Pattern**: ip_addresses
- **Match**: `192.168.1.1`
- **Context**: `user_id=test_user.id, ip_address="192.168.1.1", user_agent="test-browser"`
- **Hash**: 66efff4c

#### 95. Ip Addresses
- **File**: `backend/tests/test_security_monitoring.py`
- **Line**: 36
- **Pattern**: ip_addresses
- **Match**: `192.168.1.1`
- **Context**: `user_id=test_user.id, ip_address="192.168.1.1", user_agent="test-browser"`
- **Hash**: 66efff4c

#### 96. Ip Addresses
- **File**: `backend/tests/test_security_monitoring.py`
- **Line**: 191
- **Pattern**: ip_addresses
- **Match**: `192.168.1.1`
- **Context**: `"sourceIPAddress": "192.168.1.1"`
- **Hash**: 66efff4c

#### 97. Ip Addresses
- **File**: `backend/tests/security/test_hipaa_compliance.py`
- **Line**: 59
- **Pattern**: ip_addresses
- **Match**: `192.168.1.1`
- **Context**: `request_metadata={"ip_address": "192.168.1.1", "user_agent": "test-browser"},`
- **Hash**: 66efff4c

#### 98. Ip Addresses
- **File**: `backend/tests/security/test_hipaa_compliance.py`
- **Line**: 128
- **Pattern**: ip_addresses
- **Match**: `192.168.1.1`
- **Context**: `"ip_address": "192.168.1.1",`
- **Hash**: 66efff4c

#### 99. Email Addresses
- **File**: `backend/tests/integration/test_phase1_completion.py`
- **Line**: 49
- **Pattern**: email_addresses
- **Match**: `provider@test.com`
- **Context**: `email="provider@test.com",`
- **Hash**: 6dd03a8c

#### 100. Email Addresses
- **File**: `backend/.mypy_cache/3.12/sqlalchemy/orm/descriptor_props.data.json`
- **Line**: 1
- **Pattern**: email_addresses
- **Match**: `sqlalchemy.orm.descriptor_props.NoninheritedConcreteProp@912.Self`
- **Context**: `{".class":"MypyFile","_fullname":"sqlalchemy.orm.descriptor_props","future_import_flags":["annotatio...`
- **Hash**: df649547

#### 101. Email Addresses
- **File**: `backend/.mypy_cache/3.12/sqlalchemy/orm/descriptor_props.data.json`
- **Line**: 1
- **Pattern**: email_addresses
- **Match**: `sqlalchemy.orm.descriptor_props._ProxyImpl@113.collection`
- **Context**: `{".class":"MypyFile","_fullname":"sqlalchemy.orm.descriptor_props","future_import_flags":["annotatio...`
- **Hash**: 7dd2d8e2

#### 102. Email Addresses
- **File**: `backend/.mypy_cache/3.12/sqlalchemy/orm/descriptor_props.data.json`
- **Line**: 1
- **Pattern**: email_addresses
- **Match**: `sqlalchemy.orm.descriptor_props._ProxyImpl@113.Self`
- **Context**: `{".class":"MypyFile","_fullname":"sqlalchemy.orm.descriptor_props","future_import_flags":["annotatio...`
- **Hash**: 949bb2a9

#### 103. Email Addresses
- **File**: `backend/.mypy_cache/3.12/sqlalchemy/sql/compiler.data.json`
- **Line**: 1
- **Pattern**: email_addresses
- **Match**: `sqlalchemy.sql.compiler.FromLinter@677.edges`
- **Context**: `{".class":"MypyFile","_fullname":"sqlalchemy.sql.compiler","future_import_flags":["annotations"],"is...`
- **Hash**: 12b89071

#### 104. Email Addresses
- **File**: `backend/.mypy_cache/3.12/sqlalchemy/sql/compiler.data.json`
- **Line**: 1
- **Pattern**: email_addresses
- **Match**: `sqlalchemy.sql.compiler.FromLinter@677.froms`
- **Context**: `{".class":"MypyFile","_fullname":"sqlalchemy.sql.compiler","future_import_flags":["annotations"],"is...`
- **Hash**: 765be5fd

#### 105. Email Addresses
- **File**: `backend/.mypy_cache/3.12/urllib3/util/url.data.json`
- **Line**: 1
- **Pattern**: email_addresses
- **Match**: `urllib3.util.url.Url@81.auth`
- **Context**: `{".class":"MypyFile","_fullname":"urllib3.util.url","future_import_flags":["annotations"],"is_partia...`
- **Hash**: 7059de53

#### 106. Email Addresses
- **File**: `backend/.mypy_cache/3.12/urllib3/util/url.data.json`
- **Line**: 1
- **Pattern**: email_addresses
- **Match**: `urllib3.util.url.Url@81.fragment`
- **Context**: `{".class":"MypyFile","_fullname":"urllib3.util.url","future_import_flags":["annotations"],"is_partia...`
- **Hash**: b20b146a

#### 107. Email Addresses
- **File**: `backend/.mypy_cache/3.12/urllib3/util/url.data.json`
- **Line**: 1
- **Pattern**: email_addresses
- **Match**: `urllib3.util.url.Url@81.host`
- **Context**: `{".class":"MypyFile","_fullname":"urllib3.util.url","future_import_flags":["annotations"],"is_partia...`
- **Hash**: 2128cb81

#### 108. Email Addresses
- **File**: `backend/.mypy_cache/3.12/urllib3/util/url.data.json`
- **Line**: 1
- **Pattern**: email_addresses
- **Match**: `urllib3.util.url.Url@81.path`
- **Context**: `{".class":"MypyFile","_fullname":"urllib3.util.url","future_import_flags":["annotations"],"is_partia...`
- **Hash**: 1098eb6f

#### 109. Email Addresses
- **File**: `backend/.mypy_cache/3.12/urllib3/util/url.data.json`
- **Line**: 1
- **Pattern**: email_addresses
- **Match**: `urllib3.util.url.Url@81.port`
- **Context**: `{".class":"MypyFile","_fullname":"urllib3.util.url","future_import_flags":["annotations"],"is_partia...`
- **Hash**: 942f566e

#### 110. Email Addresses
- **File**: `backend/.mypy_cache/3.12/urllib3/util/url.data.json`
- **Line**: 1
- **Pattern**: email_addresses
- **Match**: `urllib3.util.url.Url@81.query`
- **Context**: `{".class":"MypyFile","_fullname":"urllib3.util.url","future_import_flags":["annotations"],"is_partia...`
- **Hash**: 7df593ae

#### 111. Email Addresses
- **File**: `backend/.mypy_cache/3.12/urllib3/util/url.data.json`
- **Line**: 1
- **Pattern**: email_addresses
- **Match**: `urllib3.util.url.Url@81.scheme`
- **Context**: `{".class":"MypyFile","_fullname":"urllib3.util.url","future_import_flags":["annotations"],"is_partia...`
- **Hash**: 6a99fdcb

#### 112. Email Addresses
- **File**: `backend/scripts/test_auth.py`
- **Line**: 19
- **Pattern**: email_addresses
- **Match**: `admin@demo.com`
- **Context**: `"WHERE email = 'admin@demo.com' RETURNING id, email, encrypted_password"`
- **Hash**: 454141da

#### 113. Email Addresses
- **File**: `backend/scripts/system_bootstrap.py`
- **Line**: 58
- **Pattern**: email_addresses
- **Match**: `admin@healthcare-ivr.com`
- **Context**: `contact_email="admin@healthcare-ivr.com",`
- **Hash**: 4cd3ab68

#### 114. Email Addresses
- **File**: `backend/scripts/system_bootstrap.py`
- **Line**: 72
- **Pattern**: email_addresses
- **Match**: `admin@healthcare-ivr.com`
- **Context**: `admin_email = "admin@healthcare-ivr.com"`
- **Hash**: 4cd3ab68

#### 115. Email Addresses
- **File**: `backend/scripts/manual_phase1_verification.py`
- **Line**: 93
- **Pattern**: email_addresses
- **Match**: `test@healthcare.dev`
- **Context**: `email="test@healthcare.dev",`
- **Hash**: c3935378

#### 116. Email Addresses
- **File**: `backend/scripts/manual_phase1_verification.py`
- **Line**: 113
- **Pattern**: email_addresses
- **Match**: `provider@healthcare.dev`
- **Context**: `email="provider@healthcare.dev",`
- **Hash**: b05df5c6

#### 117. Email Addresses
- **File**: `backend/scripts/create_demo_users.sql`
- **Line**: 36
- **Pattern**: email_addresses
- **Match**: `doctor@test.com`
- **Context**: `'doctor@test.com',`
- **Hash**: cd2b2d49

#### 118. Email Addresses
- **File**: `backend/scripts/create_demo_users.sql`
- **Line**: 46
- **Pattern**: email_addresses
- **Match**: `admin@test.com`
- **Context**: `'admin@test.com',`
- **Hash**: 5b37040e

#### 119. Email Addresses
- **File**: `backend/scripts/create_demo_users.sql`
- **Line**: 56
- **Pattern**: email_addresses
- **Match**: `ivr@test.com`
- **Context**: `'ivr@test.com',`
- **Hash**: a9483f3c

#### 120. Email Addresses
- **File**: `backend/scripts/create_demo_users.sql`
- **Line**: 66
- **Pattern**: email_addresses
- **Match**: `logistics@test.com`
- **Context**: `'logistics@test.com',`
- **Hash**: 2c98dccc

#### 121. Email Addresses
- **File**: `backend/scripts/create_demo_users.sql`
- **Line**: 76
- **Pattern**: email_addresses
- **Match**: `sales@test.com`
- **Context**: `'sales@test.com',`
- **Hash**: 5f030385

#### 122. Email Addresses
- **File**: `backend/scripts/add_sample_data.py`
- **Line**: 49
- **Pattern**: email_addresses
- **Match**: `admin@demo.com`
- **Context**: `user_query = select(User).filter(User.email == "admin@demo.com")`
- **Hash**: 454141da

#### 123. Email Addresses
- **File**: `backend/scripts/add_sample_data.py`
- **Line**: 65
- **Pattern**: email_addresses
- **Match**: `admin@demo.com`
- **Context**: `email="admin@demo.com",`
- **Hash**: 454141da

#### 124. Email Addresses
- **File**: `backend/scripts/add_sample_data.py`
- **Line**: 100
- **Pattern**: email_addresses
- **Match**: `clinic@demo.com`
- **Context**: `email="clinic@demo.com",`
- **Hash**: 7e968a1a

#### 125. Email Addresses
- **File**: `backend/scripts/add_sample_data.py`
- **Line**: 123
- **Pattern**: email_addresses
- **Match**: `doctor@demo.com`
- **Context**: `email="doctor@demo.com",`
- **Hash**: afcba9ba

#### 126. Email Addresses
- **File**: `backend/scripts/add_sample_data.py`
- **Line**: 155
- **Pattern**: email_addresses
- **Match**: `patient@demo.com`
- **Context**: `encrypted_email=encrypt_to_bytes("patient@demo.com"),`
- **Hash**: b6237a61

#### 127. Email Addresses
- **File**: `docs/CURRENT_TASK.md`
- **Line**: 24
- **Pattern**: email_addresses
- **Match**: `admin@healthcare.local`
- **Context**: `1. **Admin** (`admin@healthcare.local` / `admin123`) → `/admin/dashboard``
- **Hash**: 0d430825

#### 128. Email Addresses
- **File**: `docs/CURRENT_TASK.md`
- **Line**: 25
- **Pattern**: email_addresses
- **Match**: `doctor@healthcare.local`
- **Context**: `2. **Doctor** (`doctor@healthcare.local` / `doctor123`) → `/doctor/dashboard``
- **Hash**: be58a2be

#### 129. Email Addresses
- **File**: `docs/CURRENT_TASK.md`
- **Line**: 26
- **Pattern**: email_addresses
- **Match**: `ivr@healthcare.local`
- **Context**: `3. **IVR** (`ivr@healthcare.local` / `ivr123`) → `/ivr/dashboard``
- **Hash**: fdcfc7ac

#### 130. Email Addresses
- **File**: `docs/CURRENT_TASK.md`
- **Line**: 27
- **Pattern**: email_addresses
- **Match**: `distributor@healthcare.local`
- **Context**: `4. **Master Distributor** (`distributor@healthcare.local` / `distributor123`) → `/distributor/dashbo...`
- **Hash**: de359838

#### 131. Email Addresses
- **File**: `docs/CURRENT_TASK.md`
- **Line**: 28
- **Pattern**: email_addresses
- **Match**: `chp@healthcare.local`
- **Context**: `5. **CHP Admin** (`chp@healthcare.local` / `chp123`) → `/chp/dashboard``
- **Hash**: ac055b2e

#### 132. Email Addresses
- **File**: `docs/CURRENT_TASK.md`
- **Line**: 29
- **Pattern**: email_addresses
- **Match**: `distributor2@healthcare.local`
- **Context**: `6. **Distributor** (`distributor2@healthcare.local` / `distributor123`) → `/distributor-regional/das...`
- **Hash**: 0f75ee24

#### 133. Email Addresses
- **File**: `docs/CURRENT_TASK.md`
- **Line**: 30
- **Pattern**: email_addresses
- **Match**: `sales@healthcare.local`
- **Context**: `7. **Sales** (`sales@healthcare.local` / `sales123`) → `/sales/dashboard``
- **Hash**: f04cb7e4

#### 134. Email Addresses
- **File**: `docs/CURRENT_TASK.md`
- **Line**: 31
- **Pattern**: email_addresses
- **Match**: `logistics@healthcare.local`
- **Context**: `8. **Shipping and Logistics** (`logistics@healthcare.local` / `logistics123`) → `/logistics/dashboar...`
- **Hash**: 9f4e98fb

#### 135. Email Addresses
- **File**: `memory-bank/progress.md`
- **Line**: 106
- **Pattern**: email_addresses
- **Match**: `admin@healthcare.local`
- **Context**: `1. **Admin** (`admin@healthcare.local` / `admin123`) → `/admin/dashboard` - System administration`
- **Hash**: 0d430825

#### 136. Email Addresses
- **File**: `memory-bank/progress.md`
- **Line**: 107
- **Pattern**: email_addresses
- **Match**: `doctor@healthcare.local`
- **Context**: `2. **Doctor** (`doctor@healthcare.local` / `doctor123`) → `/doctor/dashboard` - Medical provider acc...`
- **Hash**: be58a2be

#### 137. Email Addresses
- **File**: `memory-bank/progress.md`
- **Line**: 108
- **Pattern**: email_addresses
- **Match**: `ivr@healthcare.local`
- **Context**: `3. **IVR** (`ivr@healthcare.local` / `ivr123`) → `/ivr/dashboard` - Interactive Voice Response syste...`
- **Hash**: fdcfc7ac

#### 138. Email Addresses
- **File**: `memory-bank/progress.md`
- **Line**: 109
- **Pattern**: email_addresses
- **Match**: `distributor@healthcare.local`
- **Context**: `4. **Master Distributor** (`distributor@healthcare.local` / `distributor123`) → `/distributor/dashbo...`
- **Hash**: de359838

#### 139. Email Addresses
- **File**: `memory-bank/progress.md`
- **Line**: 110
- **Pattern**: email_addresses
- **Match**: `chp@healthcare.local`
- **Context**: `5. **CHP Admin** (`chp@healthcare.local` / `chp123`) → `/chp/dashboard` - Community Health Program a...`
- **Hash**: ac055b2e

#### 140. Email Addresses
- **File**: `memory-bank/progress.md`
- **Line**: 111
- **Pattern**: email_addresses
- **Match**: `distributor2@healthcare.local`
- **Context**: `6. **Distributor** (`distributor2@healthcare.local` / `distributor123`) → `/distributor-regional/das...`
- **Hash**: 0f75ee24

#### 141. Email Addresses
- **File**: `memory-bank/progress.md`
- **Line**: 112
- **Pattern**: email_addresses
- **Match**: `sales@healthcare.local`
- **Context**: `7. **Sales** (`sales@healthcare.local` / `sales123`) → `/sales/dashboard` - Sales representative too...`
- **Hash**: f04cb7e4

#### 142. Email Addresses
- **File**: `memory-bank/progress.md`
- **Line**: 113
- **Pattern**: email_addresses
- **Match**: `logistics@healthcare.local`
- **Context**: `8. **Shipping and Logistics** (`logistics@healthcare.local` / `logistics123`) → `/logistics/dashboar...`
- **Hash**: 9f4e98fb

#### 143. Email Addresses
- **File**: `memory-bank/docs/authentication-routing-overhaul.md`
- **Line**: 37
- **Pattern**: email_addresses
- **Match**: `admin@healthcare.local`
- **Context**: `| Admin | `admin@healthcare.local` | `admin123` | System administration |`
- **Hash**: 0d430825

#### 144. Email Addresses
- **File**: `memory-bank/docs/authentication-routing-overhaul.md`
- **Line**: 38
- **Pattern**: email_addresses
- **Match**: `doctor@healthcare.local`
- **Context**: `| Doctor | `doctor@healthcare.local` | `doctor123` | Medical provider access |`
- **Hash**: be58a2be

#### 145. Email Addresses
- **File**: `memory-bank/docs/authentication-routing-overhaul.md`
- **Line**: 39
- **Pattern**: email_addresses
- **Match**: `ivr@healthcare.local`
- **Context**: `| IVR | `ivr@healthcare.local` | `ivr123` | Interactive Voice Response system |`
- **Hash**: fdcfc7ac

#### 146. Email Addresses
- **File**: `memory-bank/docs/authentication-routing-overhaul.md`
- **Line**: 40
- **Pattern**: email_addresses
- **Match**: `distributor@healthcare.local`
- **Context**: `| Master Distributor | `distributor@healthcare.local` | `distributor123` | Regional distribution man...`
- **Hash**: de359838

#### 147. Email Addresses
- **File**: `memory-bank/docs/authentication-routing-overhaul.md`
- **Line**: 41
- **Pattern**: email_addresses
- **Match**: `chp@healthcare.local`
- **Context**: `| CHP Admin | `chp@healthcare.local` | `chp123` | Community Health Program administration |`
- **Hash**: ac055b2e

#### 148. Email Addresses
- **File**: `memory-bank/docs/authentication-routing-overhaul.md`
- **Line**: 42
- **Pattern**: email_addresses
- **Match**: `distributor2@healthcare.local`
- **Context**: `| Distributor | `distributor2@healthcare.local` | `distributor123` | Local distribution operations |`
- **Hash**: 0f75ee24

#### 149. Email Addresses
- **File**: `memory-bank/docs/authentication-routing-overhaul.md`
- **Line**: 43
- **Pattern**: email_addresses
- **Match**: `sales@healthcare.local`
- **Context**: `| Sales | `sales@healthcare.local` | `sales123` | Sales representative tools |`
- **Hash**: f04cb7e4

#### 150. Email Addresses
- **File**: `memory-bank/docs/authentication-routing-overhaul.md`
- **Line**: 44
- **Pattern**: email_addresses
- **Match**: `logistics@healthcare.local`
- **Context**: `| Shipping and Logistics | `logistics@healthcare.local` | `logistics123` | Logistics operations |`
- **Hash**: 9f4e98fb

#### 151. Email Addresses
- **File**: `memory-bank/docs/authentication-routing-overhaul.md`
- **Line**: 134
- **Pattern**: email_addresses
- **Match**: `admin@healthcare.local`
- **Context**: `"sub": "admin@healthcare.local",`
- **Hash**: 0d430825

#### 152. Email Addresses
- **File**: `memory-bank/docs/authentication-routing-overhaul.md`
- **Line**: 145
- **Pattern**: email_addresses
- **Match**: `admin@healthcare.local`
- **Context**: `"email": "admin@healthcare.local",`
- **Hash**: 0d430825

## Recommendations

### Immediate Actions (High Risk)
1. **Move all hard-coded credentials to environment variables**
2. **Update .env.example with placeholder values**
3. **Ensure .env files are in .gitignore**
4. **Rotate any exposed credentials**

### Security Best Practices
1. **Use environment variables for all sensitive configuration**
2. **Implement proper secret management (AWS Secrets Manager, etc.)**
3. **Regular credential rotation**
4. **Code review processes to catch credentials**
5. **Pre-commit hooks to prevent credential commits**

### Environment Variable Migration
For each finding, create corresponding environment variables:

```bash
# Example .env structure
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
JWT_SECRET=your-jwt-secret-here
API_KEY=your-api-key-here
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
```

### Code Updates Required
Replace hard-coded values with environment variable lookups:

```python
# Before (INSECURE)
password = "hardcoded_password"

# After (SECURE)
import os
password = os.getenv('DATABASE_PASSWORD')
```

## Scan Configuration
- **Patterns Checked**: 29
- **Excluded Directories**: .git, __pycache__, node_modules, .venv, venv, dist, build, .pytest_cache, htmlcov, logs, key_backups, test-results, verification_reports
- **Excluded Extensions**: .jpg, .jpeg, .png, .gif, .svg, .ico, .pdf, .doc, .docx, .zip, .tar, .gz

---
*This report was generated by the Healthcare IVR Platform Credential Scanner*
*For questions or issues, contact the security team*
