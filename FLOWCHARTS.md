# Shield Drug - System Flowcharts

## 1. Overall System Flow

```mermaid
flowchart TD
    START([System Start]) --> AUTH{User<br/>Authenticated?}
    
    AUTH -->|No| LOGIN[Login Page]
    LOGIN --> AUTH
    
    AUTH -->|Yes| ROLE{User Role?}
    
    ROLE -->|Manufacturer| MANU[Manufacturer Dashboard]
    ROLE -->|Pharmacist| PHAR[Pharmacist Dashboard]
    ROLE -->|Consumer| CONS[Consumer Dashboard]
    ROLE -->|Regulatory| REG[Regulatory Dashboard]
    ROLE -->|Admin| ADMIN[Admin Dashboard]
    
    MANU --> MANU_ACT{Action?}
    MANU_ACT -->|Upload Batch| UPLOAD_FLOW[Batch Upload Flow]
    MANU_ACT -->|View Analytics| ANALYTICS[View Analytics]
    MANU_ACT -->|Generate QR| QR_FLOW[QR Generation Flow]
    MANU_ACT -->|View History| HISTORY[View Upload History]
    
    PHAR --> PHAR_ACT{Action?}
    PHAR_ACT -->|Scan Drug| VERIFY_FLOW[Verification Flow]
    PHAR_ACT -->|Inventory| INVENTORY[Manage Inventory]
    PHAR_ACT -->|Reports| REPORTS[Generate Reports]
    
    CONS --> CONS_ACT{Action?}
    CONS_ACT -->|Verify Drug| VERIFY_FLOW
    CONS_ACT -->|View History| CONS_HIST[View History]
    CONS_ACT -->|Report Issue| REPORT[Submit Report]
    
    REG --> REG_ACT{Action?}
    REG_ACT -->|Monitor| MONITOR[Monitor Supply Chain]
    REG_ACT -->|Analytics| REG_ANALYTICS[Regulatory Analytics]
    REG_ACT -->|Audit| AUDIT[Audit Trail]
    
    ADMIN --> ADMIN_ACT{Action?}
    ADMIN_ACT -->|Users| USER_MGMT[User Management]
    ADMIN_ACT -->|Health| HEALTH[System Health]
    ADMIN_ACT -->|Logs| LOGS[View Audit Logs]
    ADMIN_ACT -->|Settings| SETTINGS[System Settings]
    
    style START fill:#4CAF50,color:#fff
    style AUTH fill:#2196F3,color:#fff
    style ROLE fill:#2196F3,color:#fff
```

## 2. Manufacturer Batch Upload Flow

```mermaid
flowchart TD
    START([Manufacturer Uploads CSV]) --> VALIDATE_FILE{Valid CSV<br/>File?}
    
    VALIDATE_FILE -->|No| ERROR1[Show File Error]
    ERROR1 --> END1([End])
    
    VALIDATE_FILE -->|Yes| PARSE[Parse CSV Data]
    PARSE --> VALIDATE_DATA{Valid Drug<br/>Data?}
    
    VALIDATE_DATA -->|No| ERROR2[Show Validation Errors]
    ERROR2 --> END2([End])
    
    VALIDATE_DATA -->|Yes| CREATE_UPLOAD[Create Upload Record<br/>in MongoDB]
    CREATE_UPLOAD --> HASH[Generate File Hash]
    HASH --> BATCH_LOOP{More<br/>Batches?}
    
    BATCH_LOOP -->|Yes| PROCESS_BATCH[Process Current Batch]
    PROCESS_BATCH --> BC_RECORD[Record Batch on<br/>Avalanche Blockchain]
    
    BC_RECORD --> BC_SUCCESS{Blockchain<br/>Success?}
    BC_SUCCESS -->|No| BC_RETRY{Retry<br/>Count < 3?}
    BC_RETRY -->|Yes| BC_RECORD
    BC_RETRY -->|No| ERROR3[Log Blockchain Error]
    ERROR3 --> BATCH_LOOP
    
    BC_SUCCESS -->|Yes| GEN_QR[Generate QR Code]
    GEN_QR --> RECORD_QR[Record QR on Blockchain]
    RECORD_QR --> SAVE_QR[Save QR to MongoDB]
    SAVE_QR --> UPDATE_PROGRESS[Update Progress]
    UPDATE_PROGRESS --> BATCH_LOOP
    
    BATCH_LOOP -->|No| UPDATE_STATUS[Update Upload Status<br/>to Completed]
    UPDATE_STATUS --> SEND_NOTIF[Send Success Notification]
    SEND_NOTIF --> SHOW_RESULTS[Display QR Codes<br/>& Statistics]
    SHOW_RESULTS --> END3([End])
    
    style START fill:#4CAF50,color:#fff
    style END1 fill:#f44336,color:#fff
    style END2 fill:#f44336,color:#fff
    style END3 fill:#4CAF50,color:#fff
    style BC_RECORD fill:#9C27B0,color:#fff
    style RECORD_QR fill:#9C27B0,color:#fff
```

## 3. Drug Verification Flow (Consumer/Pharmacist)

```mermaid
flowchart TD
    START([User Captures Image/QR]) --> CHECK_TYPE{Input Type?}
    
    CHECK_TYPE -->|QR Code| SCAN_QR[Scan QR Code]
    CHECK_TYPE -->|Drug Image| CAPTURE_IMG[Capture Drug Image]
    
    SCAN_QR --> DECODE_QR[Decode QR Data]
    DECODE_QR --> EXTRACT_ID[Extract QR Code ID]
    
    CAPTURE_IMG --> PREPROCESS[Preprocess Image]
    PREPROCESS --> RESIZE[Resize & Normalize]
    RESIZE --> ENHANCE[Enhance Quality]
    
    EXTRACT_ID --> AI_ANALYSIS
    ENHANCE --> AI_ANALYSIS[Start AI Analysis]
    
    AI_ANALYSIS --> PARALLEL{Parallel Processing}
    
    PARALLEL --> OCR[Tesseract OCR<br/>Text Extraction]
    PARALLEL --> CV[TensorFlow.js<br/>Visual Analysis]
    PARALLEL --> PATTERN[Pattern Matching<br/>Drug Database]
    PARALLEL --> EXTERNAL[External APIs<br/>Google Vision/Hugging Face]
    
    OCR --> COMBINE[Combine AI Results]
    CV --> COMBINE
    PATTERN --> COMBINE
    EXTERNAL --> COMBINE
    
    COMBINE --> CALC_CONF[Calculate Confidence Score]
    CALC_CONF --> CHECK_CONF{Confidence<br/>> 70%?}
    
    CHECK_CONF -->|No| LOW_CONF[Low Confidence Warning]
    LOW_CONF --> MANUAL[Suggest Manual Verification]
    MANUAL --> END1([End])
    
    CHECK_CONF -->|Yes| BC_VERIFY[Query Blockchain]
    BC_VERIFY --> BC_FOUND{Found on<br/>Blockchain?}
    
    BC_FOUND -->|No| NOT_FOUND[Not Found - High Risk]
    NOT_FOUND --> RISK_HIGH[Set Risk Level: CRITICAL]
    RISK_HIGH --> WARN[Show Warning]
    WARN --> LOG_ATTEMPT[Log Verification]
    
    BC_FOUND -->|Yes| CHECK_EXPIRY{Expiry Date<br/>Valid?}
    CHECK_EXPIRY -->|No| EXPIRED[Drug Expired]
    EXPIRED --> RISK_MED[Set Risk Level: HIGH]
    
    CHECK_EXPIRY -->|Yes| CHECK_SCAN{Previously<br/>Scanned?}
    CHECK_SCAN -->|Yes Multiple Times| MULTI_SCAN[Multiple Scans Detected]
    MULTI_SCAN --> RISK_MED
    
    CHECK_SCAN -->|No/First Time| AUTHENTIC[Authentic Drug]
    AUTHENTIC --> RISK_LOW[Set Risk Level: LOW]
    
    RISK_LOW --> SUCCESS_RESULT
    RISK_MED --> SUCCESS_RESULT[Prepare Results]
    
    SUCCESS_RESULT --> UPDATE_BC[Update Blockchain<br/>Scan Count]
    UPDATE_BC --> LOG_ATTEMPT
    LOG_ATTEMPT --> SAVE_HISTORY[Save to User History]
    SAVE_HISTORY --> DISPLAY[Display Verification Results]
    DISPLAY --> END2([End])
    
    style START fill:#4CAF50,color:#fff
    style END1 fill:#FF9800,color:#fff
    style END2 fill:#4CAF50,color:#fff
    style BC_VERIFY fill:#9C27B0,color:#fff
    style UPDATE_BC fill:#9C27B0,color:#fff
    style OCR fill:#2196F3,color:#fff
    style CV fill:#2196F3,color:#fff
    style PATTERN fill:#2196F3,color:#fff
    style EXTERNAL fill:#2196F3,color:#fff
```

## 4. QR Code Generation Flow

```mermaid
flowchart TD
    START([Generate QR Request]) --> INPUT[Receive Batch Data]
    INPUT --> VALIDATE{Valid Batch<br/>Data?}
    
    VALIDATE -->|No| ERROR[Return Validation Error]
    ERROR --> END1([End])
    
    VALIDATE -->|Yes| GEN_ID[Generate Unique QR ID]
    GEN_ID --> CREATE_DATA[Create QR Metadata]
    CREATE_DATA --> METADATA{Include?}
    
    METADATA --> DRUG_NAME[Drug Name]
    METADATA --> BATCH_ID[Batch ID]
    METADATA --> MFG[Manufacturer]
    METADATA --> EXPIRY[Expiry Date]
    METADATA --> MFG_DATE[Manufacturing Date]
    METADATA --> NAFDAC[NAFDAC Number]
    
    DRUG_NAME --> COMBINE
    BATCH_ID --> COMBINE
    MFG --> COMBINE
    EXPIRY --> COMBINE
    MFG_DATE --> COMBINE
    NAFDAC --> COMBINE[Combine Metadata]
    
    COMBINE --> JSON[Convert to JSON]
    JSON --> ENCODE[Encode to Base64]
    ENCODE --> GEN_QR[Generate QR Image]
    
    GEN_QR --> SET_OPTIONS[Set QR Options]
    SET_OPTIONS --> ERROR_CORR[Error Correction: M]
    SET_OPTIONS --> SIZE[Size: 300x300]
    SET_OPTIONS --> COLORS[Colors: B&W]
    
    ERROR_CORR --> CREATE_IMG
    SIZE --> CREATE_IMG
    COLORS --> CREATE_IMG[Create QR Image]
    
    CREATE_IMG --> SAVE_FILE[Save to File Storage]
    SAVE_FILE --> BC_RECORD[Record on Blockchain]
    BC_RECORD --> BC_SUCCESS{Success?}
    
    BC_SUCCESS -->|No| BC_ERROR[Blockchain Error]
    BC_ERROR --> RETRY{Retry?}
    RETRY -->|Yes| BC_RECORD
    RETRY -->|No| END2([End with Error])
    
    BC_SUCCESS -->|Yes| SAVE_DB[Save to MongoDB]
    SAVE_DB --> RETURN[Return QR Data]
    RETURN --> END3([End Success])
    
    style START fill:#4CAF50,color:#fff
    style END1 fill:#f44336,color:#fff
    style END2 fill:#f44336,color:#fff
    style END3 fill:#4CAF50,color:#fff
    style BC_RECORD fill:#9C27B0,color:#fff
```

## 5. AI/ML Analysis Flow

```mermaid
flowchart TD
    START([Drug Image Input]) --> CHECK_SIZE{Image Size<br/>< 10MB?}
    
    CHECK_SIZE -->|No| COMPRESS[Compress Image]
    COMPRESS --> PREPROCESS
    CHECK_SIZE -->|Yes| PREPROCESS[Preprocess Image]
    
    PREPROCESS --> SHARP[Sharp Processing]
    SHARP --> RESIZE[Resize: 800x800]
    RESIZE --> QUALITY[Quality: 90%]
    QUALITY --> FORMAT[Format: JPEG]
    FORMAT --> BUFFER[Create Buffer]
    
    BUFFER --> FORK{Fork Processing}
    
    FORK --> PATH1[Path 1: OCR]
    FORK --> PATH2[Path 2: Computer Vision]
    FORK --> PATH3[Path 3: Pattern Matching]
    FORK --> PATH4[Path 4: External APIs]
    
    PATH1 --> TESSERACT[Tesseract.js OCR]
    TESSERACT --> EXTRACT_TEXT[Extract Text]
    EXTRACT_TEXT --> PARSE_TEXT[Parse Drug Info]
    PARSE_TEXT --> TEXT_RESULT[Text Results]
    
    PATH2 --> TENSORFLOW[TensorFlow.js]
    TENSORFLOW --> MOBILENET[MobileNet Model]
    MOBILENET --> CLASSIFY[Classify Image]
    CLASSIFY --> FEATURES[Extract Features]
    FEATURES --> CV_RESULT[CV Results]
    
    PATH3 --> DB_LOOKUP[Drug Database Lookup]
    DB_LOOKUP --> MATCH[Pattern Matching]
    MATCH --> DRUG_INFO[Drug Information]
    DRUG_INFO --> DB_RESULT[DB Results]
    
    PATH4 --> GOOGLE[Google Cloud Vision]
    PATH4 --> HUGGING[Hugging Face BiomedCLIP]
    PATH4 --> OPENFDA[OpenFDA API]
    
    GOOGLE --> GOOGLE_RESULT[Google Results]
    HUGGING --> HUGGING_RESULT[Hugging Face Results]
    OPENFDA --> OPENFDA_RESULT[OpenFDA Results]
    
    TEXT_RESULT --> AGGREGATE
    CV_RESULT --> AGGREGATE
    DB_RESULT --> AGGREGATE
    GOOGLE_RESULT --> AGGREGATE
    HUGGING_RESULT --> AGGREGATE
    OPENFDA_RESULT --> AGGREGATE[Aggregate Results]
    
    AGGREGATE --> CALC_CONF[Calculate Confidence]
    CALC_CONF --> WEIGHT[Weighted Scoring]
    WEIGHT --> NORMALIZE[Normalize Scores]
    NORMALIZE --> FINAL_SCORE[Final Confidence Score]
    
    FINAL_SCORE --> ASSESS[Assess Authenticity]
    ASSESS --> VISUAL_CHECK[Visual Analysis]
    VISUAL_CHECK --> COLOR[Color Consistency]
    VISUAL_CHECK --> TEXT_CLARITY[Text Clarity]
    VISUAL_CHECK --> PACKAGING[Packaging Quality]
    
    COLOR --> COMBINE_SCORES
    TEXT_CLARITY --> COMBINE_SCORES
    PACKAGING --> COMBINE_SCORES[Combine Scores]
    
    COMBINE_SCORES --> AUTH_SCORE[Authenticity Score]
    AUTH_SCORE --> RISK{Risk Level?}
    
    RISK -->|< 40| CRITICAL[CRITICAL Risk]
    RISK -->|40-60| HIGH[HIGH Risk]
    RISK -->|60-80| MEDIUM[MEDIUM Risk]
    RISK -->|> 80| LOW[LOW Risk]
    
    CRITICAL --> GENERATE
    HIGH --> GENERATE
    MEDIUM --> GENERATE
    LOW --> GENERATE[Generate Recommendations]
    
    GENERATE --> RETURN[Return Analysis Results]
    RETURN --> END([End])
    
    style START fill:#4CAF50,color:#fff
    style END fill:#4CAF50,color:#fff
    style TESSERACT fill:#2196F3,color:#fff
    style TENSORFLOW fill:#2196F3,color:#fff
    style GOOGLE fill:#9C27B0,color:#fff
    style HUGGING fill:#9C27B0,color:#fff
    style OPENFDA fill:#9C27B0,color:#fff
    style CRITICAL fill:#f44336,color:#fff
    style HIGH fill:#FF9800,color:#fff
    style MEDIUM fill:#FFC107
    style LOW fill:#4CAF50,color:#fff
```

## 6. Blockchain Transaction Flow

```mermaid
flowchart TD
    START([Blockchain Request]) --> CHECK_NET{Network<br/>Connected?}
    
    CHECK_NET -->|No| NET_ERROR[Network Error]
    NET_ERROR --> END1([End])
    
    CHECK_NET -->|Yes| AUTH_WALLET{Wallet<br/>Authorized?}
    
    AUTH_WALLET -->|No| AUTH_ERROR[Authorization Error]
    AUTH_ERROR --> END2([End])
    
    AUTH_WALLET -->|Yes| TYPE{Transaction<br/>Type?}
    
    TYPE -->|Record Batch| BATCH_TX[Prepare Batch Transaction]
    TYPE -->|Record QR| QR_TX[Prepare QR Transaction]
    TYPE -->|Scan QR| SCAN_TX[Prepare Scan Transaction]
    TYPE -->|Verify| VERIFY_TX[Prepare Verify Query]
    
    BATCH_TX --> BUILD_TX
    QR_TX --> BUILD_TX
    SCAN_TX --> BUILD_TX
    VERIFY_TX --> BUILD_QUERY[Build Query]
    
    BUILD_TX[Build Transaction] --> PARAMS[Set Parameters]
    PARAMS --> GAS[Estimate Gas]
    GAS --> SIMULATE[Simulate Contract Call]
    
    SIMULATE --> SIM_SUCCESS{Simulation<br/>Success?}
    
    SIM_SUCCESS -->|No| SIM_ERROR[Simulation Error]
    SIM_ERROR --> ANALYZE[Analyze Error]
    ANALYZE --> FIX{Can Auto-Fix?}
    FIX -->|Yes| ADJUST[Adjust Parameters]
    ADJUST --> SIMULATE
    FIX -->|No| END3([End with Error])
    
    SIM_SUCCESS -->|Yes| SIGN[Sign Transaction]
    SIGN --> SEND[Send to Network]
    SEND --> PENDING[Transaction Pending]
    
    PENDING --> WAIT[Wait for Confirmation]
    WAIT --> CHECK_STATUS{Status?}
    
    CHECK_STATUS -->|Failed| TX_FAILED[Transaction Failed]
    TX_FAILED --> RETRY_CHECK{Retry<br/>Count < 3?}
    RETRY_CHECK -->|Yes| RETRY_DELAY[Wait 2 seconds]
    RETRY_DELAY --> SIGN
    RETRY_CHECK -->|No| END4([End with Failure])
    
    CHECK_STATUS -->|Pending| TIMEOUT{Timeout?}
    TIMEOUT -->|No| WAIT
    TIMEOUT -->|Yes| TIMEOUT_ERROR[Timeout Error]
    TIMEOUT_ERROR --> END5([End])
    
    CHECK_STATUS -->|Success| GET_RECEIPT[Get Transaction Receipt]
    GET_RECEIPT --> EXTRACT[Extract Data]
    EXTRACT --> TX_HASH[Transaction Hash]
    EXTRACT --> BLOCK_NUM[Block Number]
    EXTRACT --> GAS_USED[Gas Used]
    EXTRACT --> EVENTS[Event Logs]
    
    TX_HASH --> SAVE_DB
    BLOCK_NUM --> SAVE_DB
    GAS_USED --> SAVE_DB
    EVENTS --> SAVE_DB[Save to MongoDB]
    
    BUILD_QUERY --> QUERY_BC[Query Blockchain]
    QUERY_BC --> GET_DATA[Get Contract Data]
    GET_DATA --> PARSE_DATA[Parse Response]
    PARSE_DATA --> SAVE_DB
    
    SAVE_DB --> LOG_AUDIT[Log Audit Trail]
    LOG_AUDIT --> RETURN[Return Results]
    RETURN --> END6([End Success])
    
    style START fill:#4CAF50,color:#fff
    style END1 fill:#f44336,color:#fff
    style END2 fill:#f44336,color:#fff
    style END3 fill:#f44336,color:#fff
    style END4 fill:#f44336,color:#fff
    style END5 fill:#FF9800,color:#fff
    style END6 fill:#4CAF50,color:#fff
    style SIMULATE fill:#9C27B0,color:#fff
    style SEND fill:#9C27B0,color:#fff
    style QUERY_BC fill:#9C27B0,color:#fff
```

## 7. User Authentication Flow

```mermaid
flowchart TD
    START([User Visits Site]) --> CHECK_SESSION{Has Valid<br/>Session?}
    
    CHECK_SESSION -->|Yes| VALIDATE_TOKEN[Validate JWT Token]
    VALIDATE_TOKEN --> TOKEN_VALID{Token<br/>Valid?}
    
    TOKEN_VALID -->|Yes| GET_USER[Get User Data]
    GET_USER --> REDIRECT_DASHBOARD[Redirect to Dashboard]
    REDIRECT_DASHBOARD --> END1([End])
    
    TOKEN_VALID -->|No| CLEAR_SESSION[Clear Session]
    CLEAR_SESSION --> LOGIN_PAGE
    
    CHECK_SESSION -->|No| LOGIN_PAGE[Show Login Page]
    LOGIN_PAGE --> ENTER_CRED[User Enters Credentials]
    ENTER_CRED --> SUBMIT[Submit Login Form]
    
    SUBMIT --> VALIDATE_INPUT{Valid Input<br/>Format?}
    VALIDATE_INPUT -->|No| INPUT_ERROR[Show Input Error]
    INPUT_ERROR --> LOGIN_PAGE
    
    VALIDATE_INPUT -->|Yes| RATE_LIMIT{Rate Limit<br/>OK?}
    RATE_LIMIT -->|No| RATE_ERROR[Too Many Attempts]
    RATE_ERROR --> WAIT[Wait Period]
    WAIT --> LOGIN_PAGE
    
    RATE_LIMIT -->|Yes| CHECK_DB[Query Database]
    CHECK_DB --> USER_FOUND{User<br/>Exists?}
    
    USER_FOUND -->|No| AUTH_FAIL[Authentication Failed]
    AUTH_FAIL --> LOG_FAIL[Log Failed Attempt]
    LOG_FAIL --> ERROR_MSG[Show Error Message]
    ERROR_MSG --> LOGIN_PAGE
    
    USER_FOUND -->|Yes| CHECK_PASS{Password<br/>Correct?}
    CHECK_PASS -->|No| AUTH_FAIL
    
    CHECK_PASS -->|Yes| CHECK_AUTH{User<br/>Authorized?}
    CHECK_AUTH -->|No| NOT_AUTH[Not Authorized]
    NOT_AUTH --> CONTACT[Show Contact Admin]
    CONTACT --> END2([End])
    
    CHECK_AUTH -->|Yes| GEN_JWT[Generate JWT Token]
    GEN_JWT --> SET_SESSION[Set Session Cookie]
    SET_SESSION --> UPDATE_LOGIN[Update Last Login]
    UPDATE_LOGIN --> LOG_SUCCESS[Log Successful Login]
    LOG_SUCCESS --> CHECK_ROLE{User Role?}
    
    CHECK_ROLE -->|Manufacturer| MANU_DASH[Manufacturer Dashboard]
    CHECK_ROLE -->|Pharmacist| PHAR_DASH[Pharmacist Dashboard]
    CHECK_ROLE -->|Consumer| CONS_DASH[Consumer Dashboard]
    CHECK_ROLE -->|Regulatory| REG_DASH[Regulatory Dashboard]
    CHECK_ROLE -->|Admin| ADMIN_DASH[Admin Dashboard]
    
    MANU_DASH --> END3
    PHAR_DASH --> END3
    CONS_DASH --> END3
    REG_DASH --> END3
    ADMIN_DASH --> END3([End])
    
    style START fill:#4CAF50,color:#fff
    style END1 fill:#4CAF50,color:#fff
    style END2 fill:#FF9800,color:#fff
    style END3 fill:#4CAF50,color:#fff
    style AUTH_FAIL fill:#f44336,color:#fff
```

## 8. Error Handling & Recovery Flow

```mermaid
flowchart TD
    START([Error Detected]) --> CLASSIFY{Error Type?}
    
    CLASSIFY -->|Validation Error| VAL_ERROR[Validation Error]
    CLASSIFY -->|Network Error| NET_ERROR[Network Error]
    CLASSIFY -->|Blockchain Error| BC_ERROR[Blockchain Error]
    CLASSIFY -->|Database Error| DB_ERROR[Database Error]
    CLASSIFY -->|AI/ML Error| AI_ERROR[AI/ML Error]
    CLASSIFY -->|Authentication Error| AUTH_ERROR[Authentication Error]
    CLASSIFY -->|Unknown Error| UNKNOWN[Unknown Error]
    
    VAL_ERROR --> LOG_VAL[Log Validation Details]
    LOG_VAL --> VAL_MSG[User-Friendly Message]
    VAL_MSG --> SUGGEST_FIX[Suggest Fix]
    SUGGEST_FIX --> RETURN_VAL[Return 400]
    RETURN_VAL --> END1([End])
    
    NET_ERROR --> LOG_NET[Log Network Issue]
    LOG_NET --> CHECK_RETRY{Can Retry?}
    CHECK_RETRY -->|Yes| RETRY_COUNT{Retry<br/>< 3?}
    RETRY_COUNT -->|Yes| WAIT_RETRY[Wait 2s]
    WAIT_RETRY --> RETRY[Retry Operation]
    RETRY --> SUCCESS{Success?}
    SUCCESS -->|Yes| RECOVERED[Operation Recovered]
    RECOVERED --> END2([End])
    SUCCESS -->|No| RETRY_COUNT
    RETRY_COUNT -->|No| FINAL_FAIL[Final Failure]
    CHECK_RETRY -->|No| FINAL_FAIL
    FINAL_FAIL --> NET_MSG[Network Error Message]
    NET_MSG --> RETURN_503[Return 503]
    RETURN_503 --> END3([End])
    
    BC_ERROR --> LOG_BC[Log Blockchain Error]
    LOG_BC --> BC_TYPE{BC Error<br/>Type?}
    BC_TYPE -->|Gas| GAS_ERROR[Insufficient Gas]
    BC_TYPE -->|Revert| REVERT_ERROR[Transaction Reverted]
    BC_TYPE -->|Timeout| TIMEOUT_ERROR[Timeout]
    GAS_ERROR --> ADJUST_GAS[Adjust Gas Limit]
    ADJUST_GAS --> RETRY_BC[Retry Transaction]
    REVERT_ERROR --> CHECK_PERMS[Check Permissions]
    CHECK_PERMS --> AUTH_ISSUE[Authorization Issue]
    TIMEOUT_ERROR --> CHECK_NET[Check Network Status]
    CHECK_NET --> RETRY_BC
    AUTH_ISSUE --> BC_MSG[Blockchain Error Message]
    RETRY_BC --> BC_SUCCESS{Success?}
    BC_SUCCESS -->|Yes| END4([End])
    BC_SUCCESS -->|No| BC_MSG
    BC_MSG --> RETURN_503_BC[Return 503]
    RETURN_503_BC --> END5([End])
    
    DB_ERROR --> LOG_DB[Log Database Error]
    LOG_DB --> DB_TYPE{DB Error<br/>Type?}
    DB_TYPE -->|Connection| CONN_ERROR[Connection Lost]
    DB_TYPE -->|Duplicate| DUP_ERROR[Duplicate Key]
    DB_TYPE -->|Timeout| DB_TIMEOUT[Query Timeout]
    CONN_ERROR --> RECONNECT[Reconnect Database]
    RECONNECT --> RETRY_DB[Retry Query]
    DUP_ERROR --> DUP_MSG[Duplicate Record Message]
    DUP_MSG --> RETURN_409[Return 409]
    RETURN_409 --> END6([End])
    DB_TIMEOUT --> OPTIMIZE[Optimize Query]
    OPTIMIZE --> RETRY_DB
    RETRY_DB --> DB_SUCCESS{Success?}
    DB_SUCCESS -->|Yes| END7([End])
    DB_SUCCESS -->|No| DB_MSG[Database Error Message]
    DB_MSG --> RETURN_500[Return 500]
    RETURN_500 --> END8([End])
    
    AI_ERROR --> LOG_AI[Log AI Error]
    LOG_AI --> AI_TYPE{AI Error<br/>Type?}
    AI_TYPE -->|Model Load| MODEL_ERROR[Model Load Failed]
    AI_TYPE -->|Inference| INFERENCE_ERROR[Inference Failed]
    AI_TYPE -->|Timeout| AI_TIMEOUT[AI Timeout]
    MODEL_ERROR --> FALLBACK[Use Fallback Model]
    INFERENCE_ERROR --> FALLBACK
    AI_TIMEOUT --> REDUCE_QUALITY[Reduce Image Quality]
    REDUCE_QUALITY --> RETRY_AI[Retry Analysis]
    FALLBACK --> RETRY_AI
    RETRY_AI --> AI_SUCCESS{Success?}
    AI_SUCCESS -->|Yes| PARTIAL[Partial Results]
    PARTIAL --> END9([End])
    AI_SUCCESS -->|No| AI_MSG[AI Error Message]
    AI_MSG --> MANUAL[Suggest Manual Check]
    MANUAL --> RETURN_503_AI[Return 503]
    RETURN_503_AI --> END10([End])
    
    AUTH_ERROR --> LOG_AUTH[Log Auth Error]
    LOG_AUTH --> AUTH_MSG[Authentication Required]
    AUTH_MSG --> REDIRECT_LOGIN[Redirect to Login]
    REDIRECT_LOGIN --> RETURN_401[Return 401]
    RETURN_401 --> END11([End])
    
    UNKNOWN --> LOG_UNKNOWN[Log Full Error]
    LOG_UNKNOWN --> CAPTURE_STACK[Capture Stack Trace]
    CAPTURE_STACK --> NOTIFY[Notify Admin]
    NOTIFY --> GENERIC_MSG[Generic Error Message]
    GENERIC_MSG --> RETURN_500_GEN[Return 500]
    RETURN_500_GEN --> END12([End])
    
    style START fill:#f44336,color:#fff
    style END2 fill:#4CAF50,color:#fff
    style END4 fill:#4CAF50,color:#fff
    style END7 fill:#4CAF50,color:#fff
    style END9 fill:#FF9800,color:#fff
    style RECOVERED fill:#4CAF50,color:#fff
```

## 9. Report Generation Flow

```mermaid
flowchart TD
    START([Generate Report Request]) --> AUTH{User<br/>Authorized?}
    
    AUTH -->|No| AUTH_ERROR[Authorization Error]
    AUTH_ERROR --> END1([End])
    
    AUTH -->|Yes| TYPE{Report<br/>Type?}
    
    TYPE -->|Pharmacist| PHAR_REPORT[Pharmacist Report]
    TYPE -->|Manufacturer| MANU_REPORT[Manufacturer Report]
    TYPE -->|Regulatory| REG_REPORT[Regulatory Report]
    TYPE -->|Consumer| CONS_REPORT[Consumer Report]
    
    PHAR_REPORT --> PHAR_DATA{Data Type?}
    PHAR_DATA -->|Inventory| INV_DATA[Query Inventory]
    PHAR_DATA -->|Scans| SCAN_DATA[Query Scan History]
    PHAR_DATA -->|Suspicious| SUSP_DATA[Query Suspicious Drugs]
    
    MANU_REPORT --> MANU_DATA{Data Type?}
    MANU_DATA -->|Batches| BATCH_DATA[Query Batches]
    MANU_DATA -->|QR Codes| QR_DATA[Query QR Codes]
    MANU_DATA -->|Analytics| ANALYTICS_DATA[Query Analytics]
    
    REG_REPORT --> REG_DATA{Data Type?}
    REG_DATA -->|Compliance| COMP_DATA[Query Compliance]
    REG_DATA -->|Manufacturers| MFG_DATA[Query Manufacturers]
    REG_DATA -->|Counterfeit| FAKE_DATA[Query Counterfeits]
    
    CONS_REPORT --> CONS_DATA{Data Type?}
    CONS_DATA -->|History| HIST_DATA[Query History]
    CONS_DATA -->|Issues| ISSUE_DATA[Query Issues]
    
    INV_DATA --> AGGREGATE
    SCAN_DATA --> AGGREGATE
    SUSP_DATA --> AGGREGATE
    BATCH_DATA --> AGGREGATE
    QR_DATA --> AGGREGATE
    ANALYTICS_DATA --> AGGREGATE
    COMP_DATA --> AGGREGATE
    MFG_DATA --> AGGREGATE
    FAKE_DATA --> AGGREGATE
    HIST_DATA --> AGGREGATE
    ISSUE_DATA --> AGGREGATE[Aggregate Data]
    
    AGGREGATE --> PROCESS[Process Data]
    PROCESS --> CALCULATE[Calculate Statistics]
    CALCULATE --> METRICS[Generate Metrics]
    METRICS --> FORMAT{Output<br/>Format?}
    
    FORMAT -->|PDF| GEN_PDF[Generate PDF]
    FORMAT -->|CSV| GEN_CSV[Generate CSV]
    FORMAT -->|JSON| GEN_JSON[Generate JSON]
    FORMAT -->|Excel| GEN_EXCEL[Generate Excel]
    
    GEN_PDF --> SAVE
    GEN_CSV --> SAVE
    GEN_JSON --> SAVE
    GEN_EXCEL --> SAVE[Save Report]
    
    SAVE --> LOG[Log Generation]
    LOG --> NOTIFY_USER[Notify User]
    NOTIFY_USER --> DOWNLOAD[Provide Download Link]
    DOWNLOAD --> END2([End])
    
    style START fill:#4CAF50,color:#fff
    style END1 fill:#f44336,color:#fff
    style END2 fill:#4CAF50,color:#fff
```

## 10. System Health Check Flow

```mermaid
flowchart TD
    START([Health Check Request]) --> CHECK_API{API<br/>Responsive?}
    
    CHECK_API -->|No| API_DOWN[API Down]
    API_DOWN --> STATUS_FAIL
    
    CHECK_API -->|Yes| CHECK_DB{Database<br/>Connected?}
    
    CHECK_DB -->|No| DB_DOWN[Database Down]
    DB_DOWN --> STATUS_FAIL
    
    CHECK_DB -->|Yes| CHECK_BC{Blockchain<br/>Accessible?}
    
    CHECK_BC -->|No| BC_DOWN[Blockchain Down]
    BC_DOWN --> STATUS_DEGRADED
    
    CHECK_BC -->|Yes| CHECK_AI{AI Services<br/>Available?}
    
    CHECK_AI -->|No| AI_DOWN[AI Services Down]
    AI_DOWN --> STATUS_DEGRADED
    
    CHECK_AI -->|Yes| CHECK_PERF{Performance<br/>OK?}
    
    CHECK_PERF -->|No| SLOW[System Slow]
    SLOW --> STATUS_DEGRADED
    
    CHECK_PERF -->|Yes| CHECK_DISK{Disk Space<br/>OK?}
    
    CHECK_DISK -->|No| DISK_FULL[Disk Space Low]
    DISK_FULL --> STATUS_DEGRADED
    
    CHECK_DISK -->|Yes| CHECK_MEM{Memory<br/>OK?}
    
    CHECK_MEM -->|No| MEM_HIGH[Memory High]
    MEM_HIGH --> STATUS_DEGRADED
    
    CHECK_MEM -->|Yes| STATUS_OK[Status: Healthy]
    
    STATUS_OK --> COLLECT_METRICS[Collect Metrics]
    STATUS_DEGRADED[Status: Degraded] --> COLLECT_METRICS
    STATUS_FAIL[Status: Failed] --> COLLECT_METRICS
    
    COLLECT_METRICS --> UPTIME[System Uptime]
    COLLECT_METRICS --> RESPONSE[Response Time]
    COLLECT_METRICS --> THROUGHPUT[Throughput]
    COLLECT_METRICS --> ERRORS[Error Rate]
    
    UPTIME --> BUILD_REPORT
    RESPONSE --> BUILD_REPORT
    THROUGHPUT --> BUILD_REPORT
    ERRORS --> BUILD_REPORT[Build Health Report]
    
    BUILD_REPORT --> SAVE_REPORT[Save Report]
    SAVE_REPORT --> ALERT{Status<br/>Failed?}
    
    ALERT -->|Yes| SEND_ALERT[Send Alert to Admin]
    SEND_ALERT --> RETURN
    
    ALERT -->|No| CHECK_DEG{Status<br/>Degraded?}
    CHECK_DEG -->|Yes| SEND_WARN[Send Warning]
    SEND_WARN --> RETURN
    
    CHECK_DEG -->|No| RETURN[Return Health Status]
    RETURN --> END([End])
    
    style START fill:#4CAF50,color:#fff
    style END fill:#4CAF50,color:#fff
    style STATUS_OK fill:#4CAF50,color:#fff
    style STATUS_DEGRADED fill:#FF9800,color:#fff
    style STATUS_FAIL fill:#f44336,color:#fff
```

---

## Summary

These flowcharts provide a comprehensive view of all major processes in the **Shield Drug** platform:

1. **Overall System Flow** - Complete user journey through the system
2. **Manufacturer Batch Upload** - CSV processing, validation, blockchain recording, and QR generation
3. **Drug Verification** - AI/ML analysis, blockchain verification, and risk assessment
4. **QR Code Generation** - Metadata encoding, image creation, and blockchain recording
5. **AI/ML Analysis** - Multi-model parallel processing and confidence scoring
6. **Blockchain Transaction** - Smart contract interaction with retry logic
7. **User Authentication** - Login, session management, and role-based access
8. **Error Handling** - Comprehensive error recovery strategies
9. **Report Generation** - Multi-format report creation for stakeholders
10. **System Health Check** - Monitoring and alerting system

Each flowchart demonstrates the sophisticated logic, error handling, and recovery mechanisms that ensure the platform's reliability and robustness.
